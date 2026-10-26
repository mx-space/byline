import type { BetterAuthOptions } from 'better-auth'
import { APIError } from 'better-auth/api'
import type { GenericOAuthConfig } from 'better-auth/plugins/generic-oauth'

import type { OAuthConfig } from '../configs/configs.schema'
import { signAppleClientSecret } from './apple-client-secret'

type SocialProviders = NonNullable<BetterAuthOptions['socialProviders']>

export function buildSocialProviders(
  oauth: OAuthConfig,
  serverUrl: string,
): SocialProviders {
  const providers: SocialProviders = {}

  for (const provider of oauth.providers || []) {
    if (!provider.enabled) continue

    const type = provider.type
    const config = {
      ...oauth.public?.[type],
      ...oauth.secrets?.[type],
    }
    const redirectURI = `${serverUrl}/auth/callback/${type}`

    switch (type) {
      case 'apple': {
        const { appBundleIdentifier, clientId, keyId, privateKey, teamId } =
          config
        if (!clientId || !keyId || !privateKey || !teamId) break

        providers.apple = async () => ({
          disableImplicitSignUp: true,
          appBundleIdentifier: appBundleIdentifier || undefined,
          clientId,
          clientSecret: await signAppleClientSecret({
            clientId,
            keyId,
            privateKey,
            teamId,
          }),
          redirectURI,
        })
        break
      }

      case 'github': {
        if (!config.clientId || !config.clientSecret) break

        providers.github = {
          disableImplicitSignUp: true,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectURI,
          mapProfileToUser: (profile) => {
            return {
              handle: profile.login,
            }
          },
        }
        break
      }

      case 'google': {
        if (!config.clientId || !config.clientSecret) break

        providers.google = {
          disableImplicitSignUp: true,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectURI,
        }
        break
      }
    }
  }

  return providers
}

function readProfileField(
  profile: Record<string, unknown>,
  path: string,
): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value && typeof value === 'object' && Object.hasOwn(value, key)
          ? (value as Record<string, unknown>)[key]
          : undefined,
      profile,
    )
}

export function buildCustomOAuthProviders(
  oauth: OAuthConfig,
  serverUrl: string,
): GenericOAuthConfig[] {
  return (oauth.customClients ?? []).flatMap((client) => {
    const clientSecret = oauth.secrets?.[client.id]?.clientSecret
    if (!client.enabled || !client.clientId || !clientSecret) return []
    if (
      client.protocol === 'oidc'
        ? !client.discoveryUrl
        : !client.authorizationUrl || !client.tokenUrl || !client.userInfoUrl
    )
      return []
    return [
      {
        providerId: client.id,
        clientId: client.clientId,
        clientSecret,
        discoveryUrl:
          client.protocol === 'oidc' ? client.discoveryUrl : undefined,
        authorizationUrl:
          client.protocol === 'oauth2' ? client.authorizationUrl : undefined,
        tokenUrl: client.protocol === 'oauth2' ? client.tokenUrl : undefined,
        userInfoUrl:
          client.protocol === 'oauth2' ? client.userInfoUrl : undefined,
        scopes:
          client.scopes ??
          (client.protocol === 'oidc' ? ['openid', 'profile', 'email'] : []),
        redirectURI: `${serverUrl.replace(/\/+$/, '')}/auth/oauth2/callback/${client.id}`,
        authentication: client.authentication ?? 'post',
        pkce: true,
        disableSignUp: true,
        disableImplicitSignUp: true,
        mapProfileToUser: (profile) => {
          const id = client.profile?.id
            ? readProfileField(profile, client.profile.id)
            : (profile.id ?? profile.sub)
          if (
            (typeof id !== 'string' || !id) &&
            (typeof id !== 'number' || !Number.isFinite(id))
          ) {
            throw new APIError('BAD_REQUEST', {
              message: 'OAuth provider returned an invalid user identifier',
            })
          }
          const email = readProfileField(
            profile,
            client.profile?.email ?? 'email',
          )
          const name = readProfileField(profile, client.profile?.name ?? 'name')
          const image = client.profile?.image
            ? readProfileField(profile, client.profile.image)
            : (profile.image ?? profile.picture)
          const verified = client.profile?.emailVerified
            ? readProfileField(profile, client.profile.emailVerified)
            : (profile.emailVerified ?? profile.email_verified)
          return {
            id: String(id),
            email: typeof email === 'string' ? email : undefined,
            name: typeof name === 'string' ? name : undefined,
            image: typeof image === 'string' ? image : undefined,
            emailVerified: verified === true,
          }
        },
      },
    ]
  })
}
