import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { createIsolatedPgDatabase } from 'test/helper/pg-testcontainer'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AiSummaryRepository } from '~/modules/ai/ai-summary/ai-summary.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('AiSummaryRepository locked rows (real PG)', () => {
  let pool: Pool
  let database: Awaited<ReturnType<typeof createIsolatedPgDatabase>>
  let repo: AiSummaryRepository

  beforeAll(async () => {
    database = await createIsolatedPgDatabase()
    pool = new Pool({ connectionString: database.getConnectionUri() })
    const db = drizzle(pool) as unknown as AppDatabase
    repo = new AiSummaryRepository(db, new SnowflakeService())
  }, 120_000)

  afterAll(async () => {
    await pool?.end()
    await database?.drop()
  })

  it('persists isLocked on insert', async () => {
    const row = await repo.upsert({
      refId: '510000000000000001',
      lang: 'ja',
      hash: 'h1',
      summary: 'human',
      isLocked: true,
    })
    expect(row.isLocked).toBe(true)
    expect(await repo.listLockedLangs('510000000000000001')).toEqual(['ja'])
  })

  it('keeps a locked row when an upsert does not ask to overwrite it', async () => {
    const refId = '510000000000000002'
    await repo.upsert({
      refId,
      lang: 'en',
      hash: 'h1',
      summary: 'human',
      isLocked: true,
    })

    const result = await repo.upsert({
      refId,
      lang: 'en',
      hash: 'h2',
      summary: 'ai',
    })

    expect(result.summary).toBe('human')
    expect(result.hash).toBe('h1')
    expect(result.isLocked).toBe(true)
  })

  it('overwrites and unlocks a locked row when overwriteLocked is set', async () => {
    const refId = '510000000000000003'
    await repo.upsert({
      refId,
      lang: 'en',
      hash: 'h1',
      summary: 'human',
      isLocked: true,
    })

    const result = await repo.upsert({
      refId,
      lang: 'en',
      hash: 'h2',
      summary: 'ai',
      overwriteLocked: true,
    })

    expect(result.summary).toBe('ai')
    expect(result.isLocked).toBe(false)
    expect(await repo.listLockedLangs(refId)).toEqual([])
  })

  it('lets a locked write replace an unlocked row', async () => {
    const refId = '510000000000000004'
    await repo.upsert({ refId, lang: 'de', hash: 'h1', summary: 'ai' })

    const result = await repo.upsert({
      refId,
      lang: 'de',
      hash: 'h1',
      summary: 'human',
      isLocked: true,
    })

    expect(result.summary).toBe('human')
    expect(result.isLocked).toBe(true)
  })
})
