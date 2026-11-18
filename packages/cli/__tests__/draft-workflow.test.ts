import { describe, expect, it } from 'vitest'

import { parsePublicAt } from '../src/commands/draft'
import { collectSeoIssues } from '../src/writing/check'
import { SEO_DESCRIPTION_LIMIT, SEO_TITLE_LIMIT } from '../src/writing/limits'
import {
  describePublicLink,
  draftAdminUrl,
  draftEditPath,
  joinAdminUrl,
  publicPostLink,
  renderPostPermalink,
} from '../src/writing/urls'

describe('collectSeoIssues', () => {
  it('flags an SEO title and description that exceed the admin limits', () => {
    const issues = collectSeoIssues({
      title: 'Short',
      seo: {
        title: 'T'.repeat(SEO_TITLE_LIMIT + 1),
        description: 'D'.repeat(SEO_DESCRIPTION_LIMIT + 1),
      },
    })
    expect(issues.map((issue) => issue.code)).toEqual([
      'seo_title_too_long',
      'seo_description_too_long',
    ])
  })

  it('uses the post title when SEO title is empty', () => {
    const issues = collectSeoIssues({
      title: 'T'.repeat(SEO_TITLE_LIMIT + 2),
      seo: { title: '', description: 'ok' },
    })
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('seo_title_too_long')
  })

  it('accepts titles and descriptions at the limit', () => {
    expect(
      collectSeoIssues({
        title: 'T'.repeat(SEO_TITLE_LIMIT),
        seo: { description: 'D'.repeat(SEO_DESCRIPTION_LIMIT) },
      }),
    ).toEqual([])
  })
})

describe('URLs', () => {
  it('builds the admin edit path like the admin app', () => {
    expect(
      draftEditPath({ id: '1', document: { refId: null } }),
    ).toBe('/posts/edit?draftId=1')
    expect(
      draftEditPath({ id: '1', document: { refId: '9' } }),
    ).toBe('/posts/edit?draftId=1&id=9')
  })

  it('joins the configured admin URL without hardcoding a domain', () => {
    expect(joinAdminUrl('https://cms.example/admin/', '/posts/edit?draftId=1')).toBe(
      'https://cms.example/admin/posts/edit?draftId=1',
    )
    const draft = {
      id: '1',
      document: { refId: null },
    }
    expect(
      draftAdminUrl(
        {
          adminUrl: 'https://cms.example/admin/',
          webUrl: 'https://blog.example',
          serverUrl: 'https://cms.example',
          wsUrl: 'https://cms.example',
        },
        draft as never,
      ),
    ).toBe('https://cms.example/admin/posts/edit?draftId=1')
  })

  it('renders the public permalink from site settings', () => {
    expect(
      renderPostPermalink('/posts/{category}/{slug}', {
        category: 'engineering',
        slug: 'hello world',
        id: '9',
      }),
    ).toBe('/posts/engineering/hello%20world')
  })

  it('does not invent a public URL for an unpublished post', () => {
    const link = publicPostLink(
      {
        adminUrl: 'https://cms.example/admin/',
        webUrl: 'https://blog.example',
        serverUrl: 'https://cms.example',
        wsUrl: 'https://cms.example',
        postPermalink: '/posts/{category}/{slug}',
      },
      {
        id: '9',
        slug: 'hello',
        category: { slug: 'engineering' },
        isPublished: false,
        publicAt: null,
      } as never,
    )
    expect(link.status).toBe('unavailable')
    expect(describePublicLink(link)).toBe('not published; no public URL')
  })

  it('marks a future publicAt as scheduled, not live', () => {
    const link = publicPostLink(
      {
        adminUrl: 'https://cms.example/admin/',
        webUrl: 'https://blog.example',
        serverUrl: 'https://cms.example',
        wsUrl: 'https://cms.example',
        postPermalink: '/{slug}',
      },
      {
        id: '9',
        slug: 'hello',
        isPublished: true,
        publicAt: '2099-12-01T00:00:00.000Z',
      } as never,
    )
    expect(link.status).toBe('scheduled')
    expect(link.url).toBe('https://blog.example/hello')
    expect(describePublicLink(link)).toContain('not public yet')
  })
})

describe('parsePublicAt', () => {
  it('normalizes a valid ISO datetime', () => {
    expect(parsePublicAt('2099-12-01T10:00:00+08:00')).toBe(
      '2099-12-01T02:00:00.000Z',
    )
  })

  it('rejects an invalid datetime', () => {
    expect(() => parsePublicAt('tomorrow morning')).toThrow('Invalid --at')
  })
})
