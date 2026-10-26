import { describe, expect, test, vi } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { AiInsightsService } from '~/modules/ai/ai-insights/ai-insights.service'
import { AiSummaryService } from '~/modules/ai/ai-summary/ai-summary.service'
import { AiTtsQueryService } from '~/modules/ai/ai-tts/ai-tts-query.service'
import { PostController } from '~/modules/post/post.controller'
import { PostService } from '~/modules/post/post.service'
import { TranslationService } from '~/processors/helper/helper.translation.service'

import { createE2EApp } from '../../../helper/create-e2e-app'
import { authPassHeader } from '../../../mock/guard/auth.guard'
import { translationEntryProvider } from '../../../mock/processors/translation.mock'
import { urlBuilderProvider } from '../../../mock/processors/url-builder.mock'

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: '7000000000000000050',
  title: 'Hello world',
  slug: 'hello-world',
  text: 'body',
  content: '{"root":{"children":[]}}',
  contentFormat: 'lexical',
  summary: null,
  tags: [],
  meta: { customKey: 1 },
  isPublished: true,
  sourceLang: 'en',
  category: {
    id: '7000000000000000900',
    slug: 'product',
    name: 'Product',
    type: 0,
  },
  categoryId: '7000000000000000900',
  authors: [],
  createdAt: new Date('2024-01-02T00:00:00.000Z'),
  modifiedAt: null,
  ...overrides,
})

const published = makePost()
const hidden = makePost({
  id: '7000000000000000051',
  slug: 'hidden-post',
  isPublished: false,
})
const rows = [published, hidden]

const trackers = [
  { slug: '/product/old-hello', targetId: published.id },
  { slug: '/product/old-hidden', targetId: hidden.id },
]

const postRepository = {
  findBySlug: vi.fn(
    async (slug: string, options: { publishedOnly?: boolean } = {}) =>
      rows.find(
        (row) =>
          row.slug === slug && (!options.publishedOnly || row.isPublished),
      ) ?? null,
  ),
  findById: vi.fn(async (id: string) => rows.find((row) => row.id === id)),
}

const slugTrackerService = {
  findLatestTrackerByTrailingSlug: vi.fn(
    async (slug: string) =>
      trackers.find((tracker) => tracker.slug.endsWith(`/${slug}`)) ?? null,
  ),
}

const translateArticle = vi.fn(
  async (options: {
    targetLang?: string
    originalData: Record<string, unknown>
  }) =>
    options.targetLang === 'zh-TW'
      ? {
          ...options.originalData,
          title: '你好世界',
          isTranslated: true,
          sourceLang: 'en',
          availableTranslations: ['zh-TW'],
          translationMeta: {
            sourceLang: 'en',
            targetLang: 'zh-TW',
            translatedAt: new Date('2024-02-01T00:00:00.000Z'),
          },
        }
      : {
          ...options.originalData,
          isTranslated: false,
          sourceLang: 'en',
          availableTranslations: ['zh-TW'],
        },
)

describe('GET /posts/slug/:slug (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [PostController],
    providers: [
      urlBuilderProvider,
      {
        provide: PostService,
        useFactory: () =>
          new PostService(
            postRepository as any,
            {} as any,
            {} as any,
            {} as any,
            slugTrackerService as any,
            {} as any,
            { get: () => null } as any,
            {} as any,
          ),
      },
      { provide: TranslationService, useValue: { translateArticle } },
      translationEntryProvider,
      {
        provide: AiInsightsService,
        useValue: { hasInsightsInLang: async () => false },
      },
      {
        provide: AiSummaryService,
        useValue: { getSummaryForPublicMeta: async () => null },
      },
      {
        provide: AiTtsQueryService,
        useValue: { getMetaForArticle: async () => ({ available: false }) },
      },
    ],
  })

  const get = (path: string, headers: Record<string, any> = {}) =>
    proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/posts/slug/${path}`,
      headers,
    })

  test('returns the post detail by its slug alone', async () => {
    const res = await get('hello-world')
    expect(res.statusCode).toBe(200)
    const body = res.json()

    expect(body.data).toMatchObject({
      id: published.id,
      slug: 'hello-world',
      title: 'Hello world',
      category_id: published.categoryId,
      category: { slug: 'product' },
      meta: { customKey: 1 },
    })
    expect(
      slugTrackerService.findLatestTrackerByTrailingSlug,
    ).not.toHaveBeenCalled()
    expect(body.meta.insights).toEqual({ has_in_locale: false })
    expect(body.meta.translation[published.id].article).toMatchObject({
      is_translated: false,
      available_translations: ['zh-TW'],
    })
  })

  test('responds POST_NOT_FOUND for an unknown slug', async () => {
    const res = await get('missing')
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('POST_NOT_FOUND')
  })

  test('serves the ?lang= translation', async () => {
    const res = await get('hello-world?lang=zh-TW')
    expect(res.statusCode).toBe(200)
    const body = res.json()

    expect(translateArticle).toHaveBeenLastCalledWith(
      expect.objectContaining({ articleId: published.id, targetLang: 'zh-TW' }),
    )
    expect(body.data.title).toBe('你好世界')
    expect(body.meta.translation[published.id].article).toMatchObject({
      is_translated: true,
      target_lang: 'zh-TW',
    })
  })

  test('resolves an old slug through the slug tracker', async () => {
    const res = await get('old-hello')
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toMatchObject({
      id: published.id,
      slug: 'hello-world',
    })
    expect(
      slugTrackerService.findLatestTrackerByTrailingSlug,
    ).toHaveBeenLastCalledWith('old-hello', 'post')
  })

  test('hides unpublished posts from anonymous readers, current or old slug', async () => {
    expect((await get('hidden-post')).statusCode).toBe(404)
    expect((await get('old-hidden')).statusCode).toBe(404)
  })

  test('serves unpublished posts to admins', async () => {
    const res = await get('hidden-post', authPassHeader)
    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(hidden.id)
  })
})
