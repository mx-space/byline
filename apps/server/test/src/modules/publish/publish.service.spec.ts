import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { AppErrorCode } from '~/common/errors/app-error-code'
import { AppException } from '~/common/errors/exception.types'
import type { DocumentAiSeo } from '~/database/schema'
import { DraftRefType } from '~/modules/draft/draft.enum'
import { CreatePublishJobSchema } from '~/modules/publish/publish.schema'
import { PublishService } from '~/modules/publish/publish.service'
import type {
  PublishAiResourceRequest,
  PublishTaskPayload,
} from '~/modules/publish/publish.types'
import { type TaskHandler, TaskStatus } from '~/processors/task-queue'

const snapshot = {
  content: null,
  contentFormat: 'markdown',
  images: [],
  meta: { nested: { value: 1 } },
  text: 'Body',
  title: 'Selected title',
  typeSpecificData: { slug: 'selected-title' },
}

const makeBranch = () => ({
  baseRevision: { ...snapshot, id: 'published-1' },
  baseRevisionId: 'published-1',
  commonAncestorRevisionId: 'published-1',
  document: {
    aiSeo: null as DocumentAiSeo | null,
    id: 'document-1',
    publishAiResources: null as PublishAiResourceRequest[] | null,
    publishedRevisionId: 'published-1',
    refId: 'post-1',
    refType: DraftRefType.Post,
  },
  documentId: 'document-1',
  headRevision: { ...snapshot, id: 'revision-2' },
  headRevisionId: 'revision-2',
  id: 'branch-1',
  publishedRevision: { ...snapshot, id: 'published-1' },
  relationToPublished: 'ancestor',
  status: 'active',
})

const harness = (options: { crdt?: boolean; online?: boolean } = {}) => {
  const branch = makeBranch()
  const checkpoints = new Map<string, Record<string, unknown>>([
    [
      'checkpoint-1',
      {
        ...snapshot,
        documentId: 'document-1',
        id: 'checkpoint-1',
        kind: 'publish',
        title: 'Checkpoint title',
      },
    ],
  ])
  const order: string[] = []
  let handler: TaskHandler<PublishTaskPayload> | undefined
  let payload: PublishTaskPayload | undefined
  const drafts = {
    findById: vi.fn(async () => branch),
    findRevisionById: vi.fn(async (id: string) => checkpoints.get(id) ?? null),
    linkDocument: vi.fn(),
    recordPublication: vi.fn(async () => ({ kind: 'ok' })),
    setAiSeo: vi.fn(),
    setPublishAiResources: vi.fn(),
    usesCrdt: vi.fn(async () => options.crdt ?? false),
  }
  const posts = {
    create: vi.fn(),
    findById: vi.fn(async () => ({
      contentFormat: 'markdown',
      id: 'post-1',
      isPublished: options.online ?? true,
    })),
    updateById: vi.fn(async (_id: string, data: { isPublished?: boolean }) => {
      if (data.isPublished === true) order.push('publish')
      return { id: 'post-1', isPublished: true }
    }),
  }
  const aiTask = (name: string) =>
    vi.fn(async () => {
      order.push(name)
      return { taskId: `task-${name}` }
    })
  const aiTasks = {
    createInsightsTask: aiTask('insights'),
    createSummaryTask: aiTask('summary'),
    createTranslationTask: aiTask('translation'),
    createTtsTask: aiTask('tts'),
  }
  const tasks = {
    cancelTask: vi.fn(),
    createTask: vi.fn(async ({ payload: selected }) => {
      payload = selected
      return { id: 'publish-task-1' }
    }),
    getTask: vi.fn(async (id: string) => {
      order.push(`wait:${id}`)
      return { id, status: TaskStatus.Completed }
    }),
  }
  const processor = {
    registerHandler: vi.fn((registered) => {
      handler = registered
    }),
  }
  const aiWriter = {
    generateSeoDescription: vi.fn(async () => {
      order.push('seo')
      return 'Generated description'
    }),
  }
  const service = new PublishService(
    drafts as never,
    posts as never,
    aiTasks as never,
    tasks as never,
    processor as never,
    aiWriter as never,
  )
  service.onModuleInit()

  const create = (
    confirmDiverged = false,
    aiResources?: unknown,
    revisionId: string = branch.headRevisionId,
  ) =>
    service.create({
      aiResources,
      branchId: branch.id,
      confirmDiverged,
      expectedPublishedRevisionId: branch.document.publishedRevisionId,
      revisionId,
    } as never)
  const run = async (signal = new AbortController().signal) => {
    const setResult = vi.fn()
    await handler!.execute(payload!, {
      appendLog: vi.fn(),
      incrementCost: vi.fn(),
      incrementTokens: vi.fn(),
      isAborted: () => false,
      setResult,
      setStatus: vi.fn(),
      signal,
      streamPusher: vi.fn(),
      taskId: 'publish-task-1',
      updateProgress: vi.fn(),
    })
    return setResult
  }

  return {
    aiTasks,
    aiWriter,
    branch,
    create,
    service,
    drafts,
    order,
    payload: () => payload!,
    posts,
    run,
    tasks,
  }
}

describe('PublishService on a Loro working copy', () => {
  it('publishes a checkpoint that is not the working copy head', async () => {
    const { create, payload } = harness({ crdt: true })

    await create(false, undefined, 'checkpoint-1')

    expect(payload()).toMatchObject({
      revisionId: 'checkpoint-1',
      snapshot: { title: 'Checkpoint title' },
    })
  })

  it('ignores the divergence confirmation for a working copy', async () => {
    const { branch, create, tasks } = harness({ crdt: true })
    branch.relationToPublished = 'diverged'

    await create(false, undefined, 'checkpoint-1')

    expect(tasks.createTask).toHaveBeenCalled()
  })

  it('rejects a revision from another document', async () => {
    const { create } = harness({ crdt: true })

    await expect(
      create(false, undefined, 'unknown-revision'),
    ).rejects.toMatchObject({ code: AppErrorCode.CONTENT_REVISION_NOT_FOUND })
  })
})

describe('PublishService tree selection', () => {
  it('requires confirmation when publishing a branch from an older base', async () => {
    const { branch, create, tasks } = harness()
    branch.relationToPublished = 'diverged'

    await expect(create()).rejects.toBeInstanceOf(BadRequestException)
    expect(tasks.createTask).not.toHaveBeenCalled()
  })

  it('freezes the explicitly confirmed branch revision', async () => {
    const { branch, create, payload } = harness()
    branch.relationToPublished = 'diverged'

    await create(true)
    branch.headRevision.title = 'Later edit'
    branch.headRevisionId = 'revision-3'

    expect(payload()).toMatchObject({
      branchId: 'branch-1',
      expectedPublishedRevisionId: 'published-1',
      revisionId: 'revision-2',
      snapshot: { title: 'Selected title' },
    })
  })

  it('publishes the frozen revision while newer work remains on the branch', async () => {
    const { branch, create, drafts, posts, run } = harness()
    await create()
    branch.headRevisionId = 'revision-3'
    branch.headRevision.title = 'Later edit'

    const setResult = await run()

    expect(posts.updateById).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ title: 'Selected title' }),
    )
    expect(drafts.recordPublication).toHaveBeenCalledWith(
      'document-1',
      'revision-2',
      'published-1',
    )
    expect(setResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ newerDraftChanges: true }),
    )
  })

  it('stops when the published pointer changes before the task runs', async () => {
    const { branch, create, posts, run } = harness()
    await create()
    branch.document.publishedRevisionId = 'published-by-other-task'

    const error = await run().catch((reason) => reason)

    expect(error).toBeInstanceOf(AppException)
    expect(error.code).toBe(AppErrorCode.PUBLISHED_REVISION_CHANGED)
    expect(posts.updateById).not.toHaveBeenCalled()
  })

  it('credits the member who started a new post, not the publisher', async () => {
    const { branch, posts, run, service } = harness()
    branch.document = {
      ...branch.document,
      createdBy: 'writer',
      publishedRevisionId: null,
      refId: null,
    } as never
    posts.create.mockResolvedValue({ id: 'post-new', isPublished: false })
    await service.create(
      {
        branchId: branch.id,
        confirmDiverged: true,
        expectedPublishedRevisionId: null,
        revisionId: branch.headRevisionId,
      } as never,
      'boss',
    )

    await run().catch(() => {})

    expect(posts.create).toHaveBeenCalledWith(expect.anything(), 'writer')
  })

  it('reuses the document-linked article when retrying a first publish', async () => {
    const { create, payload, posts, run } = harness()
    await create()
    payload().refId = null

    await run()

    expect(posts.findById).toHaveBeenCalledWith('post-1')
    expect(posts.create).not.toHaveBeenCalled()
  })
})

describe('PublishService AI resource modes', () => {
  it.each([
    { before: null, after: '2999-01-01T12:00:00Z' },
    { before: '2999-01-01T12:00:00Z', after: null },
  ])(
    'prepares sync resources before applying a schedule change: $before -> $after',
    async ({ before, after }) => {
      const { aiTasks, branch, create, posts, run } = harness()
      let article: Record<string, unknown> = {
        id: 'post-1',
        contentFormat: 'markdown',
        isPublished: true,
        publicAt: before,
      }
      posts.findById.mockImplementation(async () => article as any)
      posts.updateById.mockImplementation(async (_id, patch) => {
        article = { ...article, ...patch }
        return article as any
      })
      Object.assign(branch.headRevision.typeSpecificData, { publicAt: after })
      aiTasks.createSummaryTask.mockImplementation(async () => {
        expect(article.isPublished).toBe(false)
        return { taskId: 'task-summary' }
      })
      await create(false, [{ mode: 'sync', resource: 'summary' }])
      await run()
      expect(article).toMatchObject({ isPublished: true, publicAt: after })
    },
  )

  it('waits for sync resources before publishing and starts async ones after', async () => {
    const { create, order, run } = harness({ online: false })
    await create(false, [
      { mode: 'async', resource: 'insights' },
      { mode: 'sync', resource: 'summary' },
    ])

    await run()

    expect(order).toEqual([
      'summary',
      'wait:task-summary',
      'publish',
      'insights',
    ])
  })

  it('keeps the article published when an async resource fails to start', async () => {
    const { aiTasks, create, order, run } = harness({ online: false })
    aiTasks.createTranslationTask.mockRejectedValueOnce(new Error('quota'))
    await create(false, [{ mode: 'async', resource: 'translation' }])

    const setResult = await run()

    expect(order).toEqual(['publish'])
    expect(setResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ articleCommitted: true }),
    )
  })

  it('treats legacy resource names as sync', async () => {
    const { create, order, payload, run } = harness({ online: false })
    await create()
    payload().aiResources = ['summary'] as never

    await run()

    expect(order).toEqual(['summary', 'wait:task-summary', 'publish'])
  })

  it('cancels only sync tasks when the publish is aborted', async () => {
    const { aiTasks, create, run, tasks } = harness({ online: false })
    const controller = new AbortController()
    tasks.getTask.mockImplementation(async (id: string) => {
      controller.abort()
      return { id, status: TaskStatus.Running }
    })
    await create(false, [
      { mode: 'sync', resource: 'summary' },
      { mode: 'async', resource: 'insights' },
    ])

    await expect(run(controller.signal)).rejects.toThrow()

    expect(tasks.cancelTask).toHaveBeenCalledWith('task-summary')
    expect(aiTasks.createInsightsTask).not.toHaveBeenCalled()
  })
})

describe('PublishService AI SEO description', () => {
  const committedSeo = (posts: ReturnType<typeof harness>['posts']) =>
    (posts.updateById.mock.calls.at(-1)?.[1] as { seo?: unknown }).seo

  const withSeo = (
    branch: ReturnType<typeof harness>['branch'],
    seo: Record<string, unknown> | null,
  ) => {
    branch.headRevision.typeSpecificData = {
      slug: 'selected-title',
      seo,
      summary: 'Author summary',
    } as never
  }

  it('generates and stores a description before saving and translating', async () => {
    const { aiWriter, branch, create, drafts, order, posts, run } = harness()
    withSeo(branch, { title: 'SEO title' })
    await create(false, [
      { mode: 'sync', resource: 'seo' },
      { mode: 'sync', resource: 'translation' },
    ])

    await run()

    expect(aiWriter.generateSeoDescription).toHaveBeenCalledWith({
      summary: 'Author summary',
      text: 'Body',
      title: 'Selected title',
    })
    expect(drafts.setAiSeo).toHaveBeenCalledWith('document-1', {
      description: 'Generated description',
      sourceHash: expect.any(String),
    })
    expect(committedSeo(posts)).toEqual({
      description: 'Generated description',
      title: 'SEO title',
    })
    expect(order.slice(0, 2)).toEqual(['seo', 'translation'])
  })

  it('never replaces a description the author wrote', async () => {
    const { aiWriter, branch, create, posts, run } = harness()
    branch.document.aiSeo = { description: 'Old AI', sourceHash: 'x' }
    withSeo(branch, { description: 'Written by hand' })
    await create(false, [{ mode: 'sync', resource: 'seo' }])

    await run()

    expect(aiWriter.generateSeoDescription).not.toHaveBeenCalled()
    expect(committedSeo(posts)).toEqual({ description: 'Written by hand' })
  })

  it('reuses the stored description while the article is unchanged', async () => {
    const first = harness()
    withSeo(first.branch, null)
    await first.create(false, [{ mode: 'sync', resource: 'seo' }])
    await first.run()
    const stored = first.drafts.setAiSeo.mock.calls[0][1] as DocumentAiSeo

    const second = harness()
    withSeo(second.branch, null)
    second.branch.document.aiSeo = stored
    await second.create(false, [{ mode: 'sync', resource: 'seo' }])
    await second.run()

    expect(second.aiWriter.generateSeoDescription).not.toHaveBeenCalled()
    expect(committedSeo(second.posts)).toEqual({
      description: 'Generated description',
    })
  })

  it('keeps the stored description when the option is off', async () => {
    const { aiWriter, branch, create, posts, run } = harness()
    withSeo(branch, null)
    branch.document.aiSeo = { description: 'Stored AI', sourceHash: 'stale' }
    await create(false, [])

    await run()

    expect(aiWriter.generateSeoDescription).not.toHaveBeenCalled()
    expect(committedSeo(posts)).toEqual({ description: 'Stored AI' })
  })

  it('publishes without a description when generation fails', async () => {
    const { aiWriter, branch, create, drafts, posts, run } = harness()
    withSeo(branch, null)
    aiWriter.generateSeoDescription.mockRejectedValueOnce(new Error('quota'))
    await create(false, [{ mode: 'sync', resource: 'seo' }])

    const setResult = await run()

    expect(drafts.setAiSeo).not.toHaveBeenCalled()
    expect(committedSeo(posts)).toBeNull()
    expect(setResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ articleCommitted: true }),
    )
  })
})

describe('PublishService AI resource memory', () => {
  const remembered: PublishAiResourceRequest[] = [
    { mode: 'async', resource: 'summary' },
  ]

  it('reuses the last publish choices when the request omits them', async () => {
    const { branch, create, payload } = harness()
    branch.document.publishAiResources = remembered

    await create()

    expect(payload().aiResources).toEqual(remembered)
  })

  it('lets an explicit empty list override the remembered choices', async () => {
    const { branch, create, payload } = harness()
    branch.document.publishAiResources = remembered

    await create(false, [])

    expect(payload().aiResources).toEqual([])
  })

  it('remembers the choices once the publish finishes', async () => {
    const { create, drafts, run } = harness()
    await create(false, remembered)

    await run()

    expect(drafts.setPublishAiResources).toHaveBeenCalledWith(
      'document-1',
      remembered,
    )
  })
})

describe('CreatePublishJobSchema aiResources', () => {
  const base = {
    branchId: '1',
    expectedPublishedRevisionId: null,
    revisionId: '2',
  }

  it('normalises legacy names to sync and drops duplicates', () => {
    expect(
      CreatePublishJobSchema.parse({
        ...base,
        aiResources: ['summary', { mode: 'async', resource: 'summary' }, 'tts'],
      }).aiResources,
    ).toEqual([
      { mode: 'sync', resource: 'summary' },
      { mode: 'sync', resource: 'tts' },
    ])
  })

  it('leaves aiResources undefined when omitted', () => {
    expect(CreatePublishJobSchema.parse(base).aiResources).toBeUndefined()
  })
})

describe('CreatePublishJobSchema expectedPublishedRevisionId', () => {
  it('defaults to null when omitted', () => {
    expect(
      CreatePublishJobSchema.parse({ branchId: '1', revisionId: '2' })
        .expectedPublishedRevisionId,
    ).toBeNull()
  })

  it('keeps an explicit published revision id', () => {
    expect(
      CreatePublishJobSchema.parse({
        branchId: '1',
        revisionId: '2',
        expectedPublishedRevisionId: '3',
      }).expectedPublishedRevisionId,
    ).toBe('3')
  })

  it('publishes a never-published draft without the field', async () => {
    const { branch, tasks, service } = harness()
    branch.document.publishedRevisionId = null as never
    branch.document.refId = null as never

    await service.create({
      ...CreatePublishJobSchema.parse({ branchId: '1', revisionId: '2' }),
      branchId: branch.id,
      revisionId: branch.headRevisionId,
    })

    expect(tasks.createTask).toHaveBeenCalledTimes(1)
  })

  it('still guards an already published draft when the field is omitted', async () => {
    const { branch, tasks, service } = harness()

    await expect(
      service.create({
        ...CreatePublishJobSchema.parse({ branchId: '1', revisionId: '2' }),
        branchId: branch.id,
        revisionId: branch.headRevisionId,
      }),
    ).rejects.toMatchObject({ code: AppErrorCode.PUBLISHED_REVISION_CHANGED })
    expect(tasks.createTask).not.toHaveBeenCalled()
  })
})
