import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { APIError } from 'better-auth/api'
import { username } from 'better-auth/plugins'
import { describe, expect, it, vi } from 'vitest'

import {
  authDatabaseHooks,
  createCredentialSignInHook,
} from '~/modules/auth/auth.implement'
import { validateMxUsername } from '~/modules/auth/auth.username-validator'
import type { CredentialSignInGate } from '~/modules/auth/email-sign-in-gate'

const TEST_PASSWORD = 'strong-password-1'

function createApiWrapper(mockApi: Record<string, any>) {
  const _listUserAccounts = mockApi.listUserAccounts.bind(mockApi)
  return Object.assign(mockApi, {
    getProviders(socialProviders: Record<string, any>) {
      return Object.keys(socialProviders || {})
    },
    async listUserAccounts(params: any) {
      try {
        return await _listUserAccounts(params)
      } catch (error) {
        if (error instanceof APIError) {
          return null
        }
        throw error
      }
    },
  })
}

function buildCredentialAuth(
  getCredentialSignInGate: () => Promise<CredentialSignInGate>,
  options: { allowSignUp?: boolean } = {},
) {
  const database: Record<string, any[]> = {
    account: [],
    session: [],
    user: [],
    verification: [],
  }
  const auth = betterAuth({
    appName: 'byline-test',
    basePath: '/auth',
    baseURL: 'http://localhost',
    database: memoryAdapter(database),
    databaseHooks: options.allowSignUp
      ? { ...authDatabaseHooks, user: undefined }
      : authDatabaseHooks,
    emailAndPassword: { disableSignUp: false, enabled: true },
    hooks: { before: createCredentialSignInHook(getCredentialSignInGate) },
    plugins: [username({ usernameValidator: validateMxUsername })],
    secret: 'test-secret-test-secret-test-secret-12345',
    telemetry: { enabled: false },
    user: {
      additionalFields: {
        handle: { defaultValue: '', type: 'string' },
        permissions: { defaultValue: 1, input: false, type: 'number' },
        isProfileOnly: { defaultValue: false, input: false, type: 'boolean' },
        deactivatedAt: { input: false, required: false, type: 'date' },
      },
    },
  })
  return Object.assign(auth, { database })
}

async function signUp(
  auth: ReturnType<typeof buildCredentialAuth>,
  input: { email: string; name: string; username: string },
) {
  return auth.api.signUpEmail({
    body: { ...input, password: TEST_PASSWORD },
    returnHeaders: true,
  })
}

async function postAuth(
  auth: ReturnType<typeof buildCredentialAuth>,
  path: string,
  body: Record<string, unknown>,
  cookie?: string | null,
) {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  return auth.handler(
    new Request(`http://localhost/auth${path}`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
    }),
  )
}

describe('auth.implement api wrapper', () => {
  describe('listUserAccounts', () => {
    it('should not cause infinite recursion', async () => {
      const original = vi.fn().mockResolvedValue([{ id: '1' }])
      const api = createApiWrapper({ listUserAccounts: original })

      const result = await api.listUserAccounts({ headers: new Headers() })

      expect(result).toEqual([{ id: '1' }])
      expect(original).toHaveBeenCalledTimes(1)
    })

    it('should swallow APIError and return null', async () => {
      const original = vi
        .fn()
        .mockRejectedValue(new APIError('NOT_FOUND', { message: 'not found' }))
      const api = createApiWrapper({ listUserAccounts: original })

      const result = await api.listUserAccounts({ headers: new Headers() })

      expect(result).toBeNull()
    })

    it('should rethrow non-APIError', async () => {
      const original = vi.fn().mockRejectedValue(new Error('db down'))
      const api = createApiWrapper({ listUserAccounts: original })

      await expect(
        api.listUserAccounts({ headers: new Headers() }),
      ).rejects.toThrow('db down')
    })

    it('should call original with correct params', async () => {
      const original = vi.fn().mockResolvedValue([])
      const api = createApiWrapper({ listUserAccounts: original })
      const params = { headers: new Headers({ cookie: 'session=abc' }) }

      await api.listUserAccounts(params)

      expect(original).toHaveBeenCalledWith(params)
    })
  })

  describe('getProviders', () => {
    it('should return provider keys', () => {
      const api = createApiWrapper({ listUserAccounts: vi.fn() })

      expect(api.getProviders({ github: {}, google: {} })).toEqual([
        'github',
        'google',
      ])
    })

    it('should return empty array when no providers', () => {
      const api = createApiWrapper({ listUserAccounts: vi.fn() })

      expect(api.getProviders({})).toEqual([])
    })
  })
})

describe('credential auth endpoints', () => {
  const allowLogin = async () => ({ disablePasswordLogin: false })

  it('enforces the password login gate for email and username sign-in', async () => {
    let gate: CredentialSignInGate = { disablePasswordLogin: false }
    const auth = buildCredentialAuth(async () => gate, { allowSignUp: true })
    await signUp(auth, {
      email: 'owner@example.com',
      name: 'Owner',
      username: 'owner',
    })

    for (const disablePasswordLogin of [false, true]) {
      gate = { disablePasswordLogin }
      const ownerEmail = await postAuth(auth, '/sign-in/email', {
        email: 'owner@example.com',
        password: TEST_PASSWORD,
      })
      const ownerUsername = await postAuth(auth, '/sign-in/username', {
        password: TEST_PASSWORD,
        username: 'owner',
      })

      expect(ownerEmail.status).toBe(disablePasswordLogin ? 401 : 200)
      expect(ownerUsername.status).toBe(disablePasswordLogin ? 401 : 200)
    }
  })

  it('rejects permission changes through update-user', async () => {
    const auth = buildCredentialAuth(allowLogin, { allowSignUp: true })
    const created = await signUp(auth, {
      email: 'writer@example.com',
      name: 'Writer',
      username: 'writer',
    })

    const response = await postAuth(
      auth,
      '/update-user',
      { name: 'Writer', permissions: 0 },
      created.headers.get('set-cookie'),
    )

    expect(response.status).toBe(403)
    expect(auth.database.user[0].permissions).toBe(1)
  })

  it('rejects public sign-up', async () => {
    const auth = buildCredentialAuth(allowLogin)
    const response = await postAuth(auth, '/sign-up/email', {
      email: 'stranger@example.com',
      name: 'Stranger',
      password: TEST_PASSWORD,
      username: 'stranger',
    })

    expect(response.ok).toBe(false)
    expect(auth.database.user).toHaveLength(0)
  })

  it.each([
    ['deactivated', { deactivatedAt: new Date() }],
    ['profile-only', { isProfileOnly: true }],
  ])('refuses to open a session for a %s user', async (_label, patch) => {
    const auth = buildCredentialAuth(allowLogin, { allowSignUp: true })
    await signUp(auth, {
      email: 'gone@example.com',
      name: 'Gone',
      username: 'gone',
    })
    Object.assign(auth.database.user[0], patch)
    const sessionsBefore = auth.database.session.length

    const response = await postAuth(auth, '/sign-in/email', {
      email: 'gone@example.com',
      password: TEST_PASSWORD,
    })

    expect(response.status).toBe(403)
    expect(auth.database.session).toHaveLength(sessionsBefore)
  })
})
