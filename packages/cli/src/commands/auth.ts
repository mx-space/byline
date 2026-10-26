import { spawn } from 'node:child_process'
import { parseArgs } from 'node:util'

import {
  clearCredentials,
  credentialsPath,
  normalizeApiUrl,
  readCredentials,
  writeCredentials,
} from '../auth/credentials'
import {
  fetchSession,
  pollDeviceToken,
  requestDeviceCode,
  type SessionUser,
} from '../auth/device'

export const LOGIN_HELP = `Usage: byline login [options]

Sign in through the browser (OAuth device flow) and save the session token to
${credentialsPath()}.

Options:
  --api-url <url>   Byline API base URL (env BYLINE_API_URL; defaults to the saved one)
  --no-browser      print the verification link without opening a browser
`

const openBrowser = (url: string) => {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]]
  const child = spawn(command, args, { stdio: 'ignore', detached: true })
  child.on('error', () => {})
  child.unref()
}

const describeUser = (user?: SessionUser) => {
  if (!user) return 'unknown user'
  const name = user.name || user.username || user.email || user.id || 'unknown'
  return user.email && user.email !== name ? `${name} <${user.email}>` : name
}

export const runLogin = async (argv: string[]): Promise<number> => {
  const { values } = parseArgs({
    args: argv,
    options: {
      'api-url': { type: 'string' },
      'no-browser': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (values.help) {
    process.stdout.write(LOGIN_HELP)
    return 0
  }
  const explicitUrl = values['api-url'] ?? process.env.BYLINE_API_URL
  const apiUrl = explicitUrl
    ? normalizeApiUrl(explicitUrl)
    : (await readCredentials())?.apiUrl
  if (!apiUrl) {
    throw new Error(
      'An API URL is required: pass --api-url or set BYLINE_API_URL',
    )
  }

  const code = await requestDeviceCode(apiUrl)
  const link = code.verification_uri_complete ?? code.verification_uri
  process.stdout.write(
    `Open ${link}\nand confirm the code ${code.user_code} (expires in ${Math.round(code.expires_in / 60)} min).\n`,
  )
  if (!values['no-browser']) openBrowser(link)

  const token = await pollDeviceToken(apiUrl, code)
  const session = await fetchSession(apiUrl, token.access_token)
  await writeCredentials({
    apiUrl,
    token: token.access_token,
    expiresAt:
      session?.expiresAt ??
      new Date(Date.now() + token.expires_in * 1000).toISOString(),
    user: session?.user,
  })
  process.stdout.write(
    `Logged in to ${apiUrl} as ${describeUser(session?.user)}\n`,
  )
  return 0
}

export const runLogout = async (): Promise<number> => {
  const removed = await clearCredentials()
  process.stdout.write(removed ? 'Logged out\n' : 'Not logged in\n')
  return 0
}

export const runWhoami = async (): Promise<number> => {
  const stored = await readCredentials()
  if (!stored) {
    process.stderr.write('Not logged in; run `byline login`\n')
    return 1
  }
  const session = await fetchSession(stored.apiUrl, stored.token)
  if (!session) {
    process.stderr.write(
      `The saved session for ${stored.apiUrl} is no longer valid; run \`byline login\`\n`,
    )
    return 1
  }
  await writeCredentials({
    ...stored,
    user: session.user,
    expiresAt: session.expiresAt ?? stored.expiresAt,
  })
  process.stdout.write(
    `${describeUser(session.user)}\n${stored.apiUrl}${session.expiresAt ? `\nSession expires ${session.expiresAt}` : ''}\n`,
  )
  return 0
}
