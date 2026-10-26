import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCredentials,
  credentialsPath,
  readCredentials,
  resolveApiCredentials,
  type StoredCredentials,
  writeCredentials,
} from '../src/auth/credentials'
import {
  BYLINE_CLI_CLIENT_ID,
  type DeviceCode,
  fetchSession,
  pollDeviceToken,
  requestDeviceCode,
} from '../src/auth/device'

const API = 'https://cms.example.com/api/v3'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const code: DeviceCode = {
  device_code: 'dev-code',
  user_code: 'ABCD1234',
  verification_uri: 'https://cms.example.com/api/v3/device',
  expires_in: 60,
  interval: 5,
}

const fakeClock = () => {
  let time = 0
  return {
    now: () => time,
    sleep: vi.fn(async (ms: number) => {
      time += ms
    }),
  }
}

describe('device flow', () => {
  it('requests a code for the byline-cli client under /auth', async () => {
    const fetch = vi.fn(async () => json(code))
    await expect(requestDeviceCode(`${API}/`, { fetch })).resolves.toEqual(code)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${API}/auth/device/code`)
    expect(JSON.parse(init.body as string)).toMatchObject({
      client_id: BYLINE_CLI_CLIENT_ID,
    })
  })

  it('surfaces the server error when the client is rejected', async () => {
    const fetch = vi.fn(async () =>
      json(
        {
          error: 'invalid_client',
          error_description: 'unsupported client_id',
        },
        400,
      ),
    )
    await expect(requestDeviceCode(API, { fetch })).rejects.toThrow(
      'unsupported client_id',
    )
  })

  it('polls through pending and slow_down until a token arrives', async () => {
    const clock = fakeClock()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json({ error: 'authorization_pending' }, 400))
      .mockResolvedValueOnce(json({ error: 'slow_down' }, 400))
      .mockResolvedValueOnce(
        json({ access_token: 'tok', token_type: 'Bearer', expires_in: 600 }),
      )
    const token = await pollDeviceToken(API, code, { fetch, ...clock })
    expect(token.access_token).toBe('tok')
    expect(clock.sleep.mock.calls.map(([ms]) => ms)).toEqual([
      5000, 5000, 10_000,
    ])
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${API}/auth/device/token`)
    expect(JSON.parse(init.body as string)).toEqual({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: 'dev-code',
      client_id: BYLINE_CLI_CLIENT_ID,
    })
  })

  it.each([
    ['access_denied', 'denied'],
    ['expired_token', 'expired'],
    ['invalid_grant', 'invalid_grant'],
  ])('fails on %s', async (error, message) => {
    const fetch = vi.fn(async () => json({ error }, 400))
    await expect(
      pollDeviceToken(API, code, { fetch, ...fakeClock() }),
    ).rejects.toThrow(message)
  })

  it('times out once the code lifetime passes', async () => {
    const fetch = vi.fn(async () =>
      json({ error: 'authorization_pending' }, 400),
    )
    await expect(
      pollDeviceToken(API, code, { fetch, ...fakeClock() }),
    ).rejects.toThrow('timed out')
    expect(fetch).toHaveBeenCalledTimes(12)
  })

  it('reads the session with the bearer token', async () => {
    const fetch = vi.fn(async () =>
      json({
        user: { id: '1', name: 'Ada' },
        session: { expiresAt: '2026-11-02T00:00:00.000Z' },
      }),
    )
    await expect(fetchSession(API, 'tok', { fetch })).resolves.toEqual({
      user: { id: '1', name: 'Ada' },
      expiresAt: '2026-11-02T00:00:00.000Z',
    })
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${API}/auth/get-session`)
    expect(init.headers).toMatchObject({ authorization: 'Bearer tok' })
  })

  it('treats a null session as signed out', async () => {
    const fetch = vi.fn(async () => json(null))
    await expect(fetchSession(API, 'tok', { fetch })).resolves.toBeNull()
  })
})

describe('credentials', () => {
  let dir: string
  let file: string

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'byline-creds-'))
    file = path.join(dir, 'byline', 'credentials.json')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('lives under XDG_CONFIG_HOME', () => {
    expect(credentialsPath({ XDG_CONFIG_HOME: dir })).toBe(file)
  })

  it('round-trips with owner-only permissions', async () => {
    const credentials: StoredCredentials = { apiUrl: API, token: 'tok' }
    expect(await readCredentials(file)).toBeNull()
    await writeCredentials(credentials, file)
    expect(await readCredentials(file)).toEqual(credentials)
    expect((await stat(file)).mode & 0o777).toBe(0o600)
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(credentials)
    expect(await clearCredentials(file)).toBe(true)
    expect(await clearCredentials(file)).toBe(false)
  })

  it('tightens permissions of an existing file', async () => {
    await writeCredentials({ apiUrl: API, token: 'old' }, file)
    await chmod(file, 0o644)
    await writeCredentials({ apiUrl: API, token: 'new' }, file)
    expect((await stat(file)).mode & 0o777).toBe(0o600)
  })

  it('rejects a malformed file', async () => {
    await writeCredentials({ apiUrl: API, token: 'tok' }, file)
    await writeFile(file, '{"apiUrl": 1}')
    await expect(readCredentials(file)).rejects.toThrow('byline login')
  })
})

describe('resolveApiCredentials', () => {
  const stored: StoredCredentials = { apiUrl: API, token: 'saved' }

  it('uses the saved session when nothing else is given', () => {
    expect(resolveApiCredentials({}, {}, stored)).toEqual({
      apiUrl: API,
      token: 'saved',
      stored: true,
    })
  })

  it('uses the saved session for the same API URL', () => {
    expect(
      resolveApiCredentials({ apiUrl: `${API}/` }, {}, stored),
    ).toMatchObject({ token: 'saved', stored: true })
  })

  it('ignores the saved session for another API URL', () => {
    expect(
      resolveApiCredentials({ apiUrl: 'http://localhost:2333' }, {}, stored),
    ).toEqual({ apiUrl: 'http://localhost:2333', stored: false })
  })

  it('prefers flags over env over the saved session', () => {
    expect(
      resolveApiCredentials(
        { apiKey: 'flag-key' },
        { BYLINE_API_KEY: 'env-key', BYLINE_TOKEN: 'env-token' },
        stored,
      ),
    ).toEqual({
      apiUrl: API,
      apiKey: 'flag-key',
      token: 'env-token',
      stored: false,
    })
    expect(
      resolveApiCredentials(
        {},
        { BYLINE_API_URL: 'https://other.example.com', BYLINE_TOKEN: 'env' },
        stored,
      ),
    ).toEqual({
      apiUrl: 'https://other.example.com',
      token: 'env',
      stored: false,
    })
  })

  it('returns no credentials without a session or keys', () => {
    expect(resolveApiCredentials({}, {}, null)).toEqual({ stored: false })
  })
})
