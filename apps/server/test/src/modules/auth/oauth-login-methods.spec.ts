import { UserController } from '~/modules/user/user.controller'

it('advertises newly configured clients immediately without requiring an auth request to reload the runtime', async () => {
  const oauth = {
    providers: [{ type: 'github', enabled: true }],
    public: { github: { clientId: 'github-id' } },
    customClients: [
      {
        id: 'new-client',
        name: 'New client',
        enabled: true,
        protocol: 'oidc',
        clientId: 'client-id',
        discoveryUrl: 'https://identity.example.test/discovery',
        icon: 'https://identity.example.test/icon.png',
      },
      {
        id: 'disabled',
        name: 'Disabled',
        enabled: false,
        protocol: 'oidc',
        clientId: 'disabled-id',
        discoveryUrl: 'https://identity.example.test/discovery',
      },
      {
        id: 'incomplete',
        name: 'Incomplete',
        enabled: true,
        protocol: 'oidc',
        clientId: 'incomplete-id',
      },
    ],
    secrets: {
      github: { clientSecret: 'github-secret' },
      'new-client': { clientSecret: 'custom-secret' },
    },
  }
  const controller = new UserController(
    {} as any,
    {} as any,
    {
      hasPasskey: async () => false,
      hasCredentialAccount: async () => true,
      getOauthProviders: () => [],
    } as any,
    {
      get: async (key: string) =>
        key === 'oauth' ? oauth : { disablePasswordLogin: false },
    } as any,
  )
  const result = await controller.allowLogin()
  expect(result.github).toBe(true)
  expect(result.oauthProviders).toEqual([
    {
      id: 'new-client',
      name: 'New client',
      icon: 'https://identity.example.test/icon.png',
    },
  ])
  expect(JSON.stringify(result)).not.toContain('custom-secret')
  expect(JSON.stringify(result)).not.toContain('client-id')
})
