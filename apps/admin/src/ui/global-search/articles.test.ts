import { describe, expect, it } from 'vitest'

import {
  collectMatchingPosts,
  postMatchesKeyword,
  postSearchHref,
  postSearchMeta,
  postsListSearchHref,
} from './articles'

describe('post search links', () => {
  it('opens the editor and the full post list', () => {
    expect(postSearchHref('post/1')).toBe('/posts/edit?id=post%2F1')
    expect(postsListSearchHref('hello world')).toBe(
      '/posts?keyword=hello+world',
    )
  })

  it('prefers the summary and marks unpublished posts', () => {
    expect(
      postSearchMeta(
        { category: { name: 'Notes' }, slug: 'hello', summary: 'A summary' },
        'Unpublished',
      ),
    ).toBe('A summary')
    expect(
      postSearchMeta(
        {
          category: { name: 'Notes' },
          isPublished: false,
          slug: 'hello',
          summary: '  ',
        },
        'Unpublished',
      ),
    ).toBe('Unpublished · Notes · hello')
  })
})

describe('collectMatchingPosts', () => {
  const posts = [
    { id: '1', slug: 'open-gate', title: 'Opening' },
    { id: '2', slug: 'closed', title: 'Closed' },
    { id: '3', slug: 'notes', text: 'leave the door open', title: 'Notes' },
  ]

  it('matches title, slug, or body', () => {
    expect(
      posts
        .filter((post) => postMatchesKeyword(post, 'open'))
        .map((post) => post.id),
    ).toEqual(['1', '3'])
  })

  it('reads later pages until the limit is filled', async () => {
    const result = await collectMatchingPosts('open', 1, async (page) => ({
      data: page === 1 ? [posts[1]] : [posts[0]],
      pagination: { page, size: 1, total: 2, totalPages: 2 },
    }))

    expect(result.data.map((post) => post.id)).toEqual(['1'])
  })
})
