import { Logger } from '@nestjs/common'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { createIsolatedPgDatabase } from 'test/helper/pg-testcontainer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { migration } from '~/database/app-migrations/20261026-collapse-draft-branches'
import { SnowflakeGenerator } from '~/database/id'
import * as schema from '~/database/schema'
import { DraftRefType } from '~/modules/draft/draft.enum'
import { DraftRepository } from '~/modules/draft/draft.repository'
import type { RevisionSnapshot } from '~/modules/draft/draft.types'
import { collapseBranches } from '~/modules/draft/draft-collapse'
import { DraftCrdtRepository } from '~/modules/draft/draft-crdt.repository'
import { DraftCrdtService } from '~/modules/draft/draft-crdt.service'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import type { SnowflakeService } from '~/shared/id/snowflake.service'

const paragraph = (text: string, blockId?: string, textFormat?: number) => ({
  ...(blockId ? { $: { blockId } } : {}),
  children: [
    {
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
      type: 'text',
      version: 1,
    },
  ],
  direction: null,
  format: '',
  indent: 0,
  ...(textFormat === undefined ? {} : { textFormat }),
  type: 'paragraph',
  version: 1,
})

const body = (children: unknown[]) =>
  JSON.stringify({
    root: {
      children,
      direction: null,
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  })

const snapshot = (
  title: string,
  children: unknown[],
  typeSpecificData: Record<string, unknown> = {
    createdAt: '2025-01-28T00:00:00.000Z',
    slug: 's',
  },
): RevisionSnapshot => ({
  content: body(children),
  contentFormat: 'lexical',
  images: null,
  meta: null,
  text: title,
  title,
  typeSpecificData,
})

const published = () => snapshot('Pub', [paragraph('a'), paragraph('b')])
const noise = () =>
  snapshot('Pub', [paragraph('a', 'x1', 0), paragraph('b', 'x2', 0)], {
    pin: false,
    slug: 's',
  })
const edited = (word: string) =>
  snapshot('Pub', [paragraph('a', 'x1'), paragraph(word, 'x2')], {
    pin: false,
    slug: 's',
  })

describe('collapsing draft branches into one working copy (real PG)', () => {
  let pool: Pool
  let database: Awaited<ReturnType<typeof createIsolatedPgDatabase>>
  let db: AppDatabase
  let drafts: DraftRepository
  let crdt: DraftCrdtService
  let refCounter = 7_200_000_000_000_000_000n

  beforeAll(async () => {
    database = await createIsolatedPgDatabase()
    pool = new Pool({ connectionString: database.getConnectionUri(), max: 4 })
    db = drizzle(pool, { schema }) as unknown as AppDatabase
    const snowflake = new SnowflakeGenerator({
      workerId: 48,
    }) as SnowflakeService
    drafts = new DraftRepository(db, snowflake)
    crdt = new DraftCrdtService(
      drafts,
      new DraftCrdtRepository(db, snowflake),
      {
        removeReferencesForDocument: vi.fn(),
        updateReferencesForDocument: vi.fn(),
      } as never,
    )
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await database?.drop()
  })

  const seed = async () => {
    const { document, revision } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      String(refCounter++),
      published(),
      true,
    )
    return { document, published: revision }
  }

  const branchFrom = (
    documentId: string,
    baseId: string,
    data: RevisionSnapshot,
  ) => drafts.createBranch(documentId, baseId, data, false)

  const active = async (documentId: string) =>
    (await drafts.findBranchesByDocument(documentId)).map((branch) => branch.id)

  it('keeps the newest branch with real changes on top of the published revision', async () => {
    const { document, published: pub } = await seed()
    const older = await branchFrom(document.id, pub.id, edited('older'))
    const newer = await branchFrom(document.id, pub.id, edited('newer'))

    await collapseBranches(drafts, document.id)

    expect(await active(document.id)).toEqual([newer.branch.id])
    const archived = await drafts.findBranchesByDocument(
      document.id,
      'archived',
    )
    expect(archived.map((branch) => branch.id)).toEqual([older.branch.id])
  })

  it('treats block ids, textFormat and pin:false as no change', async () => {
    const { document, published: pub } = await seed()
    const noisy = await branchFrom(document.id, pub.id, noise())

    await collapseBranches(drafts, document.id)

    const [workingCopy] = await drafts.findBranchesByDocument(document.id)
    expect(workingCopy.id).not.toBe(noisy.branch.id)
    expect(workingCopy.headRevisionId).toBe(pub.id)
  })

  it('treats the null fields and empty images the old editor saved as no change', async () => {
    const { document, revision: pub } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      String(refCounter++),
      snapshot('Pub', [paragraph('a')], {
        authors: ['u1'],
        categoryId: 'c',
        createdAt: '2025-01-28T00:00:00.000Z',
        slug: 's',
        summary: '',
      }),
      true,
    )
    const noisy = await branchFrom(document.id, pub.id, {
      ...snapshot('Pub', [paragraph('a', 'x1', 0)], {
        authors: ['u1'],
        categoryId: 'c',
        created: '2025-01-28T00:00:00.000Z',
        image: null,
        pin: false,
        pinOrder: null,
        publicAt: null,
        seo: null,
        slug: 's',
        sourceLang: null,
        summary: null,
      }),
      images: [],
    })

    await collapseBranches(drafts, document.id)

    const [workingCopy] = await drafts.findBranchesByDocument(document.id)
    expect(workingCopy.id).not.toBe(noisy.branch.id)
    expect(workingCopy.headRevisionId).toBe(pub.id)
  })

  it('keeps the branch saved most recently over an older one never saved again', async () => {
    const { document, published: pub } = await seed()
    const older = await branchFrom(document.id, pub.id, edited('older'))
    const saved = await branchFrom(document.id, pub.id, edited('saved'))
    await db
      .update(schema.drafts)
      .set({ updatedAt: sql`now()` })
      .where(eq(schema.drafts.id, BigInt(saved.branch.id)))
    await db
      .update(schema.drafts)
      .set({ createdAt: sql`now() - interval '1 day'` })
      .where(eq(schema.drafts.id, BigInt(older.branch.id)))

    await collapseBranches(drafts, document.id)

    expect(await active(document.id)).toEqual([saved.branch.id])
  })

  it('never keeps a branch the published revision has moved past', async () => {
    const { document, published: first } = await seed()
    const stale = await branchFrom(document.id, first.id, edited('stale'))
    const winner = await branchFrom(document.id, first.id, edited('shipped'))
    await drafts.recordPublication(
      document.id,
      winner.headRevision.id,
      first.id,
    )
    await drafts.archiveBranch(winner.branch.id)

    await collapseBranches(drafts, document.id)

    const [workingCopy] = await drafts.findBranchesByDocument(document.id)
    expect(workingCopy.id).not.toBe(stale.branch.id)
    expect(workingCopy.headRevisionId).toBe(winner.headRevision.id)
  })

  it('keeps the newest branch of an article that was never published', async () => {
    const { document, revision } = await drafts.createDocumentWithRoot(
      DraftRefType.Post,
      null,
      published(),
      false,
    )
    await branchFrom(document.id, revision.id, edited('one'))
    const latest = await branchFrom(document.id, revision.id, edited('two'))

    await collapseBranches(drafts, document.id)

    expect(await active(document.id)).toEqual([latest.branch.id])
  })

  it('opens a multi-branch article on the branch the same rule picks', async () => {
    const { document, published: pub } = await seed()
    const real = await branchFrom(document.id, pub.id, edited('real'))
    await branchFrom(document.id, pub.id, noise())

    const workingCopy = await crdt.workingCopyOfDocument(document.id)

    expect(workingCopy?.id).toBe(real.branch.id)
    expect(await active(document.id)).toEqual([real.branch.id])
  })

  it('collapses every document once and is safe to run again', async () => {
    const { document, published: pub } = await seed()
    await branchFrom(document.id, pub.id, noise())
    await branchFrom(document.id, pub.id, noise())

    const ctx = { db, logger: new Logger('test'), pool }
    await migration.up(ctx as never)
    const afterFirst = await active(document.id)
    await migration.up(ctx as never)

    expect(afterFirst).toHaveLength(1)
    expect(await active(document.id)).toEqual(afterFirst)
  })
})
