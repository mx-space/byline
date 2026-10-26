import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import type { SessionUser } from './device'

export interface StoredCredentials {
  apiUrl: string
  token: string
  expiresAt?: string
  user?: SessionUser
}

export interface ApiCredentials {
  apiUrl?: string
  apiKey?: string
  token?: string
  stored: boolean
}

export const credentialsPath = (env: NodeJS.ProcessEnv = process.env) =>
  path.join(
    env.XDG_CONFIG_HOME || path.join(homedir(), '.config'),
    'byline',
    'credentials.json',
  )

export const normalizeApiUrl = (value: string) => {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!URL.canParse(trimmed)) throw new Error(`Invalid API URL "${value}"`)
  return trimmed
}

export const readCredentials = async (
  file = credentialsPath(),
): Promise<StoredCredentials | null> => {
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
  const parsed = JSON.parse(raw) as Partial<StoredCredentials>
  if (typeof parsed.apiUrl !== 'string' || typeof parsed.token !== 'string') {
    throw new Error(`Malformed credentials file ${file}; run \`byline login\``)
  }
  return parsed as StoredCredentials
}

export const writeCredentials = async (
  credentials: StoredCredentials,
  file = credentialsPath(),
) => {
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  await writeFile(file, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  })
  // writeFile's mode only applies on creation; tighten an existing file too.
  await chmod(file, 0o600)
}

export const clearCredentials = async (file = credentialsPath()) => {
  try {
    await rm(file)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

export const resolveApiCredentials = (
  flags: { apiUrl?: string; apiKey?: string; token?: string },
  env: NodeJS.ProcessEnv,
  stored: StoredCredentials | null,
): ApiCredentials => {
  const explicitUrl = flags.apiUrl ?? env.BYLINE_API_URL
  const apiUrl = explicitUrl ? normalizeApiUrl(explicitUrl) : stored?.apiUrl
  const apiKey = flags.apiKey ?? env.BYLINE_API_KEY
  const token = flags.token ?? env.BYLINE_TOKEN
  if (apiKey || token) return { apiUrl, apiKey, token, stored: false }
  if (stored && apiUrl === stored.apiUrl) {
    return { apiUrl, token: stored.token, stored: true }
  }
  return { apiUrl, stored: false }
}
