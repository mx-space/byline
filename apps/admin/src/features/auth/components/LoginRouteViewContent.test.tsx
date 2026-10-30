import { ConfigProvider } from '@lobehub/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as motion from 'motion/react-m'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '~/i18n'
import { authClient } from '~/utils/authjs/auth'

import { LoginRouteViewContent } from './LoginRouteViewContent'

vi.mock('~/api/users', () => ({
  getAllowLogin: async () => ({
    password: true,
    passkey: false,
    github: true,
    oauthProviders: [{ id: 'company-sso', name: 'Company SSO' }],
  }),
}))
vi.mock('../utils/check-init', () => ({ checkIsInit: async () => true }))
vi.mock('~/utils/authjs/auth', () => ({
  authClient: {
    signIn: {
      social: vi.fn(async () => ({})),
    },
  },
}))

describe('OAuth sign-in methods', () => {
  it('uses outlined icon buttons and signs in custom and built-in providers through the social route', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    try {
      await act(async () =>
        root.render(
          <ConfigProvider enableCustomFonts={false} motion={motion}>
            <I18nProvider>
              <QueryClientProvider client={client}>
                <MemoryRouter>
                  <LoginRouteViewContent />
                </MemoryRouter>
              </QueryClientProvider>
            </I18nProvider>
          </ConfigProvider>,
        ),
      )
      await vi.waitFor(() =>
        expect(
          container.querySelector('button[aria-label="使用 Company SSO 登录"]'),
        ).not.toBeNull(),
      )
      const custom = container.querySelector<HTMLButtonElement>(
        'button[aria-label="使用 Company SSO 登录"]',
      )!
      expect(custom.dataset.variant).toBe('outlined')
      expect(custom.textContent).toBe('')
      await act(async () => custom.click())
      expect(authClient.signIn.social).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'company-sso' }),
      )
      const github = container.querySelector<HTMLButtonElement>(
        'button[aria-label="使用 GitHub 登录"]',
      )!
      await act(async () => github.click())
      expect(authClient.signIn.social).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'github' }),
      )
    } finally {
      await act(async () => root.unmount())
      client.clear()
      container.remove()
    }
  })
})
