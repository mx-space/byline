import { OAuthSchema } from '~/modules/configs/configs.schema'
import { ConfigsService } from '~/modules/configs/configs.service'

const client = {
  id: 'team-sso',
  name: 'Team SSO',
  enabled: true,
  protocol: 'oidc',
  clientId: 'byline',
  discoveryUrl:
    'https://identity.example.test/.well-known/openid-configuration',
}

describe('custom OAuth configuration validation', () => {
  it('rejects duplicate client identifiers instead of silently replacing a login method', () => {
    expect(
      OAuthSchema.safeParse({ customClients: [client, client] }).success,
    ).toBe(false)
  })

  it.each(['github', 'google', 'apple', 'passkey', 'credential'])(
    'rejects the reserved client identifier %s',
    (id) => {
      expect(
        OAuthSchema.safeParse({ customClients: [{ ...client, id }] }).success,
      ).toBe(false)
    },
  )

  it('rejects unsafe discovery and icon URLs', () => {
    expect(
      OAuthSchema.safeParse({
        customClients: [{ ...client, discoveryUrl: 'file:///etc/passwd' }],
      }).success,
    ).toBe(false)
    expect(
      OAuthSchema.safeParse({
        customClients: [{ ...client, icon: 'javascript:alert(1)' }],
      }).success,
    ).toBe(false)
  })

  it('requires all OAuth 2.0 endpoints before enabling a client', () => {
    expect(
      OAuthSchema.safeParse({
        customClients: [
          { ...client, protocol: 'oauth2', discoveryUrl: undefined },
        ],
      }).success,
    ).toBe(false)
  })
})

describe('custom OAuth configuration persistence', () => {
  function createService() {
    let cache: string | null = null
    const redis = {
      get: async () => cache,
      set: async (_key: string, value: string) => {
        cache = value
      },
    }
    return new ConfigsService(
      {
        findAll: async () => [
          {
            name: 'oauth',
            value: {
              providers: [{ type: 'github', enabled: true }],
              customClients: [
                client,
                { ...client, id: 'second-sso', name: 'Second SSO' },
              ],
              public: { github: { clientId: 'github-client' } },
              secrets: {
                github: { clientSecret: 'github-secret' },
                'team-sso': { clientSecret: 'team-secret' },
                'second-sso': { clientSecret: 'second-secret' },
              },
            },
          },
        ],
        upsert: async (name: string, value: unknown) => ({ name, value }),
      } as any,
      { getClient: () => redis, waitForReady: async () => {} } as any,
      { bump: async () => {} } as any,
      { emit: () => {} } as any,
    )
  }

  it('updates one client without losing the other client or replacing its stored secret with a blank value', async () => {
    const service = createService()
    await service.patchAndValid('oauth', {
      customClients: [{ ...client, name: 'Renamed SSO' }],
      secrets: { 'team-sso': { clientSecret: '' } },
    } as any)
    const result = (await service.get('oauth')) as any
    expect(
      result.customClients.map((item: any) => [item.id, item.name]),
    ).toEqual([
      ['team-sso', 'Renamed SSO'],
      ['second-sso', 'Second SSO'],
    ])
    expect(result.secrets['team-sso'].clientSecret).toBe('team-secret')
    expect(result.secrets['second-sso'].clientSecret).toBe('second-secret')
  })

  it('removes only the requested custom client and its secret', async () => {
    const service = createService()
    await service.patchAndValid('oauth', {
      removedCustomClients: ['team-sso'],
    } as any)
    const result = (await service.get('oauth')) as any
    expect(result.customClients.map((item: any) => item.id)).toEqual([
      'second-sso',
    ])
    expect(result.secrets['team-sso']).toBeUndefined()
    expect(result.secrets.github.clientSecret).toBe('github-secret')
  })

  it('reports that a secret is stored without returning the secret', async () => {
    const response = (await createService().getForResponse('oauth')) as any
    expect(response.configuredProviders).toContain('team-sso')
    expect(JSON.stringify(response)).not.toContain('team-secret')
    expect(response.customClients[0].id).toBe('team-sso')
  })

  it('rejects enabling a new client without a secret', async () => {
    await expect(
      createService().patchAndValid('oauth', {
        customClients: [{ ...client, id: 'new-sso' }],
      } as any),
    ).rejects.toThrow()
  })

  it('enforces the client limit across incremental saves', async () => {
    await expect(
      createService().patchAndValid('oauth', {
        customClients: Array.from({ length: 49 }, (_, index) => ({
          ...client,
          id: `extra-${index}`,
          enabled: false,
        })),
      } as any),
    ).rejects.toThrow()
  })
})
