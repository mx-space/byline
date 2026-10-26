import { describe, expect, it, vi } from 'vitest'

import { AppErrorCode } from '~/common/errors/app-error-code'
import { AppException } from '~/common/errors/exception.types'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import {
  ALL_PERMISSIONS,
  PERMISSION_PRESETS,
} from '~/constants/permission.constant'
import { DraftRefType } from '~/modules/draft/draft.enum'
import { DraftService } from '~/modules/draft/draft.service'
import { FileReferenceType } from '~/modules/file/file-reference.enum'

const at = new Date('2026-08-31T00:00:00Z')
const snapshot = (title: string) => ({
  content: null,
  contentFormat: 'markdown',
  images: null,
  meta: null,
  text: title,
  title,
  typeSpecificData: { slug: title.toLowerCase() },
})
const document = {
  createdAt: at,
  id: 'document-1',
  publishedRevisionId: 'published-2',
  refId: 'post-1',
  refType: DraftRefType.Post,
  updatedAt: at,
}
const revision = (
  id: string,
  parentRevisionId: string | null,
  title: string,
) => ({
  ...snapshot(title),
  createdAt: at,
  documentId: document.id,
  id,
  parentRevisionId,
})
const branch = {
  baseRevisionId: 'published-1',
  createdAt: at,
  documentId: document.id,
  headRevisionId: 'branch-head',
  id: 'branch-1',
  status: 'active',
  updatedAt: at,
}

const owner = { id: 'owner', permissions: ALL_PERMISSIONS }
const author = { id: 'writer', permissions: PERMISSION_PRESETS.author }

const harness = () => {
  const repository = {
    archiveBranch: vi.fn(),
    createBranch: vi.fn(),
    createDocumentWithRoot: vi.fn(),
    findAncestryIds: vi.fn(),
    findBranchById: vi.fn(),
    findBranchesByDocument: vi.fn(),
    findDocumentById: vi.fn(),
    findDocumentByRef: vi.fn(),
    findPublicationEventsByDocument: vi.fn(),
    findRevisionById: vi.fn(),
    findRevisionsByDocument: vi.fn(),
    findRevisionsByIds: vi.fn(),
    isPostAuthor: vi.fn(),
    relationOf: vi.fn(async () => 'ahead'),
    saveBranch: vi.fn(),
  }
  const fileReferences = {
    removeReferencesForDocument: vi.fn(),
    updateReferencesForDocument: vi.fn(),
  }
  const crdt = {
    discard: vi.fn(),
    usesCrdt: vi.fn(async () => false),
    workingCopyOfDocument: vi.fn(async () => null),
  }
  const service = new DraftService(
    repository as never,
    fileReferences as never,
    {} as never,
    { emit: vi.fn() } as never,
    crdt as never,
  )
  return { crdt, fileReferences, repository, service }
}

describe('DraftService tree revisions', () => {
  it('creates a new branch from an older revision even when publication moved on', async () => {
    const { fileReferences, repository, service } = harness()
    const revisions = new Map([
      ['root', revision('root', null, 'Root')],
      ['published-1', revision('published-1', 'root', 'Published one')],
      ['published-2', revision('published-2', 'root', 'Published two')],
      ['branch-head', revision('branch-head', 'published-1', 'New branch')],
    ])
    repository.findRevisionById.mockImplementation(async (id: string) =>
      revisions.get(id),
    )
    repository.findDocumentById.mockResolvedValue(document)
    repository.createBranch.mockResolvedValue({
      branch,
      headRevision: revisions.get('branch-head'),
    })
    repository.findAncestryIds.mockImplementation(async (id: string) =>
      id === 'published-2'
        ? ['published-2', 'root']
        : ['branch-head', 'published-1', 'root'],
    )

    const created = await service.create(
      {
        baseRevisionId: 'published-1',
        data: snapshot('New branch'),
        refId: 'post-1',
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    expect(repository.createBranch).toHaveBeenCalledWith(
      document.id,
      'published-1',
      snapshot('New branch'),
      false,
    )
    expect(created.relationToPublished).toBe('diverged')
    expect(created.commonAncestorRevisionId).toBe('root')
    expect(fileReferences.updateReferencesForDocument).toHaveBeenCalledWith(
      revisions.get('branch-head'),
      branch.id,
      FileReferenceType.Draft,
    )
  })

  it('conflicts only when the selected branch head changed', async () => {
    const { repository, service } = harness()
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue(document)
    repository.saveBranch.mockResolvedValue({
      actualHeadRevisionId: 'winner-head',
      kind: 'conflict',
    })

    const error = await service
      .update(
        branch.id,
        {
          data: snapshot('Loser'),
          expectedHeadRevisionId: 'branch-head',
        } as never,
        owner,
      )
      .catch((reason) => reason)

    expect(error).toBeInstanceOf(AppException)
    expect(error.code).toBe(AppErrorCode.DRAFT_HEAD_CONFLICT)
    expect(error.details).toEqual({
      actualHeadRevisionId: 'winner-head',
      branchId: branch.id,
      expectedHeadRevisionId: 'branch-head',
    })
  })

  it('classifies two branches by their common ancestor', async () => {
    const { repository, service } = harness()
    const left = revision('left', 'root', 'Left')
    const right = revision('right', 'root', 'Right')
    repository.findRevisionById.mockImplementation(async (id: string) =>
      id === 'left' ? left : right,
    )
    repository.findAncestryIds.mockImplementation(async (id: string) => [
      id,
      'root',
    ])

    await expect(service.compare('left', 'right')).resolves.toMatchObject({
      commonAncestorRevisionId: 'root',
      relation: 'diverged',
    })
  })

  it('projects publication markers, fork points, and branch heads into a compressed tree', async () => {
    const { repository, service } = harness()
    const treeDocument = { ...document, publishedRevisionId: 'online-2' }
    const revisions = new Map([
      ['root', revision('root', null, 'Root')],
      ['online-1', revision('online-1', 'root', 'Online one')],
      ['online-2', revision('online-2', 'online-1', 'Online two')],
      ['draft-a-1', revision('draft-a-1', 'root', 'Draft A autosave')],
      ['draft-a-2', revision('draft-a-2', 'draft-a-1', 'Draft A')],
      ['draft-b-1', revision('draft-b-1', 'root', 'Draft B')],
    ])
    const branchA = {
      ...branch,
      baseRevisionId: 'root',
      headRevisionId: 'draft-a-2',
      id: 'branch-a',
    }
    const branchB = {
      ...branch,
      baseRevisionId: 'root',
      headRevisionId: 'draft-b-1',
      id: 'branch-b',
    }
    repository.findDocumentByRef.mockResolvedValue(treeDocument)
    repository.findBranchesByDocument.mockResolvedValue([branchA, branchB])
    repository.findRevisionsByDocument.mockResolvedValue([
      ...revisions.values(),
    ])
    repository.findPublicationEventsByDocument.mockResolvedValue([
      {
        createdAt: at,
        documentId: document.id,
        id: 'publication-1',
        previousRevisionId: 'online-1',
        revisionId: 'online-2',
      },
    ])
    repository.findRevisionById.mockImplementation(async (id: string) =>
      revisions.get(id),
    )
    repository.findDocumentById.mockResolvedValue(treeDocument)
    repository.findAncestryIds.mockImplementation(async (id: string) => {
      const result: string[] = []
      let current = revisions.get(id)
      while (current) {
        result.push(current.id)
        current = current.parentRevisionId
          ? revisions.get(current.parentRevisionId)
          : undefined
      }
      return result
    })

    const context = await service.getContext(DraftRefType.Post, 'post-1')

    expect(context.versionTree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branchBaseIds: ['branch-a', 'branch-b'],
          parentNodeId: null,
          revision: expect.objectContaining({ id: 'root' }),
        }),
        expect.objectContaining({
          branchHeadIds: ['branch-a'],
          collapsedRevisionCount: 1,
          parentNodeId: 'root',
          revision: expect.objectContaining({ id: 'draft-a-2' }),
        }),
        expect.objectContaining({
          publishedAt: at,
          revision: expect.objectContaining({ id: 'online-2' }),
        }),
      ]),
    )
  })

  it('discards the working copy on delete', async () => {
    const { crdt, service } = harness()

    await service.delete(branch.id, owner)

    expect(crdt.discard).toHaveBeenCalledWith(branch.id)
  })
})

describe('DraftService ownership', () => {
  const save = { data: snapshot('Edit'), expectedHeadRevisionId: 'branch-head' }

  it('lets a post author edit a branch of their post', async () => {
    const { repository, service } = harness()
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue(document)
    repository.isPostAuthor.mockResolvedValue(true)
    repository.saveBranch.mockResolvedValue({ kind: 'missing' })

    const error = await service
      .update(branch.id, save as never, author)
      .catch((reason) => reason)

    expect(repository.isPostAuthor).toHaveBeenCalledWith('post-1', 'writer')
    expect(error.code).toBe(AppErrorCode.DRAFT_NOT_FOUND)
  })

  it('refuses an author editing someone else’s post', async () => {
    const { repository, service } = harness()
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue(document)
    repository.isPostAuthor.mockResolvedValue(false)

    const error = await service
      .update(branch.id, save as never, author)
      .catch((reason) => reason)

    expect(error.code).toBe(AppErrorCode.PERMISSION_DENIED)
    expect(repository.saveBranch).not.toHaveBeenCalled()
  })

  it('keeps a post editable by the member who started it after someone else publishes it', async () => {
    const { repository, service } = harness()
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue({
      ...document,
      createdBy: 'writer',
    })
    repository.isPostAuthor.mockResolvedValue(false)
    repository.saveBranch.mockResolvedValue({ kind: 'missing' })

    const error = await service
      .update(branch.id, save as never, author)
      .catch((reason) => reason)

    expect(error.code).toBe(AppErrorCode.DRAFT_NOT_FOUND)
  })

  it('lets the creator of an unpublished post keep editing it, and nobody else', async () => {
    const { crdt, repository, service } = harness()
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue({
      ...document,
      createdBy: 'writer',
      publishedRevisionId: null,
      refId: null,
    })

    await expect(
      service.delete(branch.id, { ...author, id: 'someone-else' }),
    ).rejects.toMatchObject({ code: AppErrorCode.PERMISSION_DENIED })
    await service.delete(branch.id, author)
    expect(crdt.discard).toHaveBeenCalledWith(branch.id)
    expect(repository.isPostAuthor).not.toHaveBeenCalled()
  })

  it('records who started a new post', async () => {
    const { repository, service } = harness()
    repository.createDocumentWithRoot.mockResolvedValue({
      document: { ...document, refId: null, createdBy: 'writer' },
      revision: revision('root', null, 'New'),
    })
    repository.createBranch.mockResolvedValue({
      branch,
      headRevision: revision('branch-head', 'root', 'New'),
    })
    repository.findRevisionById.mockResolvedValue(revision('root', null, 'New'))
    repository.findAncestryIds.mockResolvedValue(['root'])

    await service
      .create(
        { data: snapshot('New'), refType: DraftRefType.Post } as never,
        author,
      )
      .catch(() => {})

    expect(repository.createDocumentWithRoot).toHaveBeenCalledWith(
      DraftRefType.Post,
      null,
      snapshot('New'),
      false,
      'writer',
    )
  })

  it('skips the lookup for members who may edit others’ posts', async () => {
    const { repository, service } = harness()
    repository.archiveBranch.mockResolvedValue(branch)
    await service.delete(branch.id, owner)
    expect(repository.findBranchById).not.toHaveBeenCalled()
    expect(repository.isPostAuthor).not.toHaveBeenCalled()
  })
})

describe('DraftService realtime notification', () => {
  it('announces the new head to admin clients after a save', async () => {
    const { repository, service } = harness()
    const head = revision('branch-head-2', 'branch-head', 'Saved')
    repository.findBranchById.mockResolvedValue(branch)
    repository.findDocumentById.mockResolvedValue({
      ...document,
      publishedRevisionId: null,
    })
    repository.findRevisionById.mockImplementation(async (id: string) =>
      id === head.id ? head : revision('branch-base', null, 'Base'),
    )
    repository.saveBranch.mockResolvedValue({
      branch: { ...branch, headRevisionId: head.id },
      headRevision: head,
      kind: 'ok',
    })

    await service.update(
      branch.id,
      {
        data: snapshot('Saved'),
        expectedHeadRevisionId: 'branch-head',
      } as never,
      owner,
    )

    const { emit } = (service as unknown as { eventManager: { emit: unknown } })
      .eventManager as { emit: ReturnType<typeof vi.fn> }

    // Other admin clients learn the branch moved without polling. The payload
    // carries identity plus the new head only; consumers re-read the draft.
    expect(emit).toHaveBeenCalledWith(
      BusinessEvents.DRAFT_UPDATE,
      {
        branchId: branch.id,
        documentId: document.id,
        headRevisionId: head.id,
        refId: document.refId,
        refType: document.refType,
      },
      { scope: EventScope.TO_ADMIN },
    )
  })
})
