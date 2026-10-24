import type { Pool } from 'pg'
import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { BusinessEvents } from '~/constants/business-event.constant'
import { posts } from '~/database/schema'
import { CategoryRepository } from '~/modules/category/category.repository'
import { PostRepository } from '~/modules/post/post.repository'
import { PostPublicationScheduler } from '~/modules/post/post-publication.scheduler'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('PostRepository public visibility filters', () => {
  let context: PgTestDatabase
  let pool: Pool
  let db: PgTestDatabase['db']
  let categoryRepository: CategoryRepository
  let postRepository: PostRepository
  let snowflake: SnowflakeService

  const claimDuePublications = async () => {
    const claimed: Array<{ id: string }> = []
    await postRepository.dispatchDuePublications(async (due) => {
      claimed.push(...due)
    })
    return claimed
  }

  beforeAll(async () => {
    context = await createPgTestDatabase('mx_post_public_visibility')
    pool = context.pool
    db = context.db
    snowflake = new SnowflakeService()
    categoryRepository = new CategoryRepository(db as any, snowflake)
    postRepository = new PostRepository(db as any, snowflake)
  }, 60_000)

  beforeEach(async () => {
    await pool.query('truncate table posts cascade')
    await pool.query('truncate table categories cascade')
  })

  afterAll(async () => {
    if (context) await context.close()
  })

  test('count and tag queries can exclude unpublished posts at the database boundary', async () => {
    const category = await categoryRepository.create({
      name: 'tech',
      slug: 'tech',
    })
    await db.insert(posts).values([
      {
        id: snowflake.nextId(),
        title: 'public',
        slug: 'public',
        contentFormat: 'markdown',
        categoryId: category.id,
        isPublished: true,
        tags: ['shared', 'public-only'],
      },
      {
        id: snowflake.nextId(),
        title: 'private',
        slug: 'private',
        contentFormat: 'markdown',
        categoryId: category.id,
        isPublished: false,
        tags: ['shared', 'private-only'],
      },
    ])

    expect(
      await postRepository.countByCategoryId(category.id, {
        publishedOnly: true,
      }),
    ).toBe(1)

    const allTags = await postRepository.aggregateAllTagCounts({
      publishedOnly: true,
    })
    const categoryTags = await postRepository.aggregateTagCountsByCategory(
      category.id,
      { publishedOnly: true },
    )
    for (const tags of [allTags, categoryTags]) {
      expect(tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'shared', count: 1 }),
          expect.objectContaining({ name: 'public-only', count: 1 }),
        ]),
      )
      expect(tags).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'private-only' }),
        ]),
      )
    }

    const sharedPosts = await postRepository.findByTag('shared', {
      includeCategory: false,
      metaOnly: true,
      publishedOnly: true,
    })
    expect(sharedPosts).toHaveLength(1)
    expect(sharedPosts[0].slug).toBe('public')
  })

  test('slug lookups can exclude unpublished posts', async () => {
    const category = await categoryRepository.create({
      name: 'tech',
      slug: 'tech',
    })
    await db.insert(posts).values({
      id: snowflake.nextId(),
      title: 'private',
      slug: 'private',
      contentFormat: 'lexical',
      categoryId: category.id,
      isPublished: false,
    })

    expect((await postRepository.findBySlug('private'))?.slug).toBe('private')
    expect(
      await postRepository.findBySlug('private', { publishedOnly: true }),
    ).toBeNull()
  })

  test('withholds scheduled posts across public queries and exposes them when due', async () => {
    const category = await categoryRepository.create({
      name: 'Scheduled',
      slug: 'scheduled',
    })
    const scheduled = await postRepository.create({
      title: 'Later',
      slug: 'later',
      contentFormat: 'lexical',
      categoryId: category.id,
      tags: ['later'],
      authorIds: [],
      publicAt: new Date('2999-01-01T00:00:00Z'),
    })
    expect(scheduled.publicAt).toEqual(new Date('2999-01-01T00:00:00Z'))
    expect((await postRepository.list()).data).toHaveLength(1)
    expect(
      (await postRepository.list({ publishedOnly: true })).pagination.total,
    ).toBe(0)
    expect(
      await postRepository.findBySlug('later', { publishedOnly: true }),
    ).toBeNull()
    expect(
      await postRepository.findByCategoryAndSlug(category.id, 'later', {
        publishedOnly: true,
      }),
    ).toBeNull()
    expect(
      await postRepository.findRecent(10, { publishedOnly: true }),
    ).toEqual([])
    expect(
      await postRepository.findByTag('later', { publishedOnly: true }),
    ).toEqual([])
    expect(
      await postRepository.listByCategory(category.id, { publishedOnly: true }),
    ).toEqual([])
    expect(await postRepository.findPublishedForSitemap()).toEqual([])
    expect(
      await postRepository.countByCategoryId(category.id, {
        publishedOnly: true,
      }),
    ).toBe(0)
    expect(
      await postRepository.aggregateAllTagCounts({ publishedOnly: true }),
    ).toEqual([])
    expect(
      await categoryRepository.findAll(undefined, { publishedOnly: true }),
    ).toMatchObject([{ count: 0 }])
    expect(await claimDuePublications()).toEqual([])

    await postRepository.update(scheduled.id, {
      publicAt: new Date(Date.now() - 1000),
    })
    expect(
      (await postRepository.list({ publishedOnly: true })).data.map(
        (post) => post.id,
      ),
    ).toEqual([scheduled.id])
    expect(
      (await postRepository.findBySlug('later', { publishedOnly: true }))?.id,
    ).toBe(scheduled.id)
    await expect(
      postRepository.dispatchDuePublications(async () => {
        throw new Error('Notification failed')
      }),
    ).rejects.toThrow('Notification failed')
    const claims = await Promise.all([
      claimDuePublications(),
      claimDuePublications(),
    ])
    expect(claims.flat()).toEqual([{ id: scheduled.id }])
    expect(await claimDuePublications()).toEqual([])
  })

  test('can cancel or change a schedule without publishing drafts or notifying twice', async () => {
    const category = await categoryRepository.create({
      name: 'Scheduled',
      slug: 'scheduled',
    })
    const post = await postRepository.create({
      title: 'Later',
      slug: 'later',
      contentFormat: 'lexical',
      categoryId: category.id,
      authorIds: [],
      publicAt: new Date('2999-01-01T00:00:00Z'),
    })
    await postRepository.update(post.id, { publicAt: null })
    expect(
      (await postRepository.list({ publishedOnly: true })).data,
    ).toHaveLength(1)
    expect(await claimDuePublications()).toEqual([])
    const dueTime = new Date(Date.now() - 1000)
    await postRepository.update(post.id, {
      publicAt: dueTime,
      isPublished: false,
    })
    expect(await claimDuePublications()).toEqual([])
    await postRepository.update(post.id, { isPublished: true })
    expect(await claimDuePublications()).toEqual([{ id: post.id }])
    await postRepository.update(post.id, {
      publicAt: dueTime,
      title: 'Same schedule',
    })
    expect(await claimDuePublications()).toEqual([])
    await postRepository.update(post.id, {
      publicAt: new Date(Date.now() - 5000),
    })
    expect(await claimDuePublications()).toEqual([{ id: post.id }])
  })

  test('catches up on startup and announces a post once', async () => {
    const category = await categoryRepository.create({
      name: 'Due',
      slug: 'due',
    })
    const post = await postRepository.create({
      title: 'Due',
      slug: 'due',
      contentFormat: 'lexical',
      categoryId: category.id,
      authorIds: [],
      publicAt: new Date(Date.now() - 1000),
    })
    const effects: string[] = []
    const scheduler = new PostPublicationScheduler(postRepository, {
      emit: async (event: string, data: { id: string }) => {
        effects.push(`${event}:${data.id}`)
      },
    } as any)
    await scheduler.onApplicationBootstrap()
    await scheduler.announceDuePublications()
    expect(effects).toEqual([`${BusinessEvents.POST_REPUBLISH}:${post.id}`])
  })
})
