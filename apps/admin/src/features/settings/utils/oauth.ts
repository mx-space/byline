import { oauthProviders } from '../constants'
import type {
  FlatOauthProvider,
  OauthOptions,
  OauthProviderType,
} from '../types/settings'

export function flattenOauthOptions(
  data: OauthOptions | undefined,
): Record<OauthProviderType, FlatOauthProvider> {
  const providerMap = new Map(
    (data?.providers ?? []).map((provider) => [provider.type, provider]),
  )

  return Object.fromEntries(
    oauthProviders.map((provider) => {
      const publicFields = { ...data?.public?.[provider.type] }
      return [
        provider.type,
        {
          configured: data?.configuredProviders
            ? data.configuredProviders.includes(provider.type)
            : Object.values(publicFields).some(Boolean),
          enabled: providerMap.get(provider.type)?.enabled ?? false,
          public: publicFields,
          type: provider.type,
        },
      ]
    }),
  ) as Record<OauthProviderType, FlatOauthProvider>
}

export function buildOauthValidationReturnUrl(
  providerId: string,
  href = window.location.href,
) {
  const url = new URL(href)
  const route = new URL(url.hash.slice(1) || '/', url.origin)
  route.searchParams.set('validate', providerId)
  url.hash = `${route.pathname}${route.search}`
  return url.toString()
}
