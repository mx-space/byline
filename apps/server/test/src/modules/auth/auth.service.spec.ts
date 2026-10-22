import { apiKey } from '@better-auth/api-key'
import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { describe, expect, it, vi } from 'vitest'

import { HASHED_API_KEY_CONFIG_ID } from '~/modules/auth/auth.constant'
import { AuthService } from '~/modules/auth/auth.service'

const createService = () => {
  const authRepository = {
    createApiKey: vi.fn(),
    findAccountByProviderAccountId: vi.fn(),
    deleteApiKey: vi.fn(),
    listApiKeysForUser: vi.fn(),
    findApiKeyById: vi.fn(),
    findApiKey: vi.fn(),
  }
  const userRepository = {
    findById: vi.fn().mockResolvedValue({
      id: 'owner-1',
      isProfileOnly: false,
      deactivatedAt: null,
    }),
  }
  const auth = {
    api: {
      createApiKey: vi.fn().mockResolvedValue({
        key: 'txo-created',
        name: 'deploy',
        expiresAt: null,
      }),
      getSession: vi.fn(),
      listUserAccounts: vi.fn(),
    },
  }
  const authInstance = {
    get: vi.fn(() => auth),
  }
  const snowflakeService = {
    nextId: vi.fn(() => '740375270589665280'),
  }
  const service = new AuthService(
    authRepository as any,
    userRepository as any,
    authInstance as any,
    snowflakeService as any,
  )
  return { authInstance, authRepository, userRepository, service }
}

describe('AuthService', () => {
  it('does not expose credential material through session account profiles', async () => {
    const { authRepository, userRepository, service } = createService()
    authRepository.findAccountByProviderAccountId.mockResolvedValue({
      userId: 'owner-1',
      providerId: 'github',
      password: 'password-hash',
      accessToken: 'provider-access',
      refreshToken: 'provider-refresh',
      idToken: 'provider-id',
      raw: { token: 'raw-provider-token' },
    })
    userRepository.findById.mockResolvedValue({
      displayName: 'Owner',
    })
    const profile = await service.getOauthUserAccount('provider-account')
    expect(profile).toMatchObject({ name: 'Owner', provider: 'github' })
    for (const field of [
      'password',
      'accessToken',
      'refreshToken',
      'idToken',
      'raw',
    ])
      expect(profile).not.toHaveProperty(field)
  })

  it('creates Better Auth API keys for the requesting user', async () => {
    const { authInstance, service } = createService()
    const auth = authInstance.get()

    await expect(
      service.createAccessToken({ name: 'deploy' } as any, 'owner-1'),
    ).resolves.toEqual({
      name: 'deploy',
      token: 'txo-created',
      expired: undefined,
    })

    expect(auth.api.createApiKey).toHaveBeenCalledWith({
      body: {
        name: 'deploy',
        userId: 'owner-1',
        configId: 'mx-hashed-v1',
        rateLimitEnabled: false,
      },
    })
  })

  it('hides API keys owned by another user', async () => {
    const { authRepository, service } = createService()
    authRepository.findApiKeyById.mockResolvedValue({
      id: 'key-1',
      referenceId: 'someone-else',
      userId: 'someone-else',
      name: 'other',
      createdAt: new Date(),
      expiresAt: null,
    })

    await expect(service.getToken('key-1', 'owner-1')).resolves.toBeNull()
  })

  it('rejects session users that are deactivated', async () => {
    const { authInstance, userRepository, service } = createService()
    const auth = authInstance.get()
    auth.api.getSession.mockResolvedValue({
      user: { id: 'owner-1' },
      session: { token: 'session-token' },
    })
    auth.api.listUserAccounts.mockResolvedValue([
      { id: 'account-1', accountId: 'owner-1', providerId: 'credential' },
    ])
    userRepository.findById.mockResolvedValue({
      id: 'owner-1',
      isProfileOnly: false,
      deactivatedAt: new Date(),
    })
    const headers = new Headers()
    headers.set('cookie', 'session=1')

    await expect(service.getSessionUserFromHeaders(headers)).resolves.toBeNull()
  })

  it('keeps owner automation tokens usable beyond the provider default daily quota', async () => {
    const { authInstance, service } = createService()
    const now = new Date()
    const auth = betterAuth({
      secret: 'owner-token-quota-regression-test-secret',
      baseURL: 'http://localhost:2333',
      database: memoryAdapter({
        user: [
          {
            id: 'owner-1',
            name: 'Owner',
            email: 'owner@example.com',
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        ],
        apikey: [],
      }),
      plugins: [
        apiKey([
          { configId: 'default', disableKeyHashing: true },
          { configId: HASHED_API_KEY_CONFIG_ID },
        ]),
      ],
      logger: { disabled: true },
    })
    authInstance.get.mockReturnValue(auth as any)
    const { token } = await service.createAccessToken(
      { name: 'bot' } as any,
      'owner-1',
    )

    for (let index = 0; index < 12; index++) {
      const result = await auth.api.verifyApiKey({
        body: { key: token, configId: HASHED_API_KEY_CONFIG_ID },
      })
      expect(result.valid).toBe(true)
    }
  })

  it('extracts API keys from the x-api-key header only', () => {
    const { service } = createService()

    expect(
      service.getApiKeyFromRequest({ headers: { 'x-api-key': 'current' } }),
    ).toEqual({ key: 'current' })
    expect(
      service.getApiKeyFromRequest({ query: { token: 'query' } } as any),
    ).toBeNull()
  })

  it('ignores Authorization: Bearer api-key fallback after narrowing', () => {
    const { service } = createService()

    expect(
      service.getApiKeyFromRequest({
        headers: { authorization: 'Bearer txo-legacy' },
      }),
    ).toBeNull()
    expect(
      service.getApiKeyFromRequest({
        headers: { Authorization: 'Bearer txo-legacy' },
      }),
    ).toBeNull()
  })

  it('uses Authorization bearer headers for session lookup', async () => {
    const { authInstance, service } = createService()
    const auth = authInstance.get()
    auth.api.getSession.mockResolvedValue({
      user: {
        id: 'owner-1',
        email: 'owner@example.com',
      },
      session: { token: 'session-token' },
    })
    auth.api.listUserAccounts.mockResolvedValue([
      {
        id: 'account-1',
        accountId: 'owner-1',
        providerId: 'device',
      },
    ])
    const headers = new Headers()
    headers.set('authorization', 'Bearer device-access-token')

    await expect(service.getSessionUserFromHeaders(headers)).resolves.toEqual(
      expect.objectContaining({
        provider: 'device',
        providerAccountId: 'owner-1',
        user: expect.objectContaining({ id: 'owner-1' }),
      }),
    )

    const sessionHeaders = auth.api.getSession.mock.calls[0][0].headers
    expect(sessionHeaders.get('authorization')).toBe(
      'Bearer device-access-token',
    )
  })
})
