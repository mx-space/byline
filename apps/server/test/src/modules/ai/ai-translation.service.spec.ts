import { describe, expect, it, vi } from 'vitest'

import { createAiGenerationMetricsMock } from '@/helper/ai-generation-metrics-mock'
import { createPgRepositoryMock, now } from '@/helper/pg-repository-mock'
import { AppErrorCode } from '~/common/errors'
import { AppException } from '~/common/errors/exception.types'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import { CollectionRefTypes } from '~/constants/db.constant'
import type { AiService } from '~/modules/ai/ai.service'
import type { AiInFlightService } from '~/modules/ai/ai-inflight/ai-inflight.service'
import { AITaskType } from '~/modules/ai/ai-task/ai-task.types'
import type {
  AiTranslationRepository,
  AiTranslationRow,
} from '~/modules/ai/ai-translation/ai-translation.repository'
import { UpdateTranslationSchema } from '~/modules/ai/ai-translation/ai-translation.schema'
import { AiTranslationService } from '~/modules/ai/ai-translation/ai-translation.service'
import type { ITranslationStrategy } from '~/modules/ai/ai-translation/translation-strategy.interface'
import { TaskStatus } from '~/processors/task-queue'
import { ContentFormat } from '~/shared/types/content-format.type'

const row = (overrides: Partial<AiTranslationRow> = {}): AiTranslationRow => ({
  id: 'translation-1' as any,
  hash: 'hash',
  refId: 'post-1' as any,
  refType: 'post',
  lang: 'en',
  sourceLang: 'zh',
  title: 'Title',
  text: 'Text',
  subtitle: null,
  summary: null,
  tags: [],
  sourceModifiedAt: null,
  aiModel: null,
  aiProvider: null,
  contentFormat: ContentFormat.Lexical,
  content: null,
  sourceBlockSnapshots: null,
  sourceMetaHashes: null,
  isLocked: false,
  seo: null,
  createdAt: now,
  updatedAt: null,
  ...overrides,
})

const articleDocument = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  title: 'Source Title',
  text: 'Source Text',
  subtitle: null,
  summary: null,
  tags: [],
  contentFormat: ContentFormat.Lexical,
  content: '{"root":{"children":[]}}',
  isPublished: true,
  meta: { lang: 'zh' },
  modifiedAt: now,
  createdAt: now,
  ...overrides,
})

const createService = () => {
  const repository = createPgRepositoryMock<AiTranslationRepository>()
  const databaseService = {
    findGlobalById: vi.fn(),
    getRefArticleMap: vi.fn().mockResolvedValue({}),
    findAllArticlesForTranslation: vi.fn(),
    findArticlesForProductLists: vi.fn().mockResolvedValue({ posts: [] }),
    findArticleIdsByTitle: vi.fn().mockResolvedValue([]),
  }
  const translationConsistencyService = {
    evaluateTranslationFreshness: vi.fn(() => 'valid'),
    filterTrulyStaleTranslations: vi.fn(),
    partitionValidAndStaleTranslations: vi.fn(),
  }
  const partialBuilder = { build: vi.fn() }
  const configService = {
    get: vi.fn(() => ({
      enableTranslation: true,
    })),
  }
  const aiService = createPgRepositoryMock<AiService>()
  const aiInFlightService = createPgRepositoryMock<AiInFlightService>()
  const eventManager = { emit: vi.fn() }
  const taskProcessor = { registerHandler: vi.fn() }
  const taskQueueService = {
    createTask: vi.fn(),
    getTasks: vi.fn(async () => ({ data: [], total: 0 })),
    cancelTask: vi.fn(),
  }
  const lexicalService = { lexicalToMarkdown: vi.fn(() => 'markdown') }
  const aiTaskService = {
    createTranslationTask: vi.fn(),
  }
  const generationMetrics = createAiGenerationMetricsMock()
  const lexicalStrategy = createPgRepositoryMock<ITranslationStrategy>()

  const service = new AiTranslationService(
    repository as any,
    databaseService as any,
    translationConsistencyService as any,
    partialBuilder as any,
    configService as any,
    aiService as any,
    aiInFlightService as any,
    eventManager as any,
    taskProcessor as any,
    taskQueueService as any,
    lexicalService as any,
    aiTaskService as any,
    generationMetrics as any,
    lexicalStrategy as any,
  )
  return {
    aiInFlightService,
    aiService,
    aiTaskService,
    configService,
    databaseService,
    eventManager,
    generationMetrics,
    lexicalService,
    lexicalStrategy,

    partialBuilder,
    repository,
    service,
    taskProcessor,
    taskQueueService,
    translationConsistencyService,
  }
}

describe('AiTranslationService', () => {
  it('creates one translation task per article in the translation-all task', async () => {
    const {
      configService,
      databaseService,
      service,
      taskProcessor,
      taskQueueService,
    } = createService()
    configService.get.mockResolvedValue({
      translationTargetLanguages: ['en'],
    } as any)
    databaseService.findAllArticlesForTranslation.mockResolvedValue({
      posts: [
        { id: 'post-1', title: 'Post' },
        { id: 'post-2', title: 'Post 2' },
        { id: 'post-3', title: 'Post 3' },
      ],
    })
    taskQueueService.createTask.mockImplementation(
      async ({ payload }: any) => ({
        created: true,
        taskId: `task-${payload.refId}`,
      }),
    )

    service.onModuleInit()
    const handler = taskProcessor.registerHandler.mock.calls
      .map(([registered]) => registered)
      .find(
        (registered: any) => registered.type === AITaskType.TranslationAll,
      ) as any

    const context = {
      taskId: 'group-1',
      isAborted: () => false,
      signal: new AbortController().signal,
      appendLog: vi.fn(),
      updateProgress: vi.fn(),
      setResult: vi.fn(),
      setStatus: vi.fn(),
    }
    await handler.execute({}, context as any)

    expect(databaseService.findAllArticlesForTranslation).toHaveBeenCalled()
    expect(taskQueueService.createTask).toHaveBeenCalledTimes(3)
    expect(context.setResult).toHaveBeenCalledWith(
      expect.objectContaining({ total: 3, createdCount: 3 }),
    )
  })

  it('collapses spellings of one regional target before generating', async () => {
    const { configService, service, taskProcessor } = createService()
    configService.get.mockResolvedValue({
      enableTranslation: true,
      translationTargetLanguages: [],
    })

    service.onModuleInit()
    const handler = taskProcessor.registerHandler.mock.calls
      .map(([registered]) => registered)
      .find(
        (registered: any) => registered.type === AITaskType.Translation,
      ) as any

    const context = {
      taskId: 'task-1',
      isAborted: () => false,
      signal: new AbortController().signal,
      appendLog: vi.fn(),
      updateProgress: vi.fn(),
      setResult: vi.fn(),
      setStatus: vi.fn(),
      incrementTokens: vi.fn(),
      incrementCost: vi.fn(),
      streamPusher: vi.fn(),
    }

    await handler.execute(
      { refId: 'post-1', targetLanguages: ['zh_tw', 'zh-TW'] },
      context as any,
    )

    expect(context.updateProgress).toHaveBeenCalledWith(
      0,
      'Starting translation',
      0,
      1,
    )
  })

  it('includes orphan articles with zero translations in the grouped list', async () => {
    const { databaseService, repository, service } = createService()
    repository.groupByRefIdPaginated.mockResolvedValue({
      data: [{ refId: 'post-1' }],
      pagination: { total: 1, currentPage: 1, totalPage: 1, size: 10 },
    } as any)
    repository.findDistinctRefIds.mockResolvedValue(['post-1'])
    repository.listByRefIds.mockResolvedValue([row()])
    databaseService.findArticlesForProductLists.mockResolvedValue({
      posts: [
        {
          id: 'post-1',
          title: 'Has Translation',
          isPublished: true,
          createdAt: '2024-03-01T00:00:00.000Z',
        },
        {
          id: 'post-2',
          title: 'Orphan Post',
          isPublished: true,
          createdAt: '2024-02-01T00:00:00.000Z',
        },
        {
          id: 'page-1',
          title: 'Orphan Page',
          isPublished: true,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    })
    databaseService.getRefArticleMap.mockResolvedValue({
      'post-1': {
        id: 'post-1',
        title: 'Has Translation',
        type: CollectionRefTypes.Post,
      },
    })

    const result = await service.getAllTranslationsGrouped({
      page: 1,
      size: 10,
    })

    expect(result.pagination).toMatchObject({ total: 3, currentPage: 1 })
    expect(result.data.map((row) => row.article.id)).toEqual([
      'post-1',
      'post-2',
      'page-1',
    ])
    expect(result.data[0].translations).toEqual([
      { ...row(), generationMetrics: null },
    ])
    expect(result.data[1].translations).toEqual([])
    expect(result.data[2].translations).toEqual([])
  })

  it('loads translations with their source article from PG-backed services', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({ id: 'post-1' })
    repository.listByRefId.mockResolvedValue([row()])

    await expect(service.getTranslationsByRefId('post-1')).resolves.toEqual({
      article: { id: 'post-1' },
      translations: [{ ...row(), generationMetrics: null }],
    })
  })

  it('updates lexical content by storing markdown text alongside content JSON', async () => {
    const { lexicalService, repository, service } = createService()
    repository.findById.mockResolvedValue(row())
    repository.updateById.mockResolvedValue(
      row({ content: '{"root":{}}', text: 'markdown' }),
    )

    await service.updateTranslation('translation-1', { content: '{"root":{}}' })

    expect(lexicalService.lexicalToMarkdown).toHaveBeenCalledWith('{"root":{}}')
    expect(repository.updateById).toHaveBeenCalledWith(
      'translation-1',
      expect.objectContaining({ content: '{"root":{}}', text: 'markdown' }),
    )
  })

  it('announces an edited translation so the public cache drops it', async () => {
    const { eventManager, repository, service } = createService()
    repository.findById.mockResolvedValue(row())
    repository.updateById.mockResolvedValue(row({ title: 'Edited' }))

    await service.updateTranslation('translation-1', { title: 'Edited' })

    expect(eventManager.emit).toHaveBeenCalledWith(
      BusinessEvents.TRANSLATION_UPDATE,
      expect.objectContaining({ id: 'translation-1', title: 'Edited' }),
      { scope: EventScope.TO_SYSTEM_VISITOR },
    )
  })

  it('preserves supplied text when updating lexical content and text together', async () => {
    const { lexicalService, repository, service } = createService()
    repository.findById.mockResolvedValue(row())
    repository.updateById.mockResolvedValue(
      row({ content: '{"root":{}}', text: 'supplied text' }),
    )

    await service.updateTranslation('translation-1', {
      content: '{"root":{}}',
      text: 'supplied text',
    })

    expect(lexicalService.lexicalToMarkdown).not.toHaveBeenCalled()
    expect(repository.updateById).toHaveBeenCalledWith(
      'translation-1',
      expect.objectContaining({
        content: '{"root":{}}',
        text: 'supplied text',
      }),
    )
  })

  it('treats null content as omitted when updating markdown text', async () => {
    const { lexicalService, repository, service } = createService()
    repository.findById.mockResolvedValue(row())
    repository.updateById.mockResolvedValue(row({ text: 'Edited text' }))

    const input = UpdateTranslationSchema.parse({
      content: null,
      text: 'Edited text',
    })
    await service.updateTranslation('translation-1', input)

    expect(lexicalService.lexicalToMarkdown).not.toHaveBeenCalled()
    expect(repository.updateById).toHaveBeenCalledWith('translation-1', {
      text: 'Edited text',
    })
  })

  it('does not block the owner-authenticated translation lookup for a premium post', async () => {
    const { databaseService, repository, service } = createService()
    const validTranslation = row({ lang: 'en' })
    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ isPremium: true }),
      type: CollectionRefTypes.Post,
    })
    repository.listByRefId.mockResolvedValue([validTranslation])

    await expect(
      service.getTranslationAndAvailableLanguages('post-1', 'en', {
        ignoreVisibility: true,
      }),
    ).resolves.toMatchObject({ translation: validTranslation })
  })

  it('throws when deleting a missing translation row', async () => {
    const { repository, service } = createService()
    repository.deleteById.mockResolvedValue(0)

    await expect(service.deleteTranslation('missing')).rejects.toThrow(
      AppException,
    )
  })

  it('returns a valid article translation without scheduling or building partial output', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()
    const validTranslation = row()

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.findByRefAndLang.mockResolvedValue(validTranslation)
    translationConsistencyService.evaluateTranslationFreshness.mockReturnValue(
      'valid',
    )

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).resolves.toBe(validTranslation)

    expect(partialBuilder.build).not.toHaveBeenCalled()
  })

  it('returns null for a missing article translation without scheduling or building partial output', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.findByRefAndLang.mockResolvedValue(null)

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).resolves.toBeNull()

    expect(
      translationConsistencyService.evaluateTranslationFreshness,
    ).not.toHaveBeenCalled()
    expect(partialBuilder.build).not.toHaveBeenCalled()
  })

  it('returns null for unknown article translation freshness without scheduling or building partial output', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()
    const unknownTranslation = row({
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.findByRefAndLang.mockResolvedValue(unknownTranslation)
    translationConsistencyService.evaluateTranslationFreshness.mockReturnValue(
      'unknown',
    )

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).resolves.toBeNull()

    expect(partialBuilder.build).not.toHaveBeenCalled()
  })

  it('returns a partial lexical translation for a stale article translation without persisting it', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()
    const staleTranslation = row({
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })
    const partialTranslation = row({
      id: 'translation-1' as any,
      title: 'Partial Title',
      text: 'Partial Text',
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.findByRefAndLang.mockResolvedValue(staleTranslation)
    translationConsistencyService.evaluateTranslationFreshness.mockReturnValue(
      'stale',
    )
    partialBuilder.build.mockReturnValue({
      stats: {
        changedBlockCount: 0,
        reusedBlockCount: 1,
        skippedReusableBlockCount: 0,
        totalBlockCount: 1,
      },
      translation: partialTranslation,
    })

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).resolves.toBe(partialTranslation)

    expect(partialBuilder.build).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '{"root":{"children":[]}}',
        contentFormat: ContentFormat.Lexical,
        text: 'Source Text',
        title: 'Source Title',
      }),
      staleTranslation,
    )
    expect(repository.updateById).not.toHaveBeenCalled()
    expect(repository.upsert).not.toHaveBeenCalled()
  })

  it('returns null for a stale lexical article translation when partial build is unavailable', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()
    const staleTranslation = row({
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.findByRefAndLang.mockResolvedValue(staleTranslation)
    translationConsistencyService.evaluateTranslationFreshness.mockReturnValue(
      'stale',
    )
    partialBuilder.build.mockReturnValue(null)

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).resolves.toBeNull()

    expect(partialBuilder.build).toHaveBeenCalledWith(
      expect.objectContaining({
        contentFormat: ContentFormat.Lexical,
      }),
      staleTranslation,
    )
  })

  it('returns a partial requested stale translation without listing it as available', async () => {
    const {
      databaseService,
      partialBuilder,
      repository,
      service,
      translationConsistencyService,
    } = createService()
    const validTranslation = row({ lang: 'en' })
    const staleTranslation = row({
      id: 'translation-2' as any,
      lang: 'ja',
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })
    const partialTranslation = row({
      id: 'translation-2' as any,
      lang: 'ja',
      text: 'Partial Japanese Text',
      contentFormat: ContentFormat.Lexical,
      content: '{"root":{"children":[]}}',
    })

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    repository.listByRefId.mockResolvedValue([
      validTranslation,
      staleTranslation,
    ])
    translationConsistencyService.evaluateTranslationFreshness.mockImplementation(
      (_snapshot: unknown, translation: AiTranslationRow) =>
        translation.lang === 'ja' ? 'stale' : 'valid',
    )
    partialBuilder.build.mockReturnValue({
      stats: {
        changedBlockCount: 0,
        reusedBlockCount: 1,
        skippedReusableBlockCount: 0,
        totalBlockCount: 1,
      },
      translation: partialTranslation,
    })

    await expect(
      service.getTranslationAndAvailableLanguages('post-1', 'ja'),
    ).resolves.toEqual({
      availableTranslations: ['en'],
      sourceLang: 'zh',
      translation: partialTranslation,
    })

    expect(repository.findByRefAndLang).not.toHaveBeenCalled()
    expect(partialBuilder.build).toHaveBeenCalledWith(
      expect.objectContaining({
        contentFormat: ContentFormat.Lexical,
      }),
      staleTranslation,
    )
  })
})

describe('AiTranslationService — force regeneration', () => {
  function stubLeaderRun(aiInFlightService: {
    runWithStream: ReturnType<typeof vi.fn>
  }) {
    aiInFlightService.runWithStream.mockImplementation(async (opts: any) => {
      const leaderResult = await opts.onLeader({ push: vi.fn() })
      return {
        role: 'leader' as const,
        events: (async function* () {})(),
        result: Promise.resolve(leaderResult.result),
      }
    })
  }

  const translatedResult = {
    sourceLang: 'zh',
    title: 'Translated title',
    text: 'Translated text',
    subtitle: null,
    summary: null,
    tags: null,
    aiModel: 'model-x',
    aiProvider: 'provider-x',
  }

  it('drops the existing translation from translateContentStream when force is true', async () => {
    const {
      aiInFlightService,
      aiService,
      databaseService,
      lexicalStrategy,
      repository,
      service,
    } = createService()

    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ content: null }),
      type: CollectionRefTypes.Post,
    })
    repository.findByRef.mockResolvedValue(row({ lang: 'en' }))
    repository.upsert.mockResolvedValue(row({ lang: 'en' }))
    aiService.getTranslationModelWithInfo.mockResolvedValue({
      runtime: {},
      info: { model: 'model-x', provider: 'provider-x' },
    } as any)
    lexicalStrategy.translate.mockResolvedValue(translatedResult as any)
    stubLeaderRun(aiInFlightService)

    await service.generateTranslation(
      'post-1',
      'en',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    )

    expect(repository.findByRef).toHaveBeenCalled()
    expect(lexicalStrategy.translate).toHaveBeenCalledWith(
      expect.anything(),
      'en',
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ existing: undefined }),
    )
    expect(aiInFlightService.runWithStream).toHaveBeenCalledWith(
      expect.objectContaining({ bypassResultCache: true }),
    )
  })

  it('keeps the existing translation for translateContentStream on an incremental (non-force) run', async () => {
    const {
      aiInFlightService,
      aiService,
      databaseService,
      lexicalStrategy,
      repository,
      service,
    } = createService()

    const existing = row({ lang: 'en' })
    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ content: null }),
      type: CollectionRefTypes.Post,
    })
    repository.findByRef.mockResolvedValue(existing)
    repository.upsert.mockResolvedValue(row({ lang: 'en' }))
    aiService.getTranslationModelWithInfo.mockResolvedValue({
      runtime: {},
      info: { model: 'model-x', provider: 'provider-x' },
    } as any)
    lexicalStrategy.translate.mockResolvedValue(translatedResult as any)
    stubLeaderRun(aiInFlightService)

    await service.generateTranslation('post-1', 'en')

    expect(lexicalStrategy.translate).toHaveBeenCalledWith(
      expect.anything(),
      'en',
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ existing }),
    )
    expect(aiInFlightService.runWithStream).toHaveBeenCalledWith(
      expect.objectContaining({ bypassResultCache: undefined }),
    )
  })

  it('carries force forward into the PartialFailed retry payload', () => {
    const { service, taskProcessor } = createService()
    service.onModuleInit()
    const handler = taskProcessor.registerHandler.mock.calls
      .map(([registered]) => registered)
      .find(
        (registered: any) => registered.type === AITaskType.Translation,
      ) as any

    const task = {
      status: TaskStatus.PartialFailed,
      groupId: 'group-1',
      payload: {
        refId: 'post-1',
        targetLanguages: ['en', 'ja'],
        force: true,
        title: 'T',
        refType: CollectionRefTypes.Post,
      },
      result: { translations: [{ lang: 'en' }] },
    }

    const retryOptions = handler.buildRetryTask(task)

    expect(retryOptions.payload).toMatchObject({
      refId: 'post-1',
      targetLanguages: ['ja'],
      force: true,
    })
  })

  it('normalizes payload target languages before diffing, so zh_tw matches a successful zh-TW', () => {
    const { service, taskProcessor } = createService()
    service.onModuleInit()
    const handler = taskProcessor.registerHandler.mock.calls
      .map(([registered]) => registered)
      .find(
        (registered: any) => registered.type === AITaskType.Translation,
      ) as any

    const task = {
      status: TaskStatus.PartialFailed,
      groupId: 'group-1',
      payload: {
        refId: 'post-1',
        targetLanguages: ['zh_tw', 'en'],
        title: 'T',
        refType: CollectionRefTypes.Post,
      },
      result: { translations: [{ lang: 'zh-TW' }] },
    }

    const retryOptions = handler.buildRetryTask(task)

    expect(retryOptions.payload).toMatchObject({
      refId: 'post-1',
      targetLanguages: ['en'],
    })
  })
})

describe('AiTranslationService.buildTranslationKey (in-flight key)', () => {
  const buildKey = (service: AiTranslationService) => {
    const content = (service as any).toArticleContent(articleDocument())
    return (service as any).buildTranslationKey('post-1', 'en', content)
  }

  // force no longer folds into the key hash: a force request must land on
  // the same in-flight lock as a plain one instead of spawning a second
  // writer (see AiInFlightService.waitForForceLock).
  it('gives repeated requests for the same content the same in-flight key', () => {
    const { service } = createService()

    expect(buildKey(service)).toBe(buildKey(service))
  })
})

describe('AiTranslationService — per-locale SEO', () => {
  const translated = {
    sourceLang: 'zh',
    title: 'Translated title',
    text: 'Translated text',
    subtitle: null,
    summary: null,
    tags: null,
    aiModel: 'model-x',
    aiProvider: 'provider-x',
  }

  const setup = (
    seo: Record<string, unknown> | null,
    existing: ReturnType<typeof row> | null = null,
  ) => {
    const ctx = createService()
    ctx.databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ content: null, seo }),
      type: CollectionRefTypes.Post,
    })
    ctx.repository.findByRef.mockResolvedValue(existing)
    ctx.repository.upsert.mockImplementation(async (input: any) =>
      row({ ...input, lang: 'en' }),
    )
    ctx.aiService.getTranslationModelWithInfo.mockResolvedValue({
      runtime: {},
      info: { model: 'model-x', provider: 'provider-x' },
    } as any)
    ctx.lexicalStrategy.translate.mockResolvedValue(translated as any)
    const generateStructured = vi.fn(async ({ prompt }: { prompt: string }) => {
      const fields = JSON.parse(prompt.slice(prompt.indexOf('{')))
      return {
        output: {
          translations: Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, `EN ${value}`]),
          ),
        },
      }
    })
    ctx.aiService.getFieldTranslationModel.mockResolvedValue({
      generateStructured,
    } as any)
    ctx.aiInFlightService.runWithStream.mockImplementation(
      async (opts: any) => {
        const leaderResult = await opts.onLeader({ push: vi.fn() })
        return {
          role: 'leader' as const,
          events: (async function* () {})(),
          result: Promise.resolve(leaderResult.result),
        }
      },
    )
    return { ...ctx, generateStructured }
  }

  it('translates the SEO title and description and stores them on the row', async () => {
    const { generateStructured, repository, service } = setup({
      title: '标题',
      description: '描述',
      image: 'https://cdn.example.test/og.png',
    })

    await service.generateTranslation('post-1', 'en')

    expect(generateStructured).toHaveBeenCalledTimes(1)
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        seo: { title: 'EN 标题', description: 'EN 描述' },
        sourceMetaHashes: expect.objectContaining({ seo: expect.any(String) }),
      }),
    )
  })

  it('skips the SEO call when the source has no SEO text', async () => {
    const { generateStructured, repository, service } = setup({
      image: 'https://cdn.example.test/og.png',
    })

    await service.generateTranslation('post-1', 'en')

    expect(generateStructured).not.toHaveBeenCalled()
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ seo: null }),
    )
  })

  it('reuses the stored SEO translation while the source SEO is unchanged', async () => {
    const first = setup({ title: '标题' })
    await first.service.generateTranslation('post-1', 'en')
    const stored = first.repository.upsert.mock.calls[0][0] as any

    const second = setup(
      { title: '标题' },
      row({
        lang: 'en',
        seo: stored.seo,
        sourceMetaHashes: stored.sourceMetaHashes,
      }),
    )
    await second.service.generateTranslation('post-1', 'en')

    expect(second.generateStructured).not.toHaveBeenCalled()
    expect(second.repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ seo: { title: 'EN 标题' } }),
    )
  })

  it('keeps the article translation when the SEO call fails', async () => {
    const { generateStructured, repository, service } = setup({
      title: '标题',
    })
    generateStructured.mockRejectedValueOnce(new Error('model down'))

    await service.generateTranslation('post-1', 'en')

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Translated title', seo: null }),
    )
  })

  it('stores SEO sent with a manual translation', async () => {
    const { databaseService, repository, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ content: null }),
      type: CollectionRefTypes.Post,
    })
    repository.findByRef.mockResolvedValue(null)
    repository.upsert.mockResolvedValue(row({ lang: 'en' }))

    await service.writeManualTranslation('post-1', 'en', {
      title: 'Title',
      content: '{"root":{}}',
      seo: { title: 'SEO title', description: null },
    })

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        isLocked: true,
        seo: { title: 'SEO title', description: null },
      }),
    )
  })

  it('updates SEO through a translation edit', async () => {
    const { repository, service } = createService()
    repository.findById.mockResolvedValue(row())
    repository.updateById.mockResolvedValue(row())

    await service.updateTranslation('translation-1', {
      seo: { description: 'Edited' },
    })

    expect(repository.updateById).toHaveBeenCalledWith('translation-1', {
      seo: { description: 'Edited' },
    })
  })
})

describe('AiTranslationService — language read fallback', () => {
  const setup = (langs: string[]) => {
    const ctx = createService()
    ctx.databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument(),
      type: CollectionRefTypes.Post,
    })
    const rows = langs.map((lang) => row({ lang, title: `title-${lang}` }))
    ctx.repository.listByRefId.mockResolvedValue(rows)
    ctx.repository.findByRefAndLang.mockImplementation(
      async (_id: string, lang: string) =>
        rows.find((item) => item.lang === lang) ?? null,
    )
    return ctx
  }

  it.each([
    ['en-US', ['en-US', 'en'], 'en-US'],
    ['en-US', ['en', 'ja'], 'en'],
    ['zh-HK', ['zh', 'zh-TW'], 'zh'],
    ['zh-TW', ['zh-TW', 'zh'], 'zh-TW'],
  ])('serves %s from rows %j as %s', async (requested, langs, served) => {
    const { service } = setup(langs)

    const detail = await service.getTranslationAndAvailableLanguages(
      'post-1',
      requested,
    )
    const direct = await service.getTranslationForArticle('post-1', requested)

    expect(detail.translation?.lang).toBe(served)
    expect(direct?.lang).toBe(served)
  })

  it('does not serve a sibling region when the base row is missing', async () => {
    const { service } = setup(['zh-TW', 'zh-CN'])

    const detail = await service.getTranslationAndAvailableLanguages(
      'post-1',
      'zh-HK',
    )

    expect(detail.translation).toBeNull()
    expect(detail.availableTranslations).toEqual(['zh-TW', 'zh-CN'])
    await expect(
      service.getTranslationForArticle('post-1', 'zh-HK'),
    ).resolves.toBeNull()
  })

  it('falls back to the base row when the exact row is unusable', async () => {
    const { service, translationConsistencyService } = setup(['en-US', 'en'])
    translationConsistencyService.evaluateTranslationFreshness.mockImplementation(
      (_snapshot: unknown, translation: any) =>
        translation.lang === 'en-US' ? 'invalid' : 'valid',
    )

    const detail = await service.getTranslationAndAvailableLanguages(
      'post-1',
      'en-US',
    )

    expect(detail.translation?.lang).toBe('en')
  })

  it('resolves list translations per article, exact first then base', async () => {
    const { repository, service, translationConsistencyService } =
      createService()
    const rowsByLang: Record<string, ReturnType<typeof row>[]> = {
      'en-US': [row({ refId: 'a' as any, lang: 'en-US' })],
      en: [
        row({ refId: 'a' as any, lang: 'en' }),
        row({ refId: 'b' as any, lang: 'en' }),
      ],
    }
    repository.listByRefIdsAndLang.mockImplementation(
      async (ids: string[], lang: string) =>
        (rowsByLang[lang] ?? []).filter((item) =>
          ids.includes(String(item.refId)),
        ),
    )
    translationConsistencyService.partitionValidAndStaleTranslations.mockImplementation(
      (_articles: unknown, translations: any[]) => ({
        validTranslations: new Map(
          translations.map((item) => [String(item.refId), item]),
        ),
        staleRefIds: [],
        unknownTranslations: new Map(),
      }),
    )
    const articles = ['a', 'b', 'c'].map((id) => ({
      id,
      title: id,
      text: id,
    }))

    const { validTranslations } = await service.getValidTranslationsForArticles(
      articles as any,
      'en-US',
    )

    expect(validTranslations.get('a')?.lang).toBe('en-US')
    expect(validTranslations.get('b')?.lang).toBe('en')
    expect(validTranslations.has('c')).toBe(false)
    expect(repository.listByRefIdsAndLang).toHaveBeenNthCalledWith(
      2,
      ['b', 'c'],
      'en',
    )
  })

  it('prefers the exact row for cached titles and fills the rest from the base', async () => {
    const { repository, service } = createService()
    repository.listByRefIdsAndLang.mockImplementation(
      async (_ids: string[], lang: string) =>
        lang === 'pt-BR'
          ? [row({ refId: 'a' as any, lang, title: 'Olá BR' })]
          : [
              row({ refId: 'a' as any, lang, title: 'Olá' }),
              row({ refId: 'b' as any, lang, title: 'Oi' }),
            ],
    )

    const titles = await service.findCachedTitlesByRefIds(['a', 'b'], 'pt-BR')

    expect(Object.fromEntries(titles)).toEqual({ a: 'Olá BR', b: 'Oi' })
  })
})

describe('AiTranslationService — hidden articles', () => {
  it('refuses public reads of an unpublished post with POST_HIDDEN_OR_ENCRYPTED', async () => {
    const { databaseService, service } = createService()
    databaseService.findGlobalById.mockResolvedValue({
      document: articleDocument({ isPublished: false }),
      type: CollectionRefTypes.Post,
    })

    await expect(
      service.getTranslationForArticle('post-1', 'en'),
    ).rejects.toMatchObject({ code: 'POST_HIDDEN_OR_ENCRYPTED' })
    expect(Object.values(AppErrorCode)).not.toContain('NOTE_FORBIDDEN')
  })
})
