import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { AppErrorCode } from '~/common/errors'
import { transformResponseCase } from '~/common/response/case-transform'
import { categories, postAuthors, posts, users } from '~/database/schema'
import { UserRepository } from '~/modules/user/user.repository'
import { UserService } from '~/modules/user/user.service'
import { SnowflakeService } from '~/shared/id/snowflake.service'

describe('public authors (PostgreSQL)', () => {
  let context: PgTestDatabase
  let service: UserService

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_authors')
    service = new UserService(
      new UserRepository(context.db),
      new SnowflakeService(),
      { invalidate: async () => {} } as any,
    )
    await context.db.insert(users).values([
      {
        id: '101',
        name: 'Ada Published',
        username: 'ada',
        email: 'ada@example.test',
        bio: 'Writes a lot',
        url: 'https://ada.example.test',
        image: 'https://cdn.example.test/ada.png',
      },
      { id: '102', name: 'Bob Drafts', username: 'bob' },
      { id: '103', name: 'Cleo Guest', isProfileOnly: true },
      {
        id: '104',
        name: 'Dan Gone',
        username: 'dan',
        deactivatedAt: new Date(),
      },
      {
        id: '105',
        name: 'Eve Former',
        isProfileOnly: true,
        deactivatedAt: new Date(),
      },
      { id: '106', name: 'Fay Idle', username: 'fay' },
    ])
    await context.db
      .insert(categories)
      .values({ id: '201', name: 'Blog', slug: 'blog' })
    await context.db.insert(posts).values([
      {
        id: '301',
        title: 'Live',
        slug: 'live',
        contentFormat: 'lexical',
        categoryId: '201',
        isPublished: true,
      },
      {
        id: '302',
        title: 'Draft',
        slug: 'draft',
        contentFormat: 'lexical',
        categoryId: '201',
        isPublished: false,
      },
    ])
    await context.db.insert(postAuthors).values([
      { postId: '301', userId: '101', position: 0 },
      { postId: '301', userId: '104', position: 1 },
      { postId: '302', userId: '102', position: 0 },
    ])
  }, 120_000)

  afterAll(async () => {
    await context?.close()
  })

  it('lists active profile-only authors and users with a published post', async () => {
    const result = await service.listAuthors({ page: 1, size: 20 })

    expect(result.data.map((author) => author.id)).toEqual(['101', '103'])
    expect(result.pagination).toMatchObject({ total: 2, currentPage: 1 })
  })

  it('exposes public fields only, snake_case on the wire', async () => {
    const result = await service.listAuthors({ page: 1, size: 20 })

    expect(transformResponseCase(result.data[0])).toEqual({
      id: '101',
      display_name: 'Ada Published',
      avatar: 'https://cdn.example.test/ada.png',
      bio: 'Writes a lot',
      url: 'https://ada.example.test',
      username: 'ada',
    })
  })

  it('paginates', async () => {
    const result = await service.listAuthors({ page: 2, size: 1 })

    expect(result.data.map((author) => author.id)).toEqual(['103'])
    expect(result.pagination).toMatchObject({
      total: 2,
      currentPage: 2,
      totalPage: 2,
    })
  })

  it('finds an author by id or by username, case-insensitively', async () => {
    await expect(service.getAuthor('103')).resolves.toMatchObject({
      id: '103',
      displayName: 'Cleo Guest',
    })
    await expect(service.getAuthor('ADA')).resolves.toMatchObject({
      id: '101',
    })
  })

  it.each([
    ['without a published post', 'bob'],
    ['deactivated with a published post', '104'],
    ['deactivated and profile-only', '105'],
    ['unknown', 'nobody'],
  ])('hides an author %s', async (_label, identity) => {
    await expect(service.getAuthor(identity)).rejects.toMatchObject({
      code: AppErrorCode.USER_NOT_FOUND,
    })
  })
})
