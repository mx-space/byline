import { Injectable } from '@nestjs/common'
import type { OpId } from 'loro-crdt'

import { AppErrorCode, createAppException } from '~/common/errors'
import { AppException } from '~/common/errors/exception.types'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import { UserPermission } from '~/constants/permission.constant'
import { FileReferenceType } from '~/modules/file/file-reference.enum'
import { FileReferenceService } from '~/modules/file/file-reference.service'
import { DatabaseService } from '~/processors/database/database.service'
import { EventManagerService } from '~/processors/helper/helper.event.service'
import type { EntityId } from '~/shared/id/entity-id'
import { hasPermission } from '~/utils/permission.util'

import { DraftRefType } from './draft.enum'
import { DraftRepository } from './draft.repository'
import type {
  CreateDraftDto,
  DraftCheckpointDto,
  UpdateDraftDto,
} from './draft.schema'
import type {
  ContentDocumentRow,
  ContentPublicationEventRow,
  ContentRevisionRow,
  CrdtFieldsPatch,
  DraftActor,
  DraftBranchRow,
  DraftBranchView,
  DraftListFilter,
  DraftUpdateEventPayload,
  RevisionComparison,
  RevisionSnapshot,
  VersionContext,
  VersionTreeNode,
} from './draft.types'
import { canonicalSnapshot, sameRevisionContent } from './draft-content'
import { type CheckpointResult, DraftCrdtService } from './draft-crdt.service'

const projectVersionTree = (
  document: ContentDocumentRow,
  branches: DraftBranchRow[],
  revisions: ContentRevisionRow[],
  publicationEvents: ContentPublicationEventRow[],
): VersionTreeNode[] => {
  const byId = new Map(revisions.map((revision) => [revision.id, revision]))
  const endpoints = new Set<EntityId>()
  if (document.publishedRevisionId) endpoints.add(document.publishedRevisionId)
  for (const branch of branches) endpoints.add(branch.headRevisionId)
  for (const event of publicationEvents) {
    endpoints.add(event.revisionId)
    if (event.previousRevisionId) endpoints.add(event.previousRevisionId)
  }

  const reachable = new Set<EntityId>()
  for (const endpoint of endpoints) {
    let revision = byId.get(endpoint)
    while (revision && !reachable.has(revision.id)) {
      reachable.add(revision.id)
      revision = revision.parentRevisionId
        ? byId.get(revision.parentRevisionId)
        : undefined
    }
  }

  const children = new Map<EntityId, EntityId[]>()
  for (const revision of revisions) {
    if (!reachable.has(revision.id) || !revision.parentRevisionId) continue
    const siblings = children.get(revision.parentRevisionId) ?? []
    siblings.push(revision.id)
    children.set(revision.parentRevisionId, siblings)
  }

  const visible = new Set(endpoints)
  for (const branch of branches) visible.add(branch.baseRevisionId)
  for (const revisionId of reachable) {
    const revision = byId.get(revisionId)
    if (
      !revision?.parentRevisionId ||
      (children.get(revisionId)?.length ?? 0) > 1
    ) {
      visible.add(revisionId)
    }
  }

  const baseIds = new Map<EntityId, EntityId[]>()
  const headIds = new Map<EntityId, EntityId[]>()
  for (const branch of branches) {
    baseIds.set(branch.baseRevisionId, [
      ...(baseIds.get(branch.baseRevisionId) ?? []),
      branch.id,
    ])
    headIds.set(branch.headRevisionId, [
      ...(headIds.get(branch.headRevisionId) ?? []),
      branch.id,
    ])
  }

  const publishedAt = new Map<EntityId, Date>()
  for (const event of publicationEvents) {
    publishedAt.set(event.revisionId, event.createdAt)
    if (
      event.previousRevisionId &&
      !publishedAt.has(event.previousRevisionId)
    ) {
      const previous = byId.get(event.previousRevisionId)
      if (previous) publishedAt.set(previous.id, previous.createdAt)
    }
  }
  if (
    document.publishedRevisionId &&
    !publishedAt.has(document.publishedRevisionId)
  ) {
    const published = byId.get(document.publishedRevisionId)
    if (published) publishedAt.set(published.id, published.createdAt)
  }

  // ponytail: scan one document in memory; move this projection into SQL only if
  // a real document grows beyond a few thousand revisions.
  return revisions.flatMap((revision) => {
    if (!visible.has(revision.id) || !reachable.has(revision.id)) return []
    let parentId = revision.parentRevisionId
    let collapsedRevisionCount = 0
    while (parentId && !visible.has(parentId)) {
      collapsedRevisionCount += 1
      parentId = byId.get(parentId)?.parentRevisionId ?? null
    }
    return [
      {
        branchBaseIds: baseIds.get(revision.id) ?? [],
        branchHeadIds: headIds.get(revision.id) ?? [],
        collapsedRevisionCount,
        parentNodeId: parentId,
        publishedAt: publishedAt.get(revision.id) ?? null,
        revision,
      },
    ]
  })
}

@Injectable()
export class DraftService {
  constructor(
    private readonly draftRepository: DraftRepository,
    private readonly fileReferenceService: FileReferenceService,
    private readonly databaseService: DatabaseService,
    private readonly eventManager: EventManagerService,
    private readonly crdtService: DraftCrdtService,
  ) {}

  get repository() {
    return this.draftRepository
  }

  async list(page: number, size: number, filter: DraftListFilter = {}) {
    const result = await this.draftRepository.list(page, size, filter)
    return {
      ...result,
      data: await Promise.all(
        result.data.map((branch) => this.hydrate(branch)),
      ),
    }
  }

  count(filter: DraftListFilter = {}) {
    return this.draftRepository.count(filter)
  }

  async getContext(
    refType: DraftRefType,
    refId: string,
  ): Promise<VersionContext> {
    const document = await this.ensurePublishedDocument(refType, refId)
    return this.contextForDocument(document)
  }

  private async assertCanEdit(actor: DraftActor, document: ContentDocumentRow) {
    if (!hasPermission(actor, UserPermission.EditPost)) {
      throw createAppException(AppErrorCode.PERMISSION_DENIED)
    }
    if (hasPermission(actor, UserPermission.EditOthersPost)) return
    const owns =
      document.createdBy === actor.id ||
      (!!document.refId &&
        document.refType === DraftRefType.Post &&
        (await this.draftRepository.isPostAuthor(document.refId, actor.id)))
    if (!owns) throw createAppException(AppErrorCode.PERMISSION_DENIED)
  }

  async create(
    dto: CreateDraftDto,
    actor: DraftActor,
  ): Promise<DraftBranchView> {
    const snapshot = canonicalSnapshot(dto.refType as DraftRefType, dto.data)
    let document: ContentDocumentRow
    let base: ContentRevisionRow

    if (dto.baseRevisionId) {
      const revision = await this.draftRepository.findRevisionById(
        dto.baseRevisionId,
      )
      if (!revision) {
        throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
          id: dto.baseRevisionId,
        })
      }
      const foundDocument = await this.draftRepository.findDocumentById(
        revision.documentId,
      )
      if (!foundDocument || foundDocument.refType !== dto.refType) {
        throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
          id: dto.baseRevisionId,
        })
      }
      if (dto.refId && foundDocument.refId !== dto.refId) {
        throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
          id: dto.baseRevisionId,
        })
      }
      await this.assertCanEdit(actor, foundDocument)
      document = foundDocument
      base = revision
    } else if (dto.refId) {
      document = await this.ensurePublishedDocument(
        dto.refType as DraftRefType,
        dto.refId,
      )
      if (!document.publishedRevisionId) {
        throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
          id: document.id,
        })
      }
      await this.assertCanEdit(actor, document)
      const published = await this.draftRepository.findRevisionById(
        document.publishedRevisionId,
      )
      if (!published) {
        throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
          id: document.publishedRevisionId,
        })
      }
      base = published
    } else {
      const created = await this.draftRepository.createDocumentWithRoot(
        dto.refType as DraftRefType,
        null,
        snapshot,
        false,
        actor.id,
      )
      document = created.document
      base = created.revision
    }

    if (dto.baseRevisionId || dto.refId) {
      const workingCopy = await this.crdtService.workingCopyOfDocument(
        document.id,
      )
      if (workingCopy) {
        if (
          dto.ifInSync &&
          (await this.draftRepository.relationOf(workingCopy.id)) !== 'in_sync'
        ) {
          throw createAppException(AppErrorCode.DRAFT_WORKING_COPY_AHEAD, {
            documentId: String(document.id),
          })
        }
        return this.legacyView(
          await this.crdtService.legacyWrite(workingCopy.id, base.id, snapshot),
        )
      }
    }

    const created = await this.draftRepository.createBranch(
      document.id,
      base.id,
      snapshot,
      sameRevisionContent(base, snapshot),
    )
    await this.fileReferenceService.updateReferencesForDocument(
      created.headRevision,
      created.branch.id,
      FileReferenceType.Draft,
    )
    const view = await this.hydrate(created.branch)
    this.broadcastUpdate(view)
    return view
  }

  async update(
    id: string,
    dto: UpdateDraftDto,
    actor: DraftActor,
  ): Promise<DraftBranchView> {
    const branch = await this.draftRepository.findBranchById(id)
    if (!branch) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    const document = await this.draftRepository.findDocumentById(
      branch.documentId,
    )
    if (!document) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    await this.assertCanEdit(actor, document)
    const snapshot = canonicalSnapshot(document.refType, dto.data)
    if (await this.crdtService.usesCrdt(id)) {
      return this.legacyView(
        await this.crdtService.legacyWrite(
          id,
          dto.expectedHeadRevisionId,
          snapshot,
        ),
      )
    }
    const result = await this.draftRepository.saveBranch(
      id,
      dto.expectedHeadRevisionId,
      snapshot,
    )
    if (result.kind === 'missing') {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    if (result.kind === 'conflict') {
      throw createAppException(AppErrorCode.DRAFT_HEAD_CONFLICT, {
        actualHeadRevisionId: result.actualHeadRevisionId,
        branchId: id,
        expectedHeadRevisionId: dto.expectedHeadRevisionId,
      })
    }
    await this.fileReferenceService.updateReferencesForDocument(
      result.headRevision,
      result.branch.id,
      FileReferenceType.Draft,
    )
    const view = await this.hydrate(result.branch)
    this.broadcastUpdate(view)
    return view
  }

  /**
   * Tells every connected admin that this branch has a new head. Best-effort by
   * design: the save already committed, so a broadcast failure must not surface
   * as a failed request — the client still gets the new head in the response.
   */
  private broadcastUpdate(view: DraftBranchView) {
    this.broadcast(view, view.document)
  }

  private broadcast(branch: DraftBranchRow, document: ContentDocumentRow) {
    void this.eventManager.emit(
      BusinessEvents.DRAFT_UPDATE,
      {
        branchId: branch.id,
        documentId: branch.documentId,
        headRevisionId: branch.headRevisionId,
        refId: document.refId,
        refType: document.refType,
      } satisfies DraftUpdateEventPayload,
      { scope: EventScope.TO_ADMIN },
    )
  }

  private async editableBranch(
    id: string,
    actor: DraftActor,
  ): Promise<DraftBranchRow> {
    const branch = await this.draftRepository.findBranchById(id)
    const document =
      branch && (await this.draftRepository.findDocumentById(branch.documentId))
    if (!branch || !document) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    await this.assertCanEdit(actor, document)
    return branch
  }

  async documentIdOf(id: string): Promise<string> {
    const branch = await this.draftRepository.findBranchById(id)
    if (!branch) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    return String(branch.documentId)
  }

  async canEdit(id: string, actor: DraftActor): Promise<boolean> {
    try {
      await this.editableBranch(id, actor)
      return true
    } catch (error) {
      if (error instanceof AppException) return false
      throw error
    }
  }

  async openWorkingCopy(
    refType: DraftRefType,
    refId: string,
    actor: DraftActor,
  ): Promise<DraftBranchView> {
    const document = await this.ensurePublishedDocument(refType, refId)
    await this.assertCanEdit(actor, document)
    const workingCopy = await this.crdtService.workingCopyOfDocument(
      document.id,
    )
    if (!workingCopy) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id: refId })
    }
    return this.checkpointView(
      await this.crdtService.createCheckpoint(workingCopy.id, 'save'),
    )
  }

  async mergeArticleFields(
    refType: DraftRefType,
    refId: string,
    typeSpecificData: Record<string, unknown>,
  ): Promise<void> {
    if (!Object.keys(typeSpecificData).length) return
    const document = await this.draftRepository.findDocumentByRef(
      refType,
      refId,
    )
    if (document) {
      await this.crdtService.mergeDocumentFields(document.id, typeSpecificData)
    }
  }

  usesCrdt(id: string): Promise<boolean> {
    return this.crdtService.usesCrdt(id)
  }

  async findForEditing(
    id: string,
    actor: DraftActor,
  ): Promise<DraftBranchView | null> {
    await this.editableBranch(id, actor)
    if (await this.crdtService.usesCrdt(id)) {
      return this.checkpointView(
        await this.crdtService.createCheckpoint(id, 'save'),
      )
    }
    return this.findById(id)
  }

  async exportCrdtFor(id: string, actor: DraftActor, since?: Uint8Array) {
    await this.editableBranch(id, actor)
    return this.crdtService.exportFor(id, since)
  }

  async exportCrdt(
    id: string,
    actor: DraftActor,
    since?: Uint8Array,
  ): Promise<Uint8Array> {
    return (await this.exportCrdtFor(id, actor, since)).update
  }

  async importCrdt(
    id: string,
    bytes: Uint8Array,
    actor: DraftActor,
    origin?: string,
    author?: string,
  ): Promise<void> {
    await this.editableBranch(id, actor)
    const { branch, document } = await this.crdtService.importUpdate(
      id,
      bytes,
      origin,
      author,
    )
    this.broadcast(branch, document)
  }

  async createCheckpoint(
    id: string,
    kind: DraftCheckpointDto['kind'],
    actor: DraftActor,
  ): Promise<DraftBranchView> {
    await this.editableBranch(id, actor)
    return this.checkpointView(
      await this.crdtService.createCheckpoint(id, kind),
    )
  }

  async updateFields(id: string, patch: CrdtFieldsPatch, actor: DraftActor) {
    await this.editableBranch(id, actor)
    return this.crdtService.updateFields(id, patch)
  }

  async history(id: string, actor: DraftActor) {
    await this.editableBranch(id, actor)
    return this.crdtService.history(id)
  }

  async archivedDrafts(
    id: string,
    actor: DraftActor,
  ): Promise<DraftBranchView[]> {
    const branch = await this.editableBranch(id, actor)
    const archived = await this.draftRepository.findBranchesByDocument(
      branch.documentId,
      'archived',
    )
    return Promise.all(archived.map((row) => this.hydrate(row)))
  }

  async restore(
    id: string,
    revisionId: string,
    actor: DraftActor,
  ): Promise<DraftBranchView> {
    await this.editableBranch(id, actor)
    return this.checkpointView(await this.crdtService.restore(id, revisionId))
  }

  async undo(id: string, change: OpId, before: OpId[], actor: DraftActor) {
    await this.editableBranch(id, actor)
    return this.checkpointView(await this.crdtService.undo(id, change, before))
  }

  private async checkpointView(
    result: CheckpointResult,
  ): Promise<DraftBranchView> {
    const view = await this.hydrate(result.branch)
    this.broadcastUpdate(view)
    return view
  }

  private async legacyView(result: CheckpointResult): Promise<DraftBranchView> {
    const view = await this.checkpointView(result)
    return {
      ...view,
      headRevision: result.revision,
      headRevisionId: result.revision.id,
    }
  }

  async findById(id: string): Promise<DraftBranchView | null> {
    const branch = await this.draftRepository.findBranchById(id)
    return branch ? this.hydrate(branch) : null
  }

  async findRevisionById(id: string): Promise<ContentRevisionRow> {
    const revision = await this.draftRepository.findRevisionById(id)
    if (!revision) {
      throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, { id })
    }
    return revision
  }

  async findNewDrafts(refType: DraftRefType): Promise<DraftBranchView[]> {
    const result = await this.draftRepository.list(1, 50, {
      hasRef: false,
      refType,
    })
    return Promise.all(result.data.map((branch) => this.hydrate(branch)))
  }

  async getBranchRevisions(id: string): Promise<ContentRevisionRow[]> {
    const branch = await this.draftRepository.findBranchById(id)
    if (!branch) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
    }
    const ancestry = await this.draftRepository.findAncestryIds(
      branch.headRevisionId,
    )
    const revisions = await this.draftRepository.findRevisionsByIds(ancestry)
    const byId = new Map(revisions.map((revision) => [revision.id, revision]))
    return ancestry.flatMap((revisionId) => {
      const revision = byId.get(revisionId)
      return revision ? [revision] : []
    })
  }

  async compare(leftId: string, rightId: string): Promise<RevisionComparison> {
    const [left, right] = await Promise.all([
      this.draftRepository.findRevisionById(leftId),
      this.draftRepository.findRevisionById(rightId),
    ])
    if (!left) {
      throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
        id: leftId,
      })
    }
    if (!right || left.documentId !== right.documentId) {
      throw createAppException(AppErrorCode.CONTENT_REVISION_NOT_FOUND, {
        id: rightId,
      })
    }
    const [leftAncestry, rightAncestry] = await Promise.all([
      this.draftRepository.findAncestryIds(left.id),
      this.draftRepository.findAncestryIds(right.id),
    ])
    const leftSet = new Set(leftAncestry)
    const rightSet = new Set(rightAncestry)
    const relation =
      left.id === right.id
        ? 'same'
        : rightSet.has(left.id)
          ? 'ancestor'
          : leftSet.has(right.id)
            ? 'descendant'
            : 'diverged'
    return {
      commonAncestorRevisionId:
        leftAncestry.find((id) => rightSet.has(id)) ?? null,
      left,
      relation,
      right,
    }
  }

  async delete(id: string, actor: DraftActor): Promise<void> {
    if (!hasPermission(actor, UserPermission.EditOthersPost)) {
      const target = await this.draftRepository.findBranchById(id)
      const document =
        target &&
        (await this.draftRepository.findDocumentById(target.documentId))
      if (!document) {
        throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id })
      }
      await this.assertCanEdit(actor, document)
    }
    await this.crdtService.discard(id)
  }

  async deleteByRef(refType: DraftRefType, refId: string): Promise<void> {
    const document = await this.draftRepository.findDocumentByRef(
      refType,
      refId,
    )
    if (document) {
      const branches = await this.draftRepository.findBranchesByDocument(
        document.id,
      )
      await Promise.all(
        branches.map((branch) =>
          this.fileReferenceService.removeReferencesForDocument(
            branch.id,
            FileReferenceType.Draft,
          ),
        ),
      )
    }
    await this.draftRepository.deleteDocumentByRef(refType, refId)
  }

  async linkDocument(documentId: string, publishedId: string) {
    return this.draftRepository.linkDocument(documentId, publishedId)
  }

  async recordPublication(
    documentId: string,
    revisionId: string,
    expectedPublishedRevisionId: string | null,
  ) {
    return this.draftRepository.recordPublication(
      documentId,
      revisionId,
      expectedPublishedRevisionId,
    )
  }

  async setPublishAiResources(
    documentId: string,
    resources: ContentDocumentRow['publishAiResources'],
  ) {
    await this.draftRepository.setPublishAiResources(documentId, resources)
  }

  async setAiSeo(documentId: string, aiSeo: ContentDocumentRow['aiSeo']) {
    await this.draftRepository.setAiSeo(documentId, aiSeo)
  }

  private async ensurePublishedDocument(
    refType: DraftRefType,
    refId: string,
  ): Promise<ContentDocumentRow> {
    const existing = await this.draftRepository.findDocumentByRef(
      refType,
      refId,
    )
    if (existing) return existing

    const found = await this.databaseService.findGlobalById(refId)
    if (!found || String(found.type) !== String(refType)) {
      throw createAppException(AppErrorCode.NO_CONTENT_MODIFIABLE)
    }
    const created = await this.draftRepository.createDocumentWithRoot(
      refType,
      refId,
      this.snapshotArticle(
        refType,
        found.document as unknown as Record<string, unknown>,
      ),
      true,
    )
    return created.document
  }

  private async contextForDocument(
    document: ContentDocumentRow,
  ): Promise<VersionContext> {
    const [publishedRevision, branches, revisions, publicationEvents] =
      await Promise.all([
        document.publishedRevisionId
          ? this.draftRepository.findRevisionById(document.publishedRevisionId)
          : Promise.resolve(null),
        this.draftRepository.findBranchesByDocument(document.id),
        this.draftRepository.findRevisionsByDocument(document.id),
        this.draftRepository.findPublicationEventsByDocument(document.id),
      ])
    return {
      branches: await Promise.all(
        branches.map((branch) => this.hydrate(branch)),
      ),
      document,
      publishedRevision,
      versionTree: projectVersionTree(
        document,
        branches,
        revisions,
        publicationEvents,
      ),
    }
  }

  private async hydrate(branch: DraftBranchRow): Promise<DraftBranchView> {
    const document = await this.draftRepository.findDocumentById(
      branch.documentId,
    )
    if (!document) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id: branch.id })
    }
    const [baseRevision, headRevision, publishedRevision] = await Promise.all([
      this.draftRepository.findRevisionById(branch.baseRevisionId),
      this.draftRepository.findRevisionById(branch.headRevisionId),
      document.publishedRevisionId
        ? this.draftRepository.findRevisionById(document.publishedRevisionId)
        : Promise.resolve(null),
    ])
    if (!baseRevision || !headRevision) {
      throw createAppException(AppErrorCode.DRAFT_NOT_FOUND, { id: branch.id })
    }
    const comparison = publishedRevision
      ? await this.compare(publishedRevision.id, headRevision.id)
      : null
    return {
      ...branch,
      baseRevision,
      commonAncestorRevisionId: comparison?.commonAncestorRevisionId ?? null,
      document,
      headRevision,
      publishedRevision,
      relation: await this.draftRepository.relationOf(branch.id),
      relationToPublished: comparison?.relation ?? null,
    }
  }

  private snapshotArticle(
    refType: DraftRefType,
    article: Record<string, unknown>,
  ): RevisionSnapshot {
    const common = {
      content: (article.content as string | null) ?? null,
      contentFormat: 'lexical' as const,
      images: (article.images as unknown[] | null) ?? null,
      meta: (article.meta as Record<string, unknown> | null) ?? null,
      text: (article.text as string) ?? '',
      title: (article.title as string) ?? '',
    }
    return canonicalSnapshot(refType, {
      ...common,
      typeSpecificData: {
        authors: Array.isArray(article.authors)
          ? article.authors.map((item) => (item as { id: string }).id)
          : [],
        categoryId: article.categoryId,
        image: article.image ?? null,
        pin: Boolean(article.pinAt),
        pinOrder: article.pinOrder,
        seo: article.seo ?? null,
        slug: article.slug,
        sourceLang: article.sourceLang ?? null,
        publicAt:
          article.publicAt instanceof Date
            ? article.publicAt.toISOString()
            : (article.publicAt ?? null),
        summary: article.summary,
        tags: article.tags,
      },
    })
  }
}
