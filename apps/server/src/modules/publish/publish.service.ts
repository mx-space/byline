import { createAbortError, throwIfAborted } from '@mx-space/ai'
import {
  BadRequestException,
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common'

import { AppErrorCode, createAppException } from '~/common/errors'
import {
  type TaskExecuteContext,
  TaskQueueProcessor,
  TaskQueueService,
  TaskStatus,
} from '~/processors/task-queue'

import { AiTaskService } from '../ai/ai-task/ai-task.service'
import { DraftRefType } from '../draft/draft.enum'
import { DraftService } from '../draft/draft.service'
import { PostService } from '../post/post.service'
import type { PostModel } from '../post/post.types'
import { isPostPublic } from '../post/post-visibility'
import type { CreatePublishJobDto } from './publish.schema'
import {
  CONTENT_PUBLISH_TASK,
  normalizePublishAiResources,
  type PublishAiResource,
  type PublishTaskPayload,
  type PublishTaskResult,
} from './publish.types'

const TERMINAL = new Set([
  TaskStatus.Completed,
  TaskStatus.PartialFailed,
  TaskStatus.Failed,
  TaskStatus.Cancelled,
])

@Injectable()
export class PublishService implements OnModuleInit {
  private readonly logger = new Logger(PublishService.name)

  constructor(
    private readonly drafts: DraftService,
    private readonly posts: PostService,
    private readonly aiTasks: AiTaskService,
    private readonly tasks: TaskQueueService,
    private readonly processor: TaskQueueProcessor,
  ) {}

  onModuleInit() {
    this.processor.registerHandler<PublishTaskPayload>({
      type: CONTENT_PUBLISH_TASK,
      execute: (payload, context) => this.execute(payload, context),
      buildRetryTask: (task) => ({
        type: CONTENT_PUBLISH_TASK,
        payload: task.payload as Record<string, unknown>,
        dedupKey: this.dedupTarget(
          task.payload as unknown as PublishTaskPayload,
        ),
        scope: 'content',
      }),
    })
  }

  async create(dto: CreatePublishJobDto, actorId?: string) {
    const branch = await this.drafts.findById(dto.branchId)
    if (!branch) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, {
        id: dto.branchId,
      })
    }
    if (branch.headRevisionId !== dto.revisionId) {
      throw createAppException(AppErrorCode.DRAFT_HEAD_CONFLICT, {
        actualHeadRevisionId: branch.headRevisionId,
        branchId: branch.id,
        expectedHeadRevisionId: dto.revisionId,
      })
    }
    const actualPublishedRevisionId = branch.document.publishedRevisionId
    if (actualPublishedRevisionId !== dto.expectedPublishedRevisionId) {
      throw createAppException(AppErrorCode.PUBLISHED_REVISION_CHANGED, {
        actualPublishedRevisionId,
        documentId: branch.documentId,
        expectedPublishedRevisionId: dto.expectedPublishedRevisionId,
      })
    }
    if (
      branch.relationToPublished &&
      ['descendant', 'diverged'].includes(branch.relationToPublished) &&
      !dto.confirmDiverged
    ) {
      throw new BadRequestException(
        'Publishing this revision requires divergent-publication confirmation',
      )
    }

    const existing = branch.document.refId
      ? await this.findArticle(branch.document.refType, branch.document.refId)
      : null
    const online =
      existing && 'isPublished' in existing
        ? existing.isPublished !== false
        : Boolean(existing)
    const payload: PublishTaskPayload = {
      actorId,
      aiResources: normalizePublishAiResources(
        dto.aiResources ?? branch.document.publishAiResources ?? [],
      ),
      branchId: branch.id,
      documentId: branch.documentId,
      expectedPublishedRevisionId: dto.expectedPublishedRevisionId,
      regenerateLockedTranslations: dto.regenerateLockedTranslations,
      operation: !existing
        ? 'first-publish'
        : online
          ? 'online-update'
          : 'republish',
      refId: branch.document.refId,
      refType: branch.document.refType,
      revisionId: branch.headRevision.id,
      snapshot: structuredClone(branch.headRevision),
    }

    return this.tasks.createTask({
      type: CONTENT_PUBLISH_TASK,
      payload: payload as unknown as Record<string, unknown>,
      dedupKey: this.dedupTarget(payload),
      scope: 'content',
    })
  }

  private async execute(
    payload: PublishTaskPayload,
    context: TaskExecuteContext,
  ) {
    throwIfAborted(context.signal)
    await this.assertFrozenSelection(payload)
    const aiResources = normalizePublishAiResources(payload.aiResources)
    const byMode = (mode: 'sync' | 'async') =>
      aiResources
        .filter((item) => item.mode === mode)
        .map((item) => item.resource)
    await context.updateProgress(2, 'Saving article snapshot', 0, 2)

    const committed = await this.commitSnapshot(payload)
    const result: PublishTaskResult = {
      articleCommitted: committed.wasPublished,
      articleId: committed.id,
      newerDraftChanges: false,
      publishedRevisionId: payload.revisionId,
      resources: {},
    }
    if (committed.wasPublished) {
      await this.commitPublicationPointer(payload)
    }
    await context.setResult(result)

    try {
      await this.prepareResources(
        byMode('sync'),
        committed.id,
        result,
        context,
        payload.regenerateLockedTranslations,
      )
    } catch (error) {
      result.newerDraftChanges = await this.hasNewerBranchHead(payload)
      await context.setResult(result)
      if ((error as Error).name === 'AbortError') {
        await this.cancelResourceTasks(result.resources)
      }
      throw error
    }

    throwIfAborted(context.signal)
    if (!committed.wasPublished) {
      await context.updateProgress(95, 'Publishing article', 1, 2)
      await this.setPublished(payload.refType, committed.id)
      await this.commitPublicationPointer(payload)
      result.articleCommitted = true
    }

    await this.startAsyncResources(
      byMode('async'),
      committed.id,
      result,
      payload.regenerateLockedTranslations,
    )
    await this.drafts.setPublishAiResources(payload.documentId, aiResources)

    result.newerDraftChanges = await this.hasNewerBranchHead(payload)
    await context.setResult(result)
    await context.updateProgress(100, 'Published', 2, 2)
  }

  private async assertFrozenSelection(payload: PublishTaskPayload) {
    const branch = await this.drafts.findById(payload.branchId)
    if (!branch) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, {
        id: payload.branchId,
      })
    }
    if (
      branch.documentId !== payload.documentId ||
      branch.document.publishedRevisionId !==
        payload.expectedPublishedRevisionId
    ) {
      throw createAppException(AppErrorCode.PUBLISHED_REVISION_CHANGED, {
        actualPublishedRevisionId: branch.document.publishedRevisionId,
        documentId: payload.documentId,
        expectedPublishedRevisionId: payload.expectedPublishedRevisionId,
      })
    }
    payload.refId = branch.document.refId
  }

  private async commitPublicationPointer(payload: PublishTaskPayload) {
    const recorded = await this.drafts.recordPublication(
      payload.documentId,
      payload.revisionId,
      payload.expectedPublishedRevisionId,
    )
    if (recorded.kind === 'conflict') {
      throw createAppException(AppErrorCode.PUBLISHED_REVISION_CHANGED, {
        actualPublishedRevisionId: recorded.actualPublishedRevisionId,
        documentId: payload.documentId,
        expectedPublishedRevisionId: payload.expectedPublishedRevisionId,
      })
    }
    if (recorded.kind === 'missing') {
      throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
        id: payload.revisionId,
      })
    }
  }

  private async commitSnapshot(payload: PublishTaskPayload) {
    const existing = payload.refId
      ? await this.findArticle(payload.refType, payload.refId)
      : null
    const data = this.articleData(payload, existing)
    const wasPublished = Boolean(
      existing &&
      isPostPublic(existing) &&
      isPostPublic({
        ...existing,
        ...data,
      } as PostModel),
    )

    let saved: PostModel | undefined | null = existing
      ? await this.posts.updateById(existing.id, {
          ...data,
          ...(!wasPublished ? { isPublished: false } : {}),
        } as Partial<PostModel>)
      : await this.posts.create(
          { ...(data as unknown as PostModel), isPublished: false },
          payload.actorId,
        )
    if (!saved && existing) {
      saved = await this.findArticle(payload.refType, existing.id)
    }
    if (!saved) throw createAppException(AppErrorCode.NO_CONTENT_MODIFIABLE)

    if (!payload.refId) {
      await this.drafts.linkDocument(payload.documentId, saved.id)
      payload.refId = saved.id
    }
    return { id: String(saved.id), wasPublished }
  }

  private articleData(payload: PublishTaskPayload, existing: PostModel | null) {
    const snapshot = payload.snapshot
    const typeSpecificData = { ...snapshot.typeSpecificData }
    if (payload.refType === DraftRefType.Post && 'pin' in typeSpecificData) {
      const pin = Boolean(typeSpecificData.pin)
      delete typeSpecificData.pin
      typeSpecificData.pinAt = pin
        ? existing && 'pinAt' in existing
          ? existing.pinAt || new Date()
          : new Date()
        : null
    }
    return {
      ...typeSpecificData,
      content: snapshot.content ?? undefined,
      contentFormat: snapshot.contentFormat,
      images: snapshot.images ?? undefined,
      meta: snapshot.meta,
      text: snapshot.text,
      title: snapshot.title,
    }
  }

  private async prepareResources(
    resources: PublishAiResource[],
    refId: string,
    result: PublishTaskResult,
    context: TaskExecuteContext,
    regenerateLocked?: boolean,
  ) {
    if (!resources.length) return
    await context.updateProgress(
      10,
      'Preparing AI resources',
      0,
      resources.length,
    )

    for (const resource of resources) {
      throwIfAborted(context.signal)
      const created = await this.createResourceTask(
        resource,
        refId,
        regenerateLocked,
      )
      result.resources[resource] = created.taskId
    }
    await context.setResult(result)

    let completed = 0
    for (const resource of resources) {
      const taskId = result.resources[resource]!
      const task = await this.waitForTask(taskId, context.signal)
      if (task.status !== TaskStatus.Completed) {
        throw new Error(
          `${resource} preparation ended with ${task.status}${task.error ? `: ${task.error}` : ''}`,
        )
      }
      completed++
      await context.updateProgress(
        10 + Math.round((completed / resources.length) * 80),
        `Prepared ${completed}/${resources.length}`,
        completed,
        resources.length,
      )
    }
  }

  private async startAsyncResources(
    resources: PublishAiResource[],
    refId: string,
    result: PublishTaskResult,
    regenerateLocked?: boolean,
  ) {
    for (const resource of resources) {
      try {
        const created = await this.createResourceTask(
          resource,
          refId,
          regenerateLocked,
        )
        result.resources[resource] = created.taskId
      } catch (error) {
        this.logger.warn(
          `Async ${resource} task for ${refId} was not created: ${(error as Error).message}`,
        )
      }
    }
  }

  private createResourceTask(
    resource: PublishAiResource,
    refId: string,
    regenerateLocked?: boolean,
  ) {
    switch (resource) {
      case 'summary': {
        return this.aiTasks.createSummaryTask({ refId })
      }
      case 'insights': {
        return this.aiTasks.createInsightsTask({ refId })
      }
      case 'translation': {
        return this.aiTasks.createTranslationTask({
          refId,
          ...(regenerateLocked ? { regenerateLocked: true } : {}),
        })
      }
      case 'tts': {
        return this.aiTasks.createTtsTask({ refId })
      }
    }
  }

  private async waitForTask(taskId: string, signal: AbortSignal) {
    for (;;) {
      throwIfAborted(signal)
      const task = await this.tasks.getTask(taskId)
      if (!task) throw new Error(`AI task ${taskId} disappeared`)
      if (TERMINAL.has(task.status)) return task
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000)
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timeout)
            reject(createAbortError())
          },
          { once: true },
        )
      })
    }
  }

  private async cancelResourceTasks(
    resources: Partial<Record<PublishAiResource, string>>,
  ) {
    await Promise.allSettled(
      Object.values(resources).map(async (taskId) => {
        const task = await this.tasks.getTask(taskId)
        if (task && !TERMINAL.has(task.status)) {
          await this.tasks.cancelTask(taskId)
        }
      }),
    )
  }

  private findArticle(_refType: DraftRefType, refId: string) {
    return this.posts.findById(refId)
  }

  private setPublished(_refType: DraftRefType, refId: string) {
    return this.posts.updateById(refId, { isPublished: true })
  }

  private async hasNewerBranchHead(payload: PublishTaskPayload) {
    const latest = await this.drafts.findById(payload.branchId)
    return Boolean(latest && latest.headRevisionId !== payload.revisionId)
  }

  private dedupTarget(payload: PublishTaskPayload) {
    return payload.documentId
  }
}
