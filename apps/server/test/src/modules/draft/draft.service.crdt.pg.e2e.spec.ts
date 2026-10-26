import { drizzle } from 'drizzle-orm/node-postgres'
import { LoroDoc } from 'loro-crdt'
import { Pool } from 'pg'
import { createIsolatedPgDatabase } from 'test/helper/pg-testcontainer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { AppErrorCode } from '~/common/errors'
import { BusinessEvents } from '~/constants/business-event.constant'
import {
  ALL_PERMISSIONS,
  PERMISSION_PRESETS,
} from '~/constants/permission.constant'
import { SnowflakeGenerator } from '~/database/id'
import * as schema from '~/database/schema'
import { DraftRefType } from '~/modules/draft/draft.enum'
import { DraftRepository } from '~/modules/draft/draft.repository'
import { DraftService } from '~/modules/draft/draft.service'
import type { RevisionSnapshot } from '~/modules/draft/draft.types'
import { editDocAt, readDocContent } from '~/modules/draft/draft-crdt.doc'
import { DraftCrdtRepository } from '~/modules/draft/draft-crdt.repository'
import { DraftCrdtService } from '~/modules/draft/draft-crdt.service'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import type { SnowflakeService } from '~/shared/id/snowflake.service'

const body = (...values: string[]) =>
  JSON.stringify({
    root: {
      children: values.map((value, index) => ({
        $: { blockId: `blk${index}` },
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: value,
            type: 'text',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        type: 'paragraph',
        version: 1,
      })),
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })

const texts = (content: string | null) =>
  (
    JSON.parse(content!) as {
      root: { children: { children: { text: string }[] }[] }
    }
  ).root.children.map((child) => child.children.map((t) => t.text).join(''))

const blockIds = (content: string) =>
  (
    JSON.parse(content) as {
      root: { children: { $?: { blockId?: string } }[] }
    }
  ).root.children.map((child) => child.$?.blockId)

const withoutIds = (snapshot: RevisionSnapshot): RevisionSnapshot => ({
  ...snapshot,
  content: snapshot.content!.replaceAll(/"\$":\{"blockId":"\w+"\},/g, ''),
})

const lexical = (title: string, values: string[]): RevisionSnapshot => ({
  content: body(...values),
  contentFormat: 'lexical',
  images: null,
  meta: null,
  text: values.join('\n\n'),
  title,
  typeSpecificData: { slug: 's' },
})

const owner = { id: 'owner', permissions: ALL_PERMISSIONS }
const outsider = { id: 'outsider', permissions: PERMISSION_PRESETS.author }
const translator = {
  id: 'translator',
  permissions: PERMISSION_PRESETS.translator,
}

describe('DraftService on the Loro working copy (real PG)', () => {
  let pool: Pool
  let database: Awaited<ReturnType<typeof createIsolatedPgDatabase>>
  let drafts: DraftRepository
  let crdtRepository: DraftCrdtRepository
  let service: DraftService
  let refCounter = 7_100_000_000_000_000_000n
  const emit = vi.fn()
  const fileReferences = {
    removeReferencesForDocument: vi.fn(),
    updateReferencesForDocument: vi.fn(),
  }

  const seed = async (published: RevisionSnapshot) => {
    const refId = String(refCounter++)
    const { document, revision } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      refId,
      published,
      true,
    )
    const { branch } = await drafts.createBranch(
      document.id,
      revision.id,
      published,
      true,
    )
    return { branch, document, published: revision, refId }
  }

  const type = async (branchId: string, values: string[]) => {
    const tab = new LoroDoc()
    tab.import(await service.exportCrdt(branchId, owner))
    const from = tab.oplogVersion()
    tab.import(
      editDocAt(
        tab,
        tab.frontiers(),
        { content: body(...values), title: 'Pub' },
        'human:owner',
      ),
    )
    await service.importCrdt(
      branchId,
      tab.export({ from, mode: 'update' }),
      owner,
    )
  }

  const inbox = async () =>
    (await service.list(1, 50, {})).data.map((draft) => ({
      id: draft.id,
      relation: draft.relation,
    }))

  beforeAll(async () => {
    database = await createIsolatedPgDatabase()
    pool = new Pool({ connectionString: database.getConnectionUri(), max: 6 })
    const db = drizzle(pool, { schema }) as unknown as AppDatabase
    const snowflake = new SnowflakeGenerator({
      workerId: 46,
    }) as SnowflakeService
    await db.insert(schema.users).values([
      { id: owner.id, name: 'Owner', username: 'owner' },
      { id: outsider.id, name: 'Outsider', username: 'outsider' },
      { id: translator.id, name: 'Translator', username: 'translator' },
    ])
    drafts = new DraftRepository(db, snowflake)
    crdtRepository = new DraftCrdtRepository(db, snowflake)
    const crdt = new DraftCrdtService(
      drafts,
      crdtRepository,
      fileReferences as never,
    )
    service = new DraftService(
      drafts,
      fileReferences as never,
      {} as never,
      { emit } as never,
      crdt,
    )
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await database?.drop()
  })

  it('writes a stale CLI update into the working copy without a conflict', async () => {
    const { branch, published } = await seed(lexical('Pub', ['a', 'b']))
    await service.update(
      branch.id,
      {
        data: lexical('Pub', ['a', 'b owner']),
        expectedHeadRevisionId: published.id,
      } as never,
      owner,
    )

    const view = await service.update(
      branch.id,
      {
        data: lexical('Pub', ['a cli', 'b']),
        expectedHeadRevisionId: published.id,
      } as never,
      owner,
    )

    expect(texts(view.headRevision.content)).toEqual(['a cli', 'b'])
    const stored = await drafts.findBranchById(view.id)
    const head = await drafts.findRevisionById(stored!.headRevisionId)
    expect(texts(head!.content)).toEqual(['a cli', 'b owner'])
    expect(emit).toHaveBeenCalledWith(
      BusinessEvents.DRAFT_UPDATE,
      expect.objectContaining({ headRevisionId: stored!.headRevisionId }),
      expect.anything(),
    )
  })

  it('writes a CLI save of a published article into its one working copy', async () => {
    const { branch, published, refId } = await seed(lexical('Pub', ['a']))

    const view = await service.create(
      {
        baseRevisionId: published.id,
        data: lexical('Pub', ['a', 'cli']),
        refId,
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    expect(view.id).toBe(branch.id)
    expect(texts(view.headRevision.content)).toEqual(['a', 'cli'])
    expect(await drafts.findBranchesByDocument(branch.documentId)).toHaveLength(
      1,
    )
  })

  it('writes a CLI save of a published article that was never opened into a new working copy', async () => {
    const refId = String(refCounter++)
    const { document } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      refId,
      lexical('Pub', ['a']),
      true,
    )

    const first = await service.create(
      {
        data: lexical('Pub', ['a', 'one']),
        refId,
        refType: DraftRefType.Post,
      } as never,
      owner,
    )
    const second = await service.create(
      {
        data: lexical('Pub', ['a', 'two']),
        refId,
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    expect(second.id).toBe(first.id)
    expect(await drafts.findBranchesByDocument(document.id)).toHaveLength(1)
  })

  it('syncs binary updates and broadcasts the working copy', async () => {
    const { branch } = await seed(lexical('Pub', ['a']))
    emit.mockClear()

    await type(branch.id, ['a', 'typed'])
    const { headRevision } = await service.createCheckpoint(
      branch.id,
      'save',
      owner,
    )

    expect(texts(headRevision.content)).toEqual(['a', 'typed'])
    expect(emit).toHaveBeenCalledWith(
      BusinessEvents.DRAFT_UPDATE,
      expect.objectContaining({ branchId: branch.id }),
      expect.anything(),
    )
  })

  it('refuses the Loro endpoints to members who cannot edit the article', async () => {
    const { branch } = await seed(lexical('Pub', ['a']))

    await expect(service.exportCrdt(branch.id, outsider)).rejects.toMatchObject(
      { code: AppErrorCode.PERMISSION_DENIED },
    )
    await expect(
      service.importCrdt(branch.id, new Uint8Array(), outsider),
    ).rejects.toMatchObject({ code: AppErrorCode.PERMISSION_DENIED })
  })

  it('merges live article edits into the working copy fields', async () => {
    const { branch, refId } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)

    await service.mergeArticleFields(DraftRefType.Post, refId, {
      categoryId: 'cat-2',
      pin: true,
    })
    const view = await service.createCheckpoint(branch.id, 'save', owner)

    expect(view.headRevision.typeSpecificData).toEqual({
      categoryId: 'cat-2',
      pin: true,
      slug: 's',
    })
  })

  it('lists the drafts archived by the collapse and restores one of them', async () => {
    const { branch, document, published } = await seed(lexical('Pub', ['a']))
    const older = await drafts.createBranch(
      document.id,
      published.id,
      lexical('Pub', ['a', 'older work']),
      false,
    )
    await drafts.createBranch(
      document.id,
      published.id,
      lexical('Pub', ['a', 'newer work']),
      false,
    )
    await drafts.archiveBranch(branch.id)

    const workingCopy = await service.openWorkingCopy(
      DraftRefType.Post,
      String(document.refId),
      owner,
    )
    const archived = await service.archivedDrafts(workingCopy.id, owner)

    expect(archived.map((draft) => draft.id)).toContain(older.branch.id)
    const restored = await service.restore(
      workingCopy.id,
      older.headRevision.id,
      owner,
    )
    expect(texts(restored.headRevision.content)).toEqual(['a', 'older work'])
  })

  it('gives every block of an imported article an id when it opens', async () => {
    const { branch } = await seed(withoutIds(lexical('Pub', ['a', 'b', 'c'])))

    const doc = new LoroDoc()
    doc.import(await service.exportCrdt(branch.id, owner))
    const ids = blockIds(readDocContent(doc).content)

    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(3)
    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
  })

  it('keeps the ids of untouched blocks when a CLI save without ids lands', async () => {
    const { branch, published, refId } = await seed(
      withoutIds(lexical('Pub', ['a', 'b'])),
    )
    const before = new LoroDoc()
    before.import(await service.exportCrdt(branch.id, owner))
    const [first] = blockIds(readDocContent(before).content)

    const view = await service.create(
      {
        baseRevisionId: published.id,
        data: withoutIds(lexical('Pub', ['a', 'b', 'cli'])),
        refId,
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    const ids = blockIds(view.headRevision.content!)
    expect(ids[0]).toBe(first)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(3)
  })

  it('keeps an article that was only opened out of the inbox', async () => {
    const { branch } = await seed(lexical('Pub', ['a']))

    await service.findForEditing(branch.id, owner)
    await service.createCheckpoint(branch.id, 'save', owner)

    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
  })

  it('lists an edited article as ahead until it is published', async () => {
    const { branch, document, published } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)

    await type(branch.id, ['a', 'typed'])

    expect(await inbox()).toContainEqual({ id: branch.id, relation: 'ahead' })

    const { headRevision } = await service.createCheckpoint(
      branch.id,
      'publish',
      owner,
    )
    await drafts.recordPublication(document.id, headRevision.id, published.id)

    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
  })

  it('lists a never-published article as fresh', async () => {
    const view = await service.create(
      {
        data: lexical('New', ['n']),
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    expect(await inbox()).toContainEqual({ id: view.id, relation: 'fresh' })
  })

  it('refuses a CLI write-then-publish when others left unpublished changes', async () => {
    const { branch, published, refId } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)
    await type(branch.id, ['a', 'editor'])

    await expect(
      service.create(
        {
          baseRevisionId: published.id,
          data: lexical('Pub', ['a', 'cli']),
          ifInSync: true,
          refId,
          refType: DraftRefType.Post,
        } as never,
        owner,
      ),
    ).rejects.toMatchObject({ code: AppErrorCode.DRAFT_WORKING_COPY_AHEAD })
  })

  it('lets a CLI write-then-publish through while the article is in sync', async () => {
    const { branch, published, refId } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)

    const view = await service.create(
      {
        baseRevisionId: published.id,
        data: lexical('Pub', ['a', 'cli']),
        ifInSync: true,
        refId,
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    expect(texts(view.headRevision.content)).toEqual(['a', 'cli'])
  })

  it('discards unpublished changes and brings the article back in sync', async () => {
    const { branch, document } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)
    await type(branch.id, ['a', 'typed'])

    await service.delete(branch.id, owner)

    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
    expect(await crdtRepository.findDoc(document.id)).toBeNull()
    const [next] = await service
      .getContext(DraftRefType.Post, String(document.refId))
      .then((context) => context.branches)
    const reopened = next
      ? await service.findForEditing(next.id, owner)
      : await service.openWorkingCopy(
          DraftRefType.Post,
          String(document.refId),
          owner,
        )
    expect(texts(reopened!.headRevision.content)).toEqual(['a'])
  })

  it('deletes a never-published article with its draft', async () => {
    const view = await service.create(
      {
        data: lexical('New', ['n']),
        refType: DraftRefType.Post,
      } as never,
      owner,
    )

    await service.delete(view.id, owner)

    expect(await drafts.findDocumentById(view.documentId)).toBeNull()
  })

  it('opens a published article that has no draft at its one working copy', async () => {
    const refId = String(refCounter++)
    const { document } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      refId,
      lexical('Pub', ['a']),
      true,
    )

    const first = await service.openWorkingCopy(DraftRefType.Post, refId, owner)
    const second = await service.openWorkingCopy(
      DraftRefType.Post,
      refId,
      owner,
    )

    expect(second.id).toBe(first.id)
    expect(await drafts.findBranchesByDocument(document.id)).toHaveLength(1)
    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: first.id }),
    )
  })

  it('lists a legacy draft with edits on top of published as ahead', async () => {
    const { document, published } = await seed(lexical('Pub', ['a']))
    const { branch } = await drafts.createBranch(
      document.id,
      published.id,
      lexical('Pub', ['a', 'legacy edit']),
      false,
    )

    expect(await inbox()).toContainEqual({ id: branch.id, relation: 'ahead' })
  })

  it('refuses Loro writes from a member without the edit-post permission', async () => {
    const { document, revision } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      null,
      lexical('Mine', ['t']),
      false,
      translator.id,
    )
    const { branch } = await drafts.createBranch(
      document.id,
      revision.id,
      lexical('Mine', ['t']),
      true,
    )

    expect(await service.canEdit(branch.id, translator)).toBe(false)
  })

  it('keeps an opened article in sync when a field patch changes nothing', async () => {
    const { branch } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)

    await service.updateFields(
      branch.id,
      { typeSpecificData: { slug: 's' } },
      owner,
    )

    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
  })

  it('keeps an article in sync when its post fields change from the post list', async () => {
    const { branch, refId } = await seed(lexical('Pub', ['a']))
    await service.findForEditing(branch.id, owner)

    await service.mergeArticleFields(DraftRefType.Post, refId, { pin: true })

    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branch.id }),
    )
  })

  it('opens a never-opened article from two tabs at once into one working copy', async () => {
    const refId = String(refCounter++)
    const { document } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      refId,
      lexical('Pub', ['a']),
      true,
    )

    await Promise.all([
      service.openWorkingCopy(DraftRefType.Post, refId, owner),
      service.openWorkingCopy(DraftRefType.Post, refId, owner),
      service.openWorkingCopy(DraftRefType.Post, refId, owner),
    ])

    const branches = await drafts.findBranchesByDocument(document.id)
    expect(branches).toHaveLength(1)
    expect(await inbox()).not.toContainEqual(
      expect.objectContaining({ id: branches[0]!.id }),
    )
  })
})
