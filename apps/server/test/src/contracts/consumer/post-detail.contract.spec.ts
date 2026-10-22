import { describe, expect, test } from 'vitest'

import { apiRoutePrefix } from '~/common/decorators/api-controller.decorator'
import { AiInsightsService } from '~/modules/ai/ai-insights/ai-insights.service'
import { AiSummaryService } from '~/modules/ai/ai-summary/ai-summary.service'
import { AiTtsQueryService } from '~/modules/ai/ai-tts/ai-tts-query.service'
import { PostController } from '~/modules/post/post.controller'
import { PostService } from '~/modules/post/post.service'

import {
  assertHasKeys,
  assertHasKeysDeep,
  assertNoLegacyKeys,
  assertPgTimestamps,
} from '../../../helper/api-shape'
import { createE2EApp } from '../../../helper/create-e2e-app'
import {
  translationEntryProvider,
  translationProvider,
} from '../../../mock/processors/translation.mock'

const fixturePost = (overrides: Record<string, unknown> = {}) => ({
  id: '7000000000000000050',
  title: 'Yohaku Post',
  slug: 'yohaku-post',
  text: '# body',
  content: '{"root":{"children":[]}}',
  contentFormat: 'lexical',
  summary: 'short summary',
  tags: ['ts', 'pg'],
  meta: { cover: 'https://x.test/c.png', banner: null, keywords: ['k1'] },
  isPublished: true,
  sourceLang: 'zh-CN',
  image: 'https://x.test/cover.png',
  seo: { title: 'SEO title', description: 'SEO description', image: null },
  pinAt: null,
  pinOrder: null,
  images: [{ src: 'https://x.test/i.png', accent: '#fff' }],
  category: {
    id: '7000000000000000900',
    slug: 'tech',
    name: 'Tech',
    type: 0,
  },
  categoryId: '7000000000000000900',
  authors: [
    {
      id: '7000000000000000700',
      displayName: 'Ada',
      avatar: 'https://x.test/ada.png',
      bio: 'Engine notes',
      url: 'https://ada.test',
    },
  ],
  createdAt: new Date('2024-01-02T00:00:00.000Z'),
  modifiedAt: null,
  ...overrides,
})

const postServiceProvider = {
  provide: PostService,
  useValue: {
    async getPostBySlug(_category: string, slug: string) {
      return fixturePost({ slug })
    },
    async findById(id: string) {
      return fixturePost({ id })
    },
    async findRecent() {
      return [fixturePost()]
    },
    async findBySlug(slug: string) {
      return fixturePost({ slug })
    },
  },
}

const aiInsightsProvider = {
  provide: AiInsightsService,
  useValue: {
    async hasInsightsInLang() {
      return true
    },
  },
}

const aiSummaryProvider = {
  provide: AiSummaryService,
  useValue: {
    async getSummaryForPublicMeta() {
      return null
    },
  },
}

const aiTtsQueryProvider = {
  provide: AiTtsQueryService,
  useValue: {
    async getMetaForArticle() {
      return { available: false }
    },
  },
}

describe('consumer contract — post detail (e2e)', () => {
  const proxy = createE2EApp({
    controllers: [PostController],
    providers: [
      postServiceProvider,
      translationProvider,
      translationEntryProvider,
      aiInsightsProvider,
      aiSummaryProvider,
      aiTtsQueryProvider,
    ],
  })

  test('GET /posts/:category/:slug — exposes the fields consumers render', async () => {
    const res = await proxy.app.inject({
      method: 'GET',
      url: `${apiRoutePrefix}/posts/tech/yohaku-post`,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()

    assertNoLegacyKeys(body)
    assertPgTimestamps(body.data)

    assertHasKeys(body.data, [
      'id',
      'title',
      'slug',
      'text',
      'content_format',
      'summary',
      'tags',
      'meta',
      'images',
      'category',
      'category_id',
      'authors',
      'source_lang',
      'image',
      'seo',
      'created_at',
      'modified_at',
    ])
    expect(body.meta).toBeDefined()
    expect(body.data.has_insights_in_locale).toBeUndefined()
    expect(body.data.enrichments).toBeUndefined()
    expect(body.data.related).toBeUndefined()

    expect(body.data.read_count).toBeUndefined()
    expect(body.data.like_count).toBeUndefined()
    expect(body.meta.related).toBeUndefined()
    expect(body.meta.interaction).toBeUndefined()
    expect(typeof body.meta.insights?.has_in_locale).toBe('boolean')

    assertHasKeysDeep(body.data, [
      'category.slug',
      'category.name',
      'authors.0.display_name',
      'authors.0.avatar',
      'authors.0.bio',
      'authors.0.url',
      'seo.title',
      'seo.description',
    ])
  })
})
