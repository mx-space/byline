export const BYLINE_CLI_CLIENT_ID = 'byline-cli'

const DEVICE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'

export interface DeviceCode {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete?: string
  expires_in: number
  interval: number
}

export interface DeviceToken {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

export interface SessionUser {
  id?: string
  name?: string | null
  email?: string | null
  username?: string | null
}

export interface Session {
  user: SessionUser
  expiresAt?: string
}

export interface DeviceFlowDeps {
  fetch?: typeof globalThis.fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export const authBaseOf = (apiUrl: string) =>
  `${apiUrl.replace(/\/+$/, '')}/auth`

const readBody = async (response: Response) =>
  (await response.json().catch(() => null)) as Record<string, unknown> | null

const describeError = (body: Record<string, unknown> | null, status: number) =>
  String(body?.error_description ?? body?.error ?? body?.message ?? status)

const postJson = (
  fetchImpl: typeof globalThis.fetch,
  url: string,
  body: unknown,
) =>
  fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })

export const requestDeviceCode = async (
  apiUrl: string,
  deps: DeviceFlowDeps = {},
): Promise<DeviceCode> => {
  const fetchImpl = deps.fetch ?? globalThis.fetch
  const response = await postJson(
    fetchImpl,
    `${authBaseOf(apiUrl)}/device/code`,
    {
      client_id: BYLINE_CLI_CLIENT_ID,
      scope: 'openid profile email',
    },
  )
  const body = await readBody(response)
  if (!response.ok || !body?.device_code) {
    throw new Error(
      `Device code request failed: ${describeError(body, response.status)}`,
    )
  }
  return body as unknown as DeviceCode
}

export const pollDeviceToken = async (
  apiUrl: string,
  code: DeviceCode,
  deps: DeviceFlowDeps = {},
): Promise<DeviceToken> => {
  const fetchImpl = deps.fetch ?? globalThis.fetch
  const sleep = deps.sleep ?? defaultSleep
  const now = deps.now ?? Date.now
  const url = `${authBaseOf(apiUrl)}/device/token`
  const deadline = now() + code.expires_in * 1000
  let intervalMs = Math.max(1, code.interval) * 1000

  while (now() < deadline) {
    await sleep(intervalMs)
    const response = await postJson(fetchImpl, url, {
      grant_type: DEVICE_GRANT_TYPE,
      device_code: code.device_code,
      client_id: BYLINE_CLI_CLIENT_ID,
    })
    const body = await readBody(response)
    if (response.ok && body?.access_token) return body as unknown as DeviceToken
    switch (body?.error) {
      case 'authorization_pending': {
        continue
      }
      case 'slow_down': {
        intervalMs += 5000
        continue
      }
      case 'access_denied': {
        throw new Error('The authorization request was denied')
      }
      case 'expired_token': {
        throw new Error('The device code expired; run `byline login` again')
      }
      default: {
        throw new Error(
          `Device token request failed: ${describeError(body, response.status)}`,
        )
      }
    }
  }
  throw new Error('Device authorization timed out; run `byline login` again')
}

export const fetchSession = async (
  apiUrl: string,
  token: string,
  deps: DeviceFlowDeps = {},
): Promise<Session | null> => {
  const fetchImpl = deps.fetch ?? globalThis.fetch
  const response = await fetchImpl(`${authBaseOf(apiUrl)}/get-session`, {
    headers: { accept: 'application/json', authorization: `Bearer ${token}` },
  })
  if (!response.ok) return null
  const body = (await readBody(response)) as {
    user?: SessionUser
    session?: { expiresAt?: string }
  } | null
  if (!body?.user) return null
  return { user: body.user, expiresAt: body.session?.expiresAt }
}
