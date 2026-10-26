import { passkeyClient } from '@better-auth/passkey/client'
import { createAuthClient } from 'better-auth/client'
import { genericOAuthClient, usernameClient } from 'better-auth/client/plugins'

import { API_URL } from '~/constants/env'
import { AUTH_BEARER_TOKEN_KEY } from '~/constants/keys'

import { resolveAuthBaseURL } from './auth-base-url'

export function readAuthBearerToken(): null | string {
  return localStorage.getItem(AUTH_BEARER_TOKEN_KEY)
}

export function clearAuthBearerToken() {
  localStorage.removeItem(AUTH_BEARER_TOKEN_KEY)
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(API_URL),
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => readAuthBearerToken() || undefined,
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get('set-auth-token')
      if (authToken) localStorage.setItem(AUTH_BEARER_TOKEN_KEY, authToken)
    },
  },
  plugins: [passkeyClient(), usernameClient(), genericOAuthClient()],
})

export type AuthSocialProviders =
  | 'apple'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'google'
  | 'microsoft'
  | 'spotify'
  | 'twitch'
  | 'twitter'
  | 'dropbox'
  | 'linkedin'
  | 'gitlab'
