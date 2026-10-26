import { describe, expect, it, vi } from 'vitest'

import { BYPASS_CASE_TRANSFORM_METADATA } from '~/constants/system.constant'
import { PostController } from '~/modules/post/post.controller'

const lexicalContent = JSON.stringify({ root: { children: [] } })

const makePost = (overrides: Record<string, unknown> = {}) => ({
  id: '7000000000000000060',
  title: 'Original title',
  slug: 'original-title',
  text: 'original body',
  content: lexicalContent,
  contentFormat: 'lexical',
  summary: null,
  tags: [],
  meta: null,
  modifiedAt: null,
  createdAt: new Date('2024-01-01'),
  category: { id: '9000000000000000001', name: 'Tech', slug: 'tech', type: 1 },
  isPublished: true,
  ...overrides,
})

const makeTranslationResult = (overrides: Record<string, unknown> = {}) => ({
  isTranslated: false,
  title: 'Original title',
  text: 'original body',
  summary: null,
  tags: [],
  sourceLang: 'zh',
  availableTranslations: ['en', 'ja'],
  ...overrides,
})

const makeEmptyEntryMaps = () => ({
  entityMaps: new Map(),
  dictMaps: new Map(),
})

type CreateControllerOptions = {
  posts?: Record<string, unknown>[]
  translateArticleFn?: () => Promise<Record<string, unknown>>
  collectArticleTranslationsFn?: () => Promise<{
    results: Map<string, unknown>
    meta: Map<string, unknown>
  }>
  attachEnrichmentsFn?: (
    doc: Record<string, unknown>,
  ) => Promise<{ enrichments: Record<string, unknown> }>
  getTranslationsBatchFn?: () => Promise<ReturnType<typeof makeEmptyEntryMaps>>
  getCachedTitlesFn?: () => Promise<Map<string, string>>
  resolvePostEntitlementFn?: (input: {
    post: { isPremium?: boolean; entitlementReason?: string }
    isOwner: boolean
  }) => Promise<{ reason: string; locked: boolean }>
  resolveArticlePurchaseMetaFn?: () => Promise<{
    enabled: boolean
    price?: { amount: number; currency: string }
  }>
}

const createController = (opts: CreateControllerOptions = {}) => {
  const {
    posts = [],
    translateArticleFn = async () => makeTranslationResult(),
    collectArticleTranslationsFn = async () => ({
      results: new Map(),
      meta: new Map(),
    }),
    attachEnrichmentsFn = async (doc: Record<string, unknown>) => ({
      enrichments: {},
      ...doc,
    }),
    getTranslationsBatchFn = async () => makeEmptyEntryMaps(),
    getCachedTitlesFn = async () => new Map<string, string>(),
    resolvePostEntitlementFn,
    resolveArticlePurchaseMetaFn = async () => ({ enabled: false }),
  } = opts

  const postService = {
    listPaginated: vi.fn(async () => ({
      data: posts,
      pagination: {
        total: posts.length,
        currentPage: 1,
        totalPage: 1,
        size: 10,
      },
    })),
    getPostBySlug: vi.fn(async () => posts[0] ?? null),
    findById: vi.fn(async () => posts[0] ?? null),
  }

  const translationService = {
    translateArticle: vi.fn(translateArticleFn),
    collectArticleTranslations: vi.fn(collectArticleTranslationsFn),
    getCachedTitles: vi.fn(getCachedTitlesFn),
  }

  const enrichmentService = {
    attachEnrichments: vi.fn(attachEnrichmentsFn),
  }

  const translationEntryService = {
    getTranslationsBatch: vi.fn(getTranslationsBatchFn),
  }

  const aiInsightsService = {
    hasInsightsInLang: vi.fn(async () => false),
  }

  const aiSummaryService = {
    getSummaryForPublicMeta: vi.fn(async () => null),
  }

  const aiTtsQueryService = {
    getMetaForArticle: vi.fn(async () => ({ available: false })),
  }

  const snippetService = {
    findSkillBundlesByIds: vi.fn(async () => []),
  }

  const lockedFor = (post: { isPremium?: boolean }, isOwner: boolean) =>
    Boolean(post.isPremium) && !isOwner
  const defaultResolvePostEntitlement = async (input: {
    post: { isPremium?: boolean; entitlementReason?: string }
    isOwner: boolean
  }) => {
    if (!input.post.isPremium) return { reason: 'public', locked: false }
    if (input.post.entitlementReason) {
      const reason = input.post.entitlementReason
      return { reason, locked: reason === 'locked' }
    }
    const locked = lockedFor(input.post, input.isOwner)
    return { reason: locked ? 'locked' : 'owner', locked }
  }
  const entitlementService = {
    isActiveMember: vi.fn(async () => false),
    resolvePostEntitlement: vi.fn(
      resolvePostEntitlementFn ?? defaultResolvePostEntitlement,
    ),
    resolveArticlePurchaseMeta: vi.fn(resolveArticlePurchaseMetaFn),
    resolvePostEntitlements: vi.fn(
      async (input: {
        posts: Array<{ id: unknown; isPremium?: boolean }>
        isOwner: boolean
      }) =>
        new Map(
          input.posts.map((post) => [
            String(post.id),
            { locked: lockedFor(post, input.isOwner) },
          ]),
        ),
    ),
  }

  const urlBuilderService = {
    createPostUrlResolver: vi.fn(
      async () => (post: { slug: string }) =>
        `https://example.com/blog/${post.slug}`,
    ),
  }

  const controller = new PostController(
    postService as any,
    translationService as any,
    aiInsightsService as any,
    aiSummaryService as any,
    aiTtsQueryService as any,
    translationEntryService as any,
    urlBuilderService as any,
  )

  return {
    controller,
    postService,
    translationService,
    enrichmentService,
    translationEntryService,
    snippetService,
    entitlementService,
    aiTtsQueryService,
  }
}

describe('PostController.getPaginate', () => {
  it('drops lexical content and truncates text when truncate is set', async () => {
    const { controller } = createController({
      posts: [makePost({ text: 'x'.repeat(500), content: lexicalContent })],
    })

    const res = await controller.getPaginate({ truncate: 150 } as any, false)

    expect(res.data[0].text).toHaveLength(150)
    expect(res.data[0].content).toBeNull()
  })

  it('keeps content intact when truncate is absent', async () => {
    const { controller } = createController({
      posts: [makePost()],
    })

    const res = await controller.getPaginate({} as any, false)

    expect(res.data[0].text).toBe('original body')
    expect(res.data[0].content).toBe(lexicalContent)
  })

  it('attaches the configured permalink to every item', async () => {
    const { controller } = createController({ posts: [makePost()] })

    const res = await controller.getPaginate({} as any, false)

    expect(res.data[0].url).toBe('https://example.com/blog/original-title')
  })

  it('overwrites title, text, summary, content, category.name in place when translated', async () => {
    const post = makePost({ summary: '中文摘要' })

    const translatedResult = {
      isTranslated: true,
      title: 'Translated title',
      text: 'translated body',
      content: 'translated content',
      contentFormat: 'markdown',
      summary: 'English summary',
      tags: [],
      sourceLang: 'zh',
      translationMeta: {
        sourceLang: 'zh',
        targetLang: 'en',
        translatedAt: new Date('2024-06-01'),
        model: 'claude-haiku',
      },
      availableTranslations: ['en'],
    }

    const translationResults = new Map([[String(post.id), translatedResult]])
    const translationMeta = new Map([
      [
        String(post.id),
        {
          article: {
            isTranslated: true,
            sourceLang: 'zh',
            targetLang: 'en',
            translatedAt: new Date('2024-06-01'),
            model: 'claude-haiku',
            availableTranslations: ['en'],
          },
        },
      ],
    ])

    const entityMap = new Map([[String(post.category!.id), 'Technology']])

    const { controller, enrichmentService, translationService } =
      createController({
        posts: [post],
        collectArticleTranslationsFn: async () => ({
          results: translationResults as any,
          meta: translationMeta as any,
        }),
        getTranslationsBatchFn: async () => ({
          entityMaps: new Map([['category.name', entityMap]]),
          dictMaps: new Map(),
        }),
      })

    const res = await controller.getPaginate({} as any, false, 'en')

    expect(res.data[0].title).toBe('Translated title')
    expect(res.data[0].text).toBe('translated body')
    expect(res.data[0].summary).toBe('English summary')
    expect(res.data[0].content).toBe('translated content')
    expect((res.data[0] as any).category.name).toBe('Technology')

    expect(translationService.collectArticleTranslations).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.arrayContaining(['summary']),
        articles: [
          expect.objectContaining({
            id: String(post.id),
            summary: '中文摘要',
          }),
        ],
      }),
    )

    expect(res.meta?.translation).toBeDefined()
    const translationBlock = (res.meta?.translation as any)?.[String(post.id)]
    expect(translationBlock?.article?.isTranslated).toBe(true)
    expect(translationBlock?.article?.sourceLang).toBe('zh')
    expect(translationBlock?.article?.targetLang).toBe('en')
    expect(translationBlock?.article?.title).toBeUndefined()
    expect(translationBlock?.article?.text).toBeUndefined()
    expect(translationBlock?.article?.content).toBeUndefined()

    expect(enrichmentService.attachEnrichments).not.toHaveBeenCalled()
  })

  it('emits meta.translation only for translated items', async () => {
    const translatedPost = makePost({ id: '7000000000000000061', title: 'A' })
    const untranslatedPost = makePost({ id: '7000000000000000062', title: 'B' })

    const translationResults = new Map([
      [
        String(translatedPost.id),
        {
          isTranslated: true,
          title: 'A translated',
          text: 'body',
          sourceLang: 'zh',
          availableTranslations: [],
        },
      ],
      [
        String(untranslatedPost.id),
        {
          isTranslated: false,
          title: 'B',
          text: 'body',
          sourceLang: 'zh',
          availableTranslations: [],
        },
      ],
    ])

    const translationMeta = new Map([
      [
        String(translatedPost.id),
        {
          article: {
            isTranslated: true,
            sourceLang: 'zh',
            targetLang: 'en',
            availableTranslations: [],
          },
        },
      ],
    ])

    const { controller } = createController({
      posts: [translatedPost, untranslatedPost],
      collectArticleTranslationsFn: async () => ({
        results: translationResults as any,
        meta: translationMeta as any,
      }),
    })

    const res = await controller.getPaginate({} as any, false, 'en')

    const tm = res.meta?.translation as any
    expect(tm?.[String(translatedPost.id)]).toBeDefined()
    expect(tm?.[String(untranslatedPost.id)]).toBeUndefined()

    expect(res.data[0].title).toBe('A translated')
    expect(res.data[1].title).toBe('B')
  })

  it('keeps the original summary when the translation has no summary', async () => {
    const post = makePost({ summary: '中文摘要' })

    const translationResults = new Map([
      [
        String(post.id),
        {
          isTranslated: true,
          title: 'Translated title',
          text: 'translated body',
          summary: null,
          sourceLang: 'zh',
          availableTranslations: ['en'],
        },
      ],
    ])

    const { controller } = createController({
      posts: [post],
      collectArticleTranslationsFn: async () => ({
        results: translationResults as any,
        meta: new Map(),
      }),
    })

    const res = await controller.getPaginate({} as any, false, 'en')

    expect(res.data[0].title).toBe('Translated title')
    expect(res.data[0].summary).toBe('中文摘要')
  })
})

describe('PostController.getByCateAndSlug', () => {
  it('overwrites title, text, content, category.name in place and emits slim meta', async () => {
    const post = makePost()

    const translationResult = {
      isTranslated: true,
      title: 'Translated post title',
      text: 'translated post body',
      content: 'translated post content',
      contentFormat: 'markdown',
      summary: null,
      tags: [],
      sourceLang: 'zh',
      translationMeta: {
        sourceLang: 'zh',
        targetLang: 'en',
        translatedAt: new Date('2024-06-01'),
        model: 'claude-haiku',
      },
      availableTranslations: ['en'],
    }

    const entityMap = new Map([[String(post.category!.id), 'Technology']])

    const attachEnrichmentsSpy = vi.fn(
      async (doc: Record<string, unknown>) => ({
        enrichments: {},
        ...doc,
      }),
    )

    const { controller } = createController({
      posts: [post],
      translateArticleFn: async () => translationResult,
      getTranslationsBatchFn: async () => ({
        entityMaps: new Map([['category.name', entityMap]]),
        dictMaps: new Map(),
      }),
      attachEnrichmentsFn: attachEnrichmentsSpy,
    })

    const res = await controller.getByCateAndSlug(
      { category: 'tech', slug: 'post' },
      {} as any,
      false,
      'en',
    )

    expect(res.data.title).toBe('Translated post title')
    expect(res.data.text).toBe('translated post body')
    expect(res.data.content).toBe('translated post content')
    expect((res.data as any).category?.name).toBe('Technology')

    const tm = res.meta?.translation as any
    const postTm = tm?.[String(post.id)]
    expect(postTm?.article?.isTranslated).toBe(true)
    expect(postTm?.article?.sourceLang).toBe('zh')
    expect(postTm?.article?.targetLang).toBe('en')
    expect(postTm?.article?.title).toBeUndefined()
    expect(postTm?.article?.text).toBeUndefined()
    expect(postTm?.article?.content).toBeUndefined()
    expect(postTm?.article?.contentFormat).toBeUndefined()
  })

  it('attaches the configured permalink to the detail', async () => {
    const { controller } = createController({ posts: [makePost()] })

    const res = await controller.getByCateAndSlug(
      { category: 'tech', slug: 'original-title' },
      {} as any,
      false,
    )

    expect(res.data.url).toBe('https://example.com/blog/original-title')
  })
})

describe('PostController response casing', () => {
  it('keeps post meta keys verbatim on every read route', () => {
    const bypass = (handler: keyof PostController) =>
      Reflect.getMetadata(
        BYPASS_CASE_TRANSFORM_METADATA,
        PostController.prototype[handler],
      )
    expect(bypass('getPaginate')).toEqual(['[].meta'])
    expect(bypass('getLatest')).toEqual(['meta'])
    expect(bypass('getById')).toEqual(['meta'])
    expect(bypass('getByCateAndSlug')).toEqual(['meta'])
  })
})

describe('PostController per-locale SEO', () => {
  const sourceSeo = {
    title: '源标题',
    description: '源描述',
    image: 'https://cdn.example.test/og.png',
  }

  it('merges the translated SEO over the source SEO on a detail read', async () => {
    const { controller } = createController({
      posts: [makePost({ seo: sourceSeo })],
      translateArticleFn: async () =>
        makeTranslationResult({
          isTranslated: true,
          title: 'Translated title',
          seo: { title: 'Translated SEO title' },
        }),
    })

    const res = await controller.getById(
      { id: '7000000000000000060' },
      false,
      'en',
    )

    expect((res.data as any).seo).toEqual({
      title: 'Translated SEO title',
      description: '源描述',
      image: 'https://cdn.example.test/og.png',
    })
  })

  it('merges the translated SEO on list reads and asks for it', async () => {
    const post = makePost({ seo: sourceSeo })
    const { controller, translationService } = createController({
      posts: [post],
      collectArticleTranslationsFn: async () => ({
        results: new Map([
          [
            String(post.id),
            {
              isTranslated: true,
              title: 'Translated title',
              seo: { description: 'Translated description' },
            },
          ],
        ]) as any,
        meta: new Map(),
      }),
    })

    const res = await controller.getPaginate({} as any, false, 'en')

    expect(translationService.collectArticleTranslations).toHaveBeenCalledWith(
      expect.objectContaining({ fields: expect.arrayContaining(['seo']) }),
    )
    expect((res.data[0] as any).seo).toEqual({
      title: '源标题',
      description: 'Translated description',
      image: 'https://cdn.example.test/og.png',
    })
  })
})
