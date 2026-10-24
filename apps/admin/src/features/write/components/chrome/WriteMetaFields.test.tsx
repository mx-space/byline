import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '~/i18n'
import { AppTheme } from '~/layouts/app-theme'

import { emptyPostBylineState } from '../../utils/post-byline-state'
import { WriteMetaFields } from './WriteMetaFields'

vi.unmock('~/i18n')

vi.mock('~/api/options', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/api/options')>()),
  getOption: async () => ({}),
}))

describe('scheduled publishing settings', () => {
  it('shows the public link when the scheduled time arrives without a data change', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T11:59:59Z'))
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    try {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <I18nProvider>
              <MemoryRouter>
                <AppTheme>
                  <WriteMetaFields
                    values={{
                      ...emptyPostBylineState,
                      publicAt: '2030-01-01T12:00:00Z',
                      categoryId: '',
                      meta: {},
                      pin: false,
                      pinOrder: '1',
                      publishedAt: '',
                      slug: '',
                      summary: '',
                      tags: '',
                      text: '',
                      title: '',
                    }}
                    published
                    publishedPublicAt="2030-01-01T12:00:00Z"
                    publicPath="https://example.com/scheduled"
                    hasArticle
                    categories={[]}
                    categoriesFailed={false}
                    authorCandidates={[]}
                    coverImages={[]}
                    deletePending={false}
                    generatePending={false}
                    siteDefaultLang="en"
                    slugPrefix="/"
                    tags={[]}
                    unpublishPending={false}
                    view="main"
                    updateField={() => {}}
                    onDelete={() => {}}
                    onGenerate={() => {}}
                    onRetryCategories={() => {}}
                    onUnpublish={() => {}}
                    onViewChange={() => {}}
                  />
                </AppTheme>
              </MemoryRouter>
            </I18nProvider>
          </QueryClientProvider>,
        ),
      )
      expect(
        host.querySelector('a[href="https://example.com/scheduled"]'),
      ).toBeNull()
      await act(async () => vi.advanceTimersByTime(1001))
      expect(
        host.querySelector('a[href="https://example.com/scheduled"]'),
      ).not.toBeNull()
    } finally {
      await act(async () => root.unmount())
      client.clear()
      host.remove()
      vi.useRealTimers()
    }
  })
})
