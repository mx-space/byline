import {
  createPgTestDatabase,
  type PgTestDatabase,
} from 'test/helper/pg-verify-url'

import { categories, users } from '~/database/schema'
import { PostRepository } from '~/modules/post/post.repository'
import { SnowflakeService } from '~/shared/id/snowflake.service'
import { ContentFormat } from '~/shared/types/content-format.type'

describe('post authors (PostgreSQL)', () => {
  let context: PgTestDatabase
  let repository: PostRepository

  beforeAll(async () => {
    context = await createPgTestDatabase('byline_post_authors')
    repository = new PostRepository(context.db as any, new SnowflakeService())
    await context.db.insert(users).values([
      {
        id: '1001',
        name: 'Ada',
        username: 'ada',
        image: 'https://cdn.example.com/ada.png',
        bio: 'Writes the engine notes',
        url: 'https://ada.example.com',
        email: 'ada@example.com',
      },
      { id: '1002', name: 'Grace', username: 'grace' },
      { id: '1003', name: null, username: 'guest', isProfileOnly: true },
    ])
    await context.db
      .insert(categories)
      .values({ id: '2001', name: 'Notes', slug: 'notes' })
  }, 120_000)

  afterAll(async () => {
    await context?.close()
  })

  const createPost = (slug: string, authorIds: string[]) =>
    repository.create({
      title: slug,
      slug,
      text: '',
      content: '{"root":{"children":[]}}',
      contentFormat: ContentFormat.Lexical,
      categoryId: '2001',
      authorIds,
    })

  it('expands authors into public profiles in byline order', async () => {
    const created = await createPost('duo', ['1002', '1001', '1003'])

    expect(created.authors).toEqual([
      {
        id: '1002',
        displayName: 'Grace',
        avatar: null,
        bio: null,
        url: null,
      },
      {
        id: '1001',
        displayName: 'Ada',
        avatar: 'https://cdn.example.com/ada.png',
        bio: 'Writes the engine notes',
        url: 'https://ada.example.com',
      },
      {
        id: '1003',
        displayName: 'guest',
        avatar: null,
        bio: null,
        url: null,
      },
    ])
    expect(created.authors![1]).not.toHaveProperty('email')

    const reloaded = await repository.findById(created.id)
    expect(reloaded?.authors?.map((author) => author.id)).toEqual([
      '1002',
      '1001',
      '1003',
    ])
  })

  it('replaces the byline on update and keeps it when authors are omitted', async () => {
    const created = await createPost('reorder', ['1001', '1002'])

    const reordered = await repository.update(created.id, {
      authorIds: ['1002', '1001'],
    })
    expect(reordered?.authors?.map((author) => author.id)).toEqual([
      '1002',
      '1001',
    ])

    const untouched = await repository.update(created.id, { title: 'renamed' })
    expect(untouched?.authors?.map((author) => author.id)).toEqual([
      '1002',
      '1001',
    ])
  })

  it('filters the post list by author', async () => {
    const solo = await createPost('solo', ['1003'])

    const result = await repository.list({ authorId: '1003', size: 50 })

    expect(result.data.map((post) => post.id)).toContain(solo.id)
    expect(
      result.data.every((post) =>
        post.authors?.some((author) => author.id === '1003'),
      ),
    ).toBe(true)
  })
})
