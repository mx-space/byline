import { type BylineClient, createClient } from '@mx-space/byline-api-client'

import { readCredentials, resolveApiCredentials } from './credentials'
import { fetchSession } from './device'

export interface ConnectionFlags {
  'api-url'?: string
  'api-key'?: string
  token?: string
}

export const CONNECTION_OPTIONS = {
  'api-url': { type: 'string' },
  'api-key': { type: 'string' },
  token: { type: 'string' },
} as const

export const CONNECTION_HELP = `  --api-url <url>          Byline API base URL (env BYLINE_API_URL)
  --api-key <key>          API key sent as x-api-key (env BYLINE_API_KEY)
  --token <token>          bearer session token (env BYLINE_TOKEN)

Without --api-key or --token, the session saved by \`byline login\` is used
when its API URL matches.
`

export interface Connection {
  apiUrl: string
  apiKey?: string
  token?: string
}

export const resolveConnection = async (
  flags: ConnectionFlags,
): Promise<Connection | null> => {
  const { apiUrl, apiKey, token, stored } = resolveApiCredentials(
    { apiUrl: flags['api-url'], apiKey: flags['api-key'], token: flags.token },
    process.env,
    await readCredentials(),
  )
  if (!apiUrl || (!apiKey && !token)) return null
  // An invalid bearer token is treated as anonymous, so reads would quietly
  // return public data instead of failing.
  if (token && !apiKey && !(await fetchSession(apiUrl, token))) {
    throw new Error(
      stored
        ? `The saved session for ${apiUrl} is no longer valid; run \`byline login\``
        : `The token is not a valid session for ${apiUrl}`,
    )
  }
  return { apiUrl, apiKey, token }
}

export const MISSING_CONNECTION =
  'An API URL and an API key or token are required; run `byline login` or pass --api-key'

export const connect = async (
  flags: ConnectionFlags,
  options: { required: boolean },
): Promise<BylineClient | null> => {
  const connection = await resolveConnection(flags)
  if (!connection) {
    if (!options.required) return null
    throw new Error(MISSING_CONNECTION)
  }
  return createClient({
    endpoint: connection.apiUrl,
    apiKey: connection.apiKey,
    token: connection.token,
  })
}
