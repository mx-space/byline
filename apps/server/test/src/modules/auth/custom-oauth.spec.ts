import * as providers from '~/modules/auth/social-providers'
import type { OAuthConfig } from '~/modules/configs/configs.schema'

const options: OAuthConfig = {
  customClients: [
    {
      id: 'company-sso',
      name: 'Company',
      enabled: true,
      protocol: 'oauth2',
      clientId: 'cms',
      authorizationUrl: 'https://identity.example.test/authorize',
      tokenUrl: 'https://identity.example.test/token',
      userInfoUrl: 'https://identity.example.test/userinfo',
      profile: {
        id: 'account.uid',
        email: 'account.mail',
        name: 'account.displayName',
        emailVerified: 'account.verified',
      },
    },
  ],
  secrets: { 'company-sso': { clientSecret: 'fake-secret' } },
}

describe('custom OAuth profile mapping', () => {
  it('maps nested identity fields and keeps a false verification claim untrusted', async () => {
    const [provider] = (providers as any).buildCustomOAuthProviders(
      options,
      'https://cms.example.test',
    )
    expect(
      await provider.mapProfileToUser({
        account: {
          uid: 0,
          mail: 'writer@example.test',
          displayName: 'Writer',
          verified: 'false',
        },
      }),
    ).toMatchObject({
      id: '0',
      email: 'writer@example.test',
      name: 'Writer',
      emailVerified: false,
    })
    expect(
      await provider.mapProfileToUser({
        account: {
          uid: 'author-2',
          mail: 'writer@example.test',
          verified: true,
        },
      }),
    ).toMatchObject({ emailVerified: true })
  })

  it('does not register disabled clients or clients without a secret', () => {
    const build = (providers as any).buildCustomOAuthProviders
    expect(
      build({ ...options, secrets: {} }, 'https://cms.example.test'),
    ).toEqual([])
    expect(
      build(
        {
          ...options,
          customClients: options.customClients!.map((client) => ({
            ...client,
            enabled: false,
          })),
        },
        'https://cms.example.test',
      ),
    ).toEqual([])
  })

  it('rejects a missing or non-scalar subject instead of collapsing multiple accounts into one identifier', () => {
    const [provider] = providers.buildCustomOAuthProviders(
      options,
      'https://cms.example.test',
    )
    expect(() =>
      provider.mapProfileToUser!({
        account: { uid: {}, mail: 'writer@example.test' },
      }),
    ).toThrow()
    expect(() =>
      provider.mapProfileToUser!({
        account: { uid: '', mail: 'writer@example.test' },
      }),
    ).toThrow()
  })
})
