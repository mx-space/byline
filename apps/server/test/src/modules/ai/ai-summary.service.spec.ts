import { describe, expect, it, vi } from 'vitest'

import { createPgRepositoryMock, now } from '@/helper/pg-repository-mock'
import { AppException } from '~/common/errors/exception.types'
import { CollectionRefTypes } from '~/constants/db.constant'
import { MultilangGenerationService } from '~/modules/ai/ai-multilang/ai-multilang.service'
import { AiSummaryAdapter } from '~/modules/ai/ai-summary/ai-summary.adapter'
import type { AiSummaryRepository } from '~/modules/ai/ai-summary/ai-summary.repository'
import { AiSummaryService } from '~/modules/ai/ai-summary/ai-summary.service'
import { AITaskType } from '~/modules/ai/ai-task/ai-task.types'

const createService = () => {
  const repository = createPgRepositoryMock<AiSummaryRepository>()
  const databaseService = {
    findGlobalById: vi.fn(),
    getRefArticleMap: vi.fn().mockResolvedValue({}),
    findArticleIdsByTitle: vi.fn().mockResolvedValue([]),
    findArticlesForProductLists: vi.fn().mockResolvedValue({ posts: [] }),
  }
  const configService = {
    get: vi.fn(),
    waitForConfigReady: vi
      .fn()
      .mockResolvedValue({ ai: { enableSummary: true } }),
  }
  const aiService = {
    getSummaryModel: vi.fn(),
  }
  const aiInFlightService = {
    runWithStream: vi.fn(async (opts: any) => {
      const { result } = await opts.onLeader({ push: async () => {} })
      return {
        events: (async function* () {})(),
        result: Promise.resolve(result),
      }
    }),
  }
  const eventEmitter = { emit: vi.fn() }
  const entitlementService = {
    isPremiumLocked: vi.fn(
      async (input: {
        post: { isPremium?: boolean | null }
        isOwner: boolean
        readerId?: string
      }) => Boolean(input.post.isPremium) && !input.isOwner && !input.readerId,
    ),
  }
  const taskProcessor = { registerHandler: vi.fn() }
  const generationMetrics = {
    attachLatest: vi.fn(async (_type: string, items: unknown[]) =>
      items.map((item) => ({
        ...(item as object),
        generationMetrics: null,
      })),
    ),
    deleteByResource: vi.fn().mockResolvedValue(undefined),
    record: vi.fn().mockResolvedValue(undefined),
  }
  const adapter = new AiSummaryAdapter(
    repository as any,
    databaseService as any,
    configService as any,
    aiService as any,
    eventEmitter as any,
    entitlementService as any,
  )
  const multilang = new MultilangGenerationService(
    aiInFlightService as any,
    generationMetrics as any,
    configService as any,
  )
  const service = new AiSummaryService(
    repository as any,
    databaseService as any,
    configService as any,
    adapter,
    multilang,
    taskProcessor as any,
    generationMetrics as any,
  )
  return {
    aiInFlightService,
    aiService,
    configService,
    databaseService,
    entitlementService,
    eventEmitter,
    generationMetrics,
    repository,
    service,
    taskProcessor,
  }
}

const premiumArticle = {
  type: CollectionRefTypes.Post,
  document: {
    id: 'post-1',
    title: 'Premium Post',
    text: 'Premium text',
    isPublished: true,
    isPremium: true,
  },
}

const visibleArticle = {
  type: CollectionRefTypes.Post,
  document: {
    id: 'post-1',
    title: 'Published Post',
    text: 'Long enough text',
    isPublished: true,
  },
}

const summaryRuntime = () => ({
  generateText: vi.fn(async ({ messages }: any) => {
    const isTranslation = String(messages[0].content).includes('translator')
    return {
      text: isTranslation ? 'translated summary' : '{"summary":"a summary"}',
      usage: {},
    }
  }),
  providerInfo: { id: 'test-provider', model: 'test-model' },
})

function runSummaryTask(
  harness: ReturnType<typeof createService>,
  payload: Record<string, unknown>,
  context?: Record<string, unknown>,
) {
  harness.service.onModuleInit()
  const handler = harness.taskProcessor.registerHandler.mock.calls
    .map(([registered]) => registered)
    .find((registered: any) => registered.type === AITaskType.Summary) as any
  const ctx = {
    taskId: 'task-1',
    isAborted: () => false,
    appendLog: vi.fn(),
    updateProgress: vi.fn(),
    setResult: vi.fn(),
    setStatus: vi.fn(),
    incrementTokens: vi.fn(),
    incrementCost: vi.fn(),
    ...context,
  }
  return handler.execute(payload, ctx as any).then(() => ctx)
}

describe('AiSummaryService', () => {
  it('returns an existing stored summary for a locked premium post', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue(premiumArticle)
    repository.findByRefAndLang.mockResolvedValue({
      id: 'summary-1',
      refId: 'post-1',
      lang: 'zh',
      summary: 'cached',
      hash: 'h',
      createdAt: now,
    })
    vi.spyOn(service as any, 'findValidSummary').mockResolvedValue({
      id: 'summary-1',
      summary: 'cached',
    })

    await expect(
      service.getOrGenerateSummaryForArticle('post-1', {
        lang: 'zh',
        onlyDb: true,
      }),
    ).resolves.toMatchObject({ summary: 'cached' })
  })

  it('serves the summary of a premium post to the owner and an entitled reader', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue(premiumArticle)
    repository.findByRefAndLang.mockResolvedValue({
      id: 'summary-1',
      refId: 'post-1',
      lang: 'zh',
      summary: 'cached',
      hash: 'h',
      createdAt: now,
    })
    vi.spyOn(service as any, 'findValidSummary').mockResolvedValue({
      id: 'summary-1',
      summary: 'cached',
    })

    await expect(
      service.getOrGenerateSummaryForArticle('post-1', {
        lang: 'zh',
        onlyDb: true,
        isOwner: true,
      }),
    ).resolves.toMatchObject({ summary: 'cached' })
    await expect(
      service.getOrGenerateSummaryForArticle('post-1', {
        lang: 'zh',
        onlyDb: true,
        readerId: 'reader-1',
      }),
    ).resolves.toMatchObject({ summary: 'cached' })
  })

  it('updates summaries through the PG repository after existence validation', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue({
      id: 'summary-1',
      refId: 'post-1',
      lang: 'zh',
      summary: 'old',
      hash: 'hash',
      createdAt: now,
    })
    repository.updateSummary.mockResolvedValue({
      id: 'summary-1',
      refId: 'post-1',
      lang: 'zh',
      summary: 'new',
      hash: 'hash',
      createdAt: now,
    })

    await expect(
      service.updateSummaryInDb('summary-1', 'new'),
    ).resolves.toMatchObject({
      id: 'summary-1',
      summary: 'new',
    })
    expect(repository.updateSummary).toHaveBeenCalledWith('summary-1', 'new', {
      isLocked: true,
    })
  })

  it('throws when updating a missing summary row', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue(null)

    await expect(service.updateSummaryInDb('missing', 'new')).rejects.toThrow(
      AppException,
    )
  })

  it('deletes summaries by article id through the PG repository', async () => {
    const { generationMetrics, repository, service } = createService()
    repository.listForRef.mockResolvedValue([
      {
        id: 'summary-1',
        refId: 'post-1',
        lang: 'zh',
        summary: 'old',
        hash: 'hash',
        createdAt: now,
      },
    ])
    repository.deleteForRef.mockResolvedValue(1)

    await service.deleteSummaryByArticleId('post-1')

    expect(repository.deleteForRef).toHaveBeenCalledWith('post-1')
    expect(generationMetrics.deleteByResource).toHaveBeenCalledWith(
      'summary',
      'summary-1',
    )
  })

  it('includes orphan articles with zero summaries in the grouped list', async () => {
    const { databaseService, repository, service } = createService()
    repository.groupedByRef.mockResolvedValue({
      data: [{ refId: 'post-1' }],
      pagination: { total: 1 },
    } as any)
    repository.findDistinctRefIds.mockResolvedValue(['post-1'])
    repository.listByRefIds.mockResolvedValue([
      {
        id: 'summary-1',
        refId: 'post-1',
        lang: 'zh',
        summary: 'Hello',
        hash: 'hash',
        createdAt: now,
      },
    ])
    databaseService.findArticlesForProductLists.mockResolvedValue({
      posts: [
        {
          id: 'post-1',
          title: 'Has Summary',
          isPublished: true,
          createdAt: '2024-02-01T00:00:00.000Z',
        },
        {
          id: 'post-2',
          title: 'Orphan Post',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    })
    databaseService.getRefArticleMap.mockResolvedValue({
      'post-1': {
        id: 'post-1',
        title: 'Has Summary',
        type: CollectionRefTypes.Post,
      },
    })

    const result = await service.getAllSummariesGrouped({
      page: 1,
      size: 10,
    })

    expect(result.pagination).toMatchObject({ total: 2, currentPage: 1 })
    expect(result.data).toEqual([
      {
        article: {
          id: 'post-1',
          title: 'Has Summary',
          type: CollectionRefTypes.Post,
        },
        summaries: [
          expect.objectContaining({ id: 'summary-1', refId: 'post-1' }),
        ],
      },
      {
        article: {
          id: 'post-2',
          title: 'Orphan Post',
          type: CollectionRefTypes.Post,
        },
        summaries: [],
      },
    ])
  })
})

describe('AiSummaryService — summary task pipeline', () => {
  const setup = () => {
    const harness = createService()
    harness.configService.get.mockResolvedValue({
      enableSummary: true,
      summaryTargetLanguages: [],
      translationLangConcurrency: 2,
    })
    harness.databaseService.findGlobalById.mockResolvedValue(visibleArticle)
    harness.aiService.getSummaryModel.mockResolvedValue(summaryRuntime())
    harness.repository.findBaseForRef.mockResolvedValue(null)
    harness.repository.findByRefAndLang.mockResolvedValue(null)
    harness.repository.upsert.mockImplementation(async (input: any) => ({
      id: input.isTranslation ? `summary-${input.lang}` : 'summary-base',
      refId: input.refId,
      lang: input.lang,
      summary: input.summary,
      hash: input.hash,
      isTranslation: input.isTranslation ?? false,
      sourceSummaryId: input.sourceSummaryId ?? null,
      sourceLang: input.sourceLang ?? null,
      createdAt: now,
    }))
    return harness
  }

  it('generates the source-language base first, then translates the other targets from it', async () => {
    const harness = setup()

    const ctx = await runSummaryTask(harness, {
      refId: 'post-1',
      targetLanguages: ['en', 'zh'],
    })

    const upserts = harness.repository.upsert.mock.calls.map(
      ([input]: any[]) => input,
    )
    expect(upserts[0]).toMatchObject({
      lang: 'zh',
      isTranslation: false,
      sourceLang: 'zh',
    })
    expect(upserts).toContainEqual(
      expect.objectContaining({
        lang: 'en',
        isTranslation: true,
        sourceSummaryId: 'summary-base',
        summary: 'translated summary',
      }),
    )
    expect(ctx.setResult).toHaveBeenCalledWith({
      summaries: [
        expect.objectContaining({ summaryId: 'summary-base', lang: 'zh' }),
        expect.objectContaining({ summaryId: 'summary-en', lang: 'en' }),
      ],
      failedLangs: [],
      skippedLocked: [],
    })
  })

  it('generates a draft in an owner task without exposing it to public reads', async () => {
    const harness = setup()
    harness.databaseService.findGlobalById.mockResolvedValue({
      ...visibleArticle,
      document: { ...visibleArticle.document, isPublished: false },
    })

    await expect(
      runSummaryTask(harness, { refId: 'post-1' }),
    ).resolves.toBeDefined()
    await expect(
      harness.service.getSummaryByArticleId('post-1'),
    ).rejects.toThrow(AppException)
  })

  it('keeps an unrecognized token as its own target instead of collapsing it into zh', async () => {
    const harness = setup()

    const ctx = await runSummaryTask(harness, {
      refId: 'post-1',
      targetLanguages: ['english', 'zh'],
    })

    expect(ctx.updateProgress.mock.calls[0]).toEqual([
      0,
      'Generating summary (zh)',
      0,
      2,
    ])
    const upserts = harness.repository.upsert.mock.calls.map(
      ([input]: any[]) => input,
    )
    expect(upserts).toContainEqual(
      expect.objectContaining({ lang: 'english', isTranslation: true }),
    )
  })

  it('reuses a fresh base row instead of regenerating it', async () => {
    const harness = setup()
    const contentHash = (harness.service as any).multilang.computeContentHash(
      visibleArticle.document.text,
    )
    harness.repository.findBaseForRef.mockResolvedValue({
      id: 'summary-base',
      refId: 'post-1',
      lang: 'zh',
      summary: 'a summary',
      hash: contentHash,
      isTranslation: false,
      sourceSummaryId: null,
      sourceLang: 'zh',
      createdAt: now,
    })

    await runSummaryTask(harness, {
      refId: 'post-1',
      targetLanguages: ['en'],
    })

    const upserts = harness.repository.upsert.mock.calls.map(
      ([input]: any[]) => input,
    )
    expect(upserts).toHaveLength(1)
    expect(upserts[0]).toMatchObject({ lang: 'en', isTranslation: true })
  })

  it('marks the task partially failed when a translation fails but the base succeeded', async () => {
    const harness = setup()
    const runtime = {
      generateText: vi.fn(async ({ messages }: any) => {
        if (String(messages[0].content).includes('translator')) {
          throw new Error('translation blew up')
        }
        return { text: '{"summary":"a summary"}', usage: {} }
      }),
      providerInfo: { id: 'test-provider', model: 'test-model' },
    }
    harness.aiService.getSummaryModel.mockResolvedValue(runtime)

    const ctx = await runSummaryTask(harness, {
      refId: 'post-1',
      targetLanguages: ['en'],
    })

    expect(ctx.setStatus).toHaveBeenCalledWith('partial_failed')
    expect(ctx.setResult).toHaveBeenCalledWith(
      expect.objectContaining({ failedLangs: ['en'] }),
    )
  })

  it('registers a summary-translation task handler', () => {
    const harness = createService()
    harness.service.onModuleInit()
    const types = harness.taskProcessor.registerHandler.mock.calls.map(
      ([registered]: any[]) => registered.type,
    )
    expect(types).toContain(AITaskType.SummaryTranslation)
  })
})

describe('AiSummaryService — locked summaries', () => {
  const lockedRow = {
    id: 'summary-ja',
    refId: 'post-1',
    lang: 'ja',
    summary: 'human ja',
    hash: 'import-time-hash',
    isTranslation: true,
    isLocked: true,
    sourceSummaryId: null,
    sourceLang: 'en',
    createdAt: now,
  }

  it('serves a locked summary whose hash no longer matches the content', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue(visibleArticle)
    repository.findByRefAndLang.mockResolvedValue(lockedRow)
    repository.findByHash.mockResolvedValue(null)

    await expect(
      service.getSummaryByArticleId('post-1', 'ja'),
    ).resolves.toMatchObject({ summary: 'human ja', isLocked: true })
  })

  it('locks a summary edited by hand', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue({ ...lockedRow, isLocked: false })
    repository.updateSummary.mockResolvedValue({
      ...lockedRow,
      summary: 'edited',
    })

    await service.updateSummaryInDb('summary-ja', 'edited')

    expect(repository.updateSummary).toHaveBeenCalledWith(
      'summary-ja',
      'edited',
      {
        isLocked: true,
      },
    )
  })

  it('writes a manual summary as a locked row hashed against the current content', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({
      ...visibleArticle,
      document: { ...visibleArticle.document, meta: { lang: 'en' } },
    })
    repository.upsert.mockImplementation(async (input: any) => ({
      ...lockedRow,
      ...input,
      id: 'summary-ja',
    }))
    const multilang = new MultilangGenerationService(
      {} as any,
      {} as any,
      {} as any,
    )

    await service.writeManualSummary('post-1', 'ja', 'human ja')

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: 'post-1',
        lang: 'ja',
        summary: 'human ja',
        hash: multilang.computeContentHash('Long enough text'),
        isLocked: true,
        isTranslation: true,
        sourceLang: 'en',
      }),
    )
  })

  it('writes a manual summary in the source language as the base row', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({
      ...visibleArticle,
      document: { ...visibleArticle.document, meta: { lang: 'en' } },
    })
    repository.upsert.mockImplementation(async (input: any) => ({
      ...lockedRow,
      ...input,
    }))

    await service.writeManualSummary('post-1', 'en', 'human en')

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: 'en',
        isTranslation: false,
        isLocked: true,
      }),
    )
  })

  it('normalizes the language of a manual summary', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({
      ...visibleArticle,
      document: { ...visibleArticle.document, meta: { lang: 'EN' } },
    })
    repository.upsert.mockImplementation(async (input: any) => ({
      ...lockedRow,
      ...input,
    }))

    await service.writeManualSummary('post-1', 'zh-cn', 'human')
    await service.writeManualSummary('post-1', 'en', 'human en')

    expect(repository.upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        lang: 'zh-CN',
        isTranslation: true,
        sourceLang: 'en',
      }),
    )
    expect(repository.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ lang: 'en', isTranslation: false }),
    )
  })

  it('rejects a manual summary in an unsupported language', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue(visibleArticle)

    await expect(
      service.writeManualSummary('post-1', '  ', 'human'),
    ).rejects.toBeInstanceOf(AppException)
    expect(repository.upsert).not.toHaveBeenCalled()
  })

  it('reports locked languages the summary task skipped', async () => {
    const harness = createService()
    harness.configService.get.mockResolvedValue({
      enableSummary: true,
      summaryTargetLanguages: [],
      translationLangConcurrency: 2,
    })
    harness.databaseService.findGlobalById.mockResolvedValue(visibleArticle)
    harness.aiService.getSummaryModel.mockResolvedValue(summaryRuntime())
    harness.repository.findBaseForRef.mockResolvedValue({
      ...lockedRow,
      id: 'summary-base',
      lang: 'zh',
      isTranslation: false,
    })
    harness.repository.findByRefAndLang.mockImplementation(
      async (_refId: string, lang: string) =>
        lang === 'ja' ? lockedRow : null,
    )
    harness.repository.upsert.mockImplementation(async (input: any) => ({
      ...lockedRow,
      ...input,
      id: `summary-${input.lang}`,
      isLocked: false,
    }))

    const ctx = await runSummaryTask(harness, {
      refId: 'post-1',
      targetLanguages: ['ja', 'en'],
      force: true,
    })

    expect(ctx.setResult).toHaveBeenCalledWith(
      expect.objectContaining({ skippedLocked: ['ja'] }),
    )
    expect(harness.repository.upsert).toHaveBeenCalledTimes(1)
    expect(harness.repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ lang: 'en' }),
    )
  })
})
