import { describe, expect, it, vi } from 'vitest'

import { CollectionRefTypes } from '~/constants/db.constant'
import type { AiOverviewRepository } from '~/modules/ai/ai-overview/ai-overview.repository'
import { AiOverviewService } from '~/modules/ai/ai-overview/ai-overview.service'

const ARTICLES = {
  posts: [
    { id: '300', title: 'Newest post' },
    { id: '100', title: 'Oldest post' },
    { id: '200', title: 'A middle post' },
    { id: '400', title: 'About' },
  ],
}

function createService(
  overrides: {
    repository?: Partial<AiOverviewRepository>
    documents?: Record<string, { meta?: Record<string, unknown> | null }>
    sums?: Array<Record<string, unknown>>
    models?: string[]
    tasks?: Array<Record<string, unknown>>
  } = {},
) {
  const repository = {
    coverageByRefIds: vi.fn(async () => ({
      summary: [],
      insights: [],
      translation: [],
      tts: [],
    })),
    summaryAssets: vi.fn(async () => []),
    insightsAssets: vi.fn(async () => []),
    translationAssets: vi.fn(async () => []),
    ttsAssets: vi.fn(async () => []),
    ...overrides.repository,
  }

  const documents = overrides.documents ?? {}
  const databaseService = {
    findArticlesForProductLists: vi.fn(async () => ARTICLES),
    findArticleIdsByTitle: vi.fn(async () => []),
    findGlobalByIds: vi.fn(async (ids: string[]) => ({
      posts: ARTICLES.posts
        .filter((a) => ids.includes(a.id))
        .map((a) => ({ ...a, ...documents[a.id] })),
    })),
    findGlobalById: vi.fn(async (id: string) => ({
      type: CollectionRefTypes.Post,
      document: { id, title: 'Newest post', ...documents[id] },
    })),
  }

  const configService = {
    get: vi.fn(async () => ({
      summaryTargetLanguages: ['zh', 'en'],
      insightsTargetLanguages: ['zh'],
      translationTargetLanguages: ['zh', 'en', 'ja'],
    })),
  }

  const generationMetrics = {
    attachLatest: vi.fn(async (_type: string, items: unknown[]) =>
      items.map((item) => ({ ...(item as object), generationMetrics: null })),
    ),
    sumByRef: vi.fn(async () => overrides.sums ?? []),
    findModelsByRef: vi.fn(async () => overrides.models ?? []),
  }

  const taskQueueService = {
    getTasks: vi.fn(async () => ({ data: overrides.tasks ?? [], total: 0 })),
  }
  const multilang = {
    computeContentHash: vi.fn((text: string) => `hash:${text}`),
  }

  const service = new AiOverviewService(
    repository as unknown as AiOverviewRepository,
    databaseService as never,
    configService as never,
    generationMetrics as never,
    taskQueueService as never,
    multilang as never,
  )

  return {
    service,
    repository,
    configService,
    databaseService,
    generationMetrics,
    taskQueueService,
    multilang,
  }
}

describe('AiOverviewService.getOverviewGrouped', () => {
  it('lists every article and counts the full set', async () => {
    const { service } = createService()

    const result = await service.getOverviewGrouped({ page: 1, size: 20 })

    expect(result.data.map((row) => row.article.id)).toEqual([
      '400',
      '300',
      '200',
      '100',
    ])
    expect(result.pagination.total).toBe(4)
  })

  it('puts unpublished posts first and public posts by publish time', async () => {
    const { service, databaseService } = createService()
    databaseService.findArticlesForProductLists.mockResolvedValue({
      posts: [
        {
          id: '100',
          title: 'Old',
          isPublished: true,
          createdAt: '2020-01-01T00:00:00.000Z',
        },
        {
          id: '200',
          title: 'Draft',
          isPublished: false,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '300',
          title: 'New',
          isPublished: true,
          publicAt: '2024-06-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    })

    const result = await service.getOverviewGrouped({ page: 1, size: 20 })

    expect(result.data.map((row) => row.article.id)).toEqual([
      '200',
      '300',
      '100',
    ])
  })

  it('includes a never-published draft and keeps its draft id', async () => {
    const { service, databaseService } = createService()
    databaseService.findArticlesForProductLists.mockResolvedValue({
      posts: [
        {
          id: '100',
          title: 'Published',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 'draft-1',
          title: 'Draft only',
          isPublished: false,
          createdAt: '2024-08-01T00:00:00.000Z',
          draftId: 'draft-1',
        },
      ],
    })

    const result = await service.getOverviewGrouped({ page: 1, size: 20 })

    expect(result.data.map((row) => row.article.id)).toEqual(['draft-1', '100'])
    expect(result.data[0].article.draftId).toBe('draft-1')
  })

  it('paginates the ordered set', async () => {
    const { service } = createService()

    const result = await service.getOverviewGrouped({ page: 2, size: 2 })

    expect(result.data.map((row) => row.article.id)).toEqual(['200', '100'])
    expect(result.pagination.hasNextPage).toBe(false)
  })

  it('returns nothing when a search matches no article', async () => {
    const { service, databaseService, repository } = createService()
    databaseService.findArticleIdsByTitle.mockResolvedValue([])

    const result = await service.getOverviewGrouped({
      page: 1,
      size: 20,
      search: 'nope',
    })

    expect(result.data).toEqual([])
    expect(result.pagination.total).toBe(0)
    expect(repository.coverageByRefIds).not.toHaveBeenCalled()
  })

  it('restricts the set to search hits', async () => {
    const { service, databaseService } = createService()
    databaseService.findArticleIdsByTitle.mockResolvedValue(['200'])

    const result = await service.getOverviewGrouped({
      page: 1,
      size: 20,
      search: 'note',
    })

    expect(result.data.map((row) => row.article.id)).toEqual(['200'])
    expect(result.pagination.total).toBe(1)
  })

  it('derives coverage and gaps per article', async () => {
    const { service } = createService({
      documents: { '300': { meta: { lang: 'zh' } } },
      repository: {
        coverageByRefIds: vi.fn(async () => ({
          summary: [{ refId: '300', lang: 'zh' }],
          insights: [],
          translation: [{ refId: '300', lang: 'en', sourceLang: 'zh' }],
          tts: [],
        })),
      },
    })

    const result = await service.getOverviewGrouped({ page: 1, size: 20 })
    const post = result.data.find((row) => row.article.id === '300')!

    expect(post.coverage.sourceLang).toBe('zh')
    expect(post.coverage.summary.langs).toEqual(['zh'])
    expect(post.coverage.translation.expected).toEqual(['en', 'ja'])
    // summary en + insights zh + translation ja + tts zh & en
    expect(post.gapCount).toBe(5)
  })

  it('does not claim a source language for articles without meta.lang', async () => {
    const { service } = createService()

    const result = await service.getOverviewGrouped({ page: 1, size: 20 })

    expect(result.data.every((row) => row.coverage.sourceLang === null)).toBe(
      true,
    )
  })
})

describe('AiOverviewService.getArticleOverview', () => {
  it('marks generated resources whose source no longer matches the article', async () => {
    const { service } = createService({
      documents: { '300': { text: 'current body' } as never },
      repository: {
        summaryAssets: vi.fn(async () => [
          {
            id: 's1',
            hash: 'hash:older body',
            lang: 'zh',
            summary: 'old summary',
            isTranslation: false,
            sourceLang: 'zh',
            createdAt: new Date(),
          },
        ]),
        insightsAssets: vi.fn(async () => [
          {
            id: 'i1',
            hash: 'hash:current body',
            lang: 'zh',
            content: 'current insights',
            isTranslation: false,
            sourceLang: 'zh',
            createdAt: new Date(),
          },
        ]),
      } as never,
    })

    const detail = await service.getArticleOverview('300')

    expect(detail.assets.summary[0].stale).toBe(true)
    expect(detail.assets.insights[0].stale).toBe(false)
  })

  it('sums cost per resource type and across all of them', async () => {
    const { service } = createService({
      models: ['gpt-5-mini'],
      sums: [
        {
          resourceType: 'summary',
          inputTokens: 100,
          outputTokens: 50,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          totalTokens: 150,
          costTotalUsd: 0.001,
          generationCount: 2,
        },
        {
          resourceType: 'translation',
          inputTokens: 400,
          outputTokens: 200,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          totalTokens: 600,
          costTotalUsd: 0.004,
          generationCount: 1,
        },
      ],
    })

    const detail = await service.getArticleOverview('300')

    expect(detail.cost.total.totalTokens).toBe(750)
    expect(detail.cost.total.generationCount).toBe(3)
    expect(detail.cost.total.costTotalUsd).toBeCloseTo(0.005)
    expect(detail.cost.byResourceType.summary.generationCount).toBe(2)
    expect(detail.cost.byResourceType.insights.generationCount).toBe(0)
    expect(detail.cost.models).toEqual(['gpt-5-mini'])
  })

  it('builds coverage from the assets it loaded', async () => {
    const { service } = createService({
      documents: { '300': { meta: { lang: 'zh_cn' } } },
      repository: {
        summaryAssets: vi.fn(async () => [
          { id: 's1', lang: 'zh-CN', summary: 'x', createdAt: new Date() },
        ]),
        translationAssets: vi.fn(async () => [
          {
            id: 't1',
            lang: 'en',
            sourceLang: 'zh-CN',
            aiModel: null,
            createdAt: new Date(),
            updatedAt: null,
          },
        ]),
      } as never,
    })

    const detail = await service.getArticleOverview('300')

    expect(detail.coverage.sourceLang).toBe('zh-CN')
    expect(detail.coverage.summary.langs).toEqual(['zh-CN'])
    expect(detail.coverage.tts.expected).toEqual(['en', 'zh-CN'])
    expect(detail.assets.translation).toHaveLength(1)
  })

  it('rejects an unknown article', async () => {
    const { service, databaseService } = createService()
    databaseService.findGlobalById.mockResolvedValue(null as never)

    await expect(service.getArticleOverview('999')).rejects.toThrow()
  })

  it('canonicalizes the configured target languages while keeping regional variants distinct', async () => {
    const { service, configService } = createService({
      repository: {
        summaryAssets: vi.fn(async () => [
          { id: 's1', lang: 'zh', summary: 'x', createdAt: new Date() },
        ]),
      } as never,
    })
    configService.get.mockResolvedValue({
      summaryTargetLanguages: ['ZH', 'zh'],
      insightsTargetLanguages: ['jp'],
      translationTargetLanguages: ['en_US', 'EN', 'en-us'],
    })

    const detail = await service.getArticleOverview('300')

    expect(detail.coverage.summary.expected).toEqual(['zh'])
    expect(detail.coverage.summary.langs).toEqual(['zh'])
    expect(detail.coverage.insights.expected).toEqual(['ja'])
    expect(detail.coverage.translation.expected).toEqual(['en', 'en-US'])
  })

  it('looks up active tasks for this article only, sub-tasks included', async () => {
    const { service, taskQueueService } = createService()

    await service.getArticleOverview('300')

    expect(taskQueueService.getTasks).toHaveBeenCalledWith(
      expect.objectContaining({ includeSubTasks: true, refId: '300' }),
    )
  })
})
