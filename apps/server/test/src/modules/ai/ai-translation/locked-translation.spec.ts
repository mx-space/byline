import { describe, expect, it, vi } from 'vitest'

import type { TranslationTaskPayload } from '~/modules/ai/ai-task/ai-task.types'
import { AiTranslationService } from '~/modules/ai/ai-translation/ai-translation.service'
import { TranslationConsistencyService } from '~/modules/ai/ai-translation/translation-consistency.service'
import type { TaskExecuteContext } from '~/processors/task-queue'

const lexicalContent = JSON.stringify({
  root: { children: [], type: 'root', version: 1 },
})

function buildService(lockedLangs: string[] = []) {
  const repository = {
    listLockedLangs: vi.fn(async () => lockedLangs),
    findByRef: vi.fn(async () => null),
    upsert: vi.fn(async (input) => ({
      id: '9001',
      createdAt: new Date(),
      updatedAt: null,
      ...input,
    })),
  }
  const document = {
    id: '7001',
    title: 'Source title',
    text: 'source body',
    content: lexicalContent,
    contentFormat: 'lexical',
    summary: null,
    tags: [],
    meta: { lang: 'zh' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    modifiedAt: new Date('2026-02-01T00:00:00Z'),
  }
  const databaseService = {
    findGlobalById: vi.fn(async () => ({ document, type: 'posts' })),
  }
  const configService = {
    get: vi.fn(async () => ({
      enableTranslation: true,
      translationTargetLanguages: ['en', 'ja', 'fr'],
      translationLangConcurrency: 3,
    })),
  }
  const eventManager = { emit: vi.fn() }
  const lexicalService = {
    lexicalToMarkdown: vi.fn(() => 'translated markdown'),
    extractRootBlocks: vi.fn(() => []),
  }
  const service = new AiTranslationService(
    repository as any,
    databaseService as any,
    {} as any,
    {} as any,
    configService as any,
    {} as any,
    {} as any,
    eventManager as any,
    { registerHandler: vi.fn() } as any,
    {} as any,
    lexicalService as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  )
  const generate = vi.spyOn(service, 'generateTranslation').mockImplementation(
    async (_refId, lang) =>
      ({
        id: `t-${lang}`,
        lang,
        title: `title-${lang}`,
      }) as any,
  )
  return { document, eventManager, generate, repository, service }
}

function buildContext() {
  const results: unknown[] = []
  const logs: string[] = []
  const context = {
    taskId: 'task-1',
    signal: new AbortController().signal,
    updateProgress: vi.fn(async () => {}),
    incrementTokens: vi.fn(async () => {}),
    incrementCost: vi.fn(async () => {}),
    appendLog: vi.fn(async (_level: string, message: string) => {
      logs.push(message)
    }),
    setResult: vi.fn(async (result: unknown) => {
      results.push(result)
    }),
    setStatus: vi.fn(),
    isAborted: () => false,
    streamPusher: vi.fn(),
  } as unknown as TaskExecuteContext
  return { context, logs, results }
}

const execute = (
  service: AiTranslationService,
  payload: TranslationTaskPayload,
  context: TaskExecuteContext,
) => (service as any).executeTranslationTask(payload, context) as Promise<void>

describe('locked translations', () => {
  it('skips locked locales during publish-time translation', async () => {
    const { generate, service } = buildService(['ja'])
    const { context, logs, results } = buildContext()

    await execute(service, { refId: '7001' }, context)

    expect(generate.mock.calls.map((call) => call[1]).sort()).toEqual([
      'en',
      'fr',
    ])
    expect(logs).toContain('Skipping locked translations: ja')
    expect(results.at(-1)).toMatchObject({ skippedLocked: ['ja'] })
  })

  it('regenerates locked locales when explicitly asked', async () => {
    const { generate, service } = buildService(['ja'])
    const { context } = buildContext()

    await execute(
      service,
      { refId: '7001', targetLanguages: ['ja'], regenerateLocked: true },
      context,
    )

    expect(generate).toHaveBeenCalledTimes(1)
    expect(generate.mock.calls[0][1]).toBe('ja')
  })

  it('finishes without generating when every target is locked', async () => {
    const { generate, service } = buildService(['en', 'ja'])
    const { context, results } = buildContext()

    await execute(
      service,
      { refId: '7001', targetLanguages: ['en', 'ja'] },
      context,
    )

    expect(generate).not.toHaveBeenCalled()
    expect(results.at(-1)).toEqual({
      translations: [],
      skippedLocked: ['en', 'ja'],
    })
  })

  it('writes manual translations as locked, fresh rows', async () => {
    const { document, eventManager, repository, service } = buildService()

    await service.writeManualTranslation('7001', 'FR', {
      title: 'Título',
      content: lexicalContent,
    })

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        refId: '7001',
        lang: 'fr',
        isLocked: true,
        title: 'Título',
        text: 'translated markdown',
        content: lexicalContent,
        contentFormat: 'lexical',
        sourceLang: 'zh',
        sourceModifiedAt: document.modifiedAt,
      }),
    )
    expect(eventManager.emit).toHaveBeenCalledTimes(1)
  })

  it('keeps a locked translation fresh after the source changes', () => {
    const consistency = new TranslationConsistencyService({} as any)
    const article = {
      id: '7001',
      title: 'Edited',
      text: 'edited',
      modifiedAt: new Date('2026-03-01T00:00:00Z'),
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }
    const translation = {
      refId: '7001',
      hash: 'stale-hash',
      sourceLang: 'zh',
      sourceModifiedAt: new Date('2026-02-01T00:00:00Z'),
      createdAt: new Date('2026-02-01T00:00:00Z'),
    }

    expect(
      consistency.evaluateTranslationFreshness(
        article as any,
        translation as any,
      ),
    ).not.toBe('valid')
    expect(
      consistency.evaluateTranslationFreshness(
        article as any,
        {
          ...translation,
          isLocked: true,
        } as any,
      ),
    ).toBe('valid')
  })
})
