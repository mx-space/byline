import type { Pool } from 'pg'
import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { SlugTrackerRepository } from '~/modules/slug-tracker/slug-tracker.repository'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('SlugTrackerRepository.findLatestByTrailingSlug', () => {
  let context: PgTestDatabase
  let pool: Pool
  let repository: SlugTrackerRepository

  beforeAll(async () => {
    context = await createPgTestDatabase('mx_slug_tracker_trailing')
    pool = context.pool
    repository = new SlugTrackerRepository(
      context.db as any,
      new SnowflakeService(),
    )
  }, 60_000)

  beforeEach(async () => {
    await pool.query('truncate table slug_trackers')
  })

  afterAll(async () => {
    if (context) await context.close()
  })

  test('matches the last path segment exactly and prefers the newest tracker', async () => {
    await repository.createTracker('/tech/hello', 'post', '7000000000000000001')
    await repository.createTracker('/news/hello', 'post', '7000000000000000002')
    await repository.createTracker(
      '/tech/say-hello',
      'post',
      '7000000000000000003',
    )

    const tracker = await repository.findLatestByTrailingSlug('hello', 'post')
    expect(tracker?.targetId).toBe('7000000000000000002')
    expect(await repository.findLatestByTrailingSlug('ello', 'post')).toBeNull()
  })

  test('treats LIKE wildcards literally and filters by type', async () => {
    await repository.createTracker('/tech/a_c', 'post', '7000000000000000004')

    expect(await repository.findLatestByTrailingSlug('abc', 'post')).toBeNull()
    expect(
      (await repository.findLatestByTrailingSlug('a_c', 'post'))?.targetId,
    ).toBe('7000000000000000004')
    expect(await repository.findLatestByTrailingSlug('a_c', 'page')).toBeNull()
  })
})
