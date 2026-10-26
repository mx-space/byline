import { describe, expect, it } from 'vitest'

import { joinWebUrl, renderPostPermalink } from './permalink'

describe('renderPostPermalink', () => {
  it('renders the default category and slug path', () => {
    expect(
      renderPostPermalink('/posts/{category}/{slug}', {
        category: 'community',
        slug: 'hello world',
      }),
    ).toBe('/posts/community/hello%20world')
  })

  it('drops the empty category segment', () => {
    expect(renderPostPermalink('/{category}/{slug}', { slug: 'hello' })).toBe(
      '/hello',
    )
  })

  it('keeps the id token while the post has no id', () => {
    expect(renderPostPermalink('/p/{id}', { slug: 'hello' })).toBe('/p/{id}')
  })

  it('leaves values raw when encoding is off', () => {
    expect(
      renderPostPermalink(
        '/{slug}',
        { slug: 'hello world' },
        { encode: false },
      ),
    ).toBe('/hello world')
  })
})

describe('joinWebUrl', () => {
  it('keeps the path of the frontend url', () => {
    expect(joinWebUrl('https://lobehub.com/blog/', '/hello')).toBe(
      'https://lobehub.com/blog/hello',
    )
  })
})
