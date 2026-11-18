import {
  buildPostRowFromDraft,
  canonicalArticleId,
} from '~/processors/database/draft-article'

const document = {
  id: '100',
  refId: null as string | null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

const revision = {
  id: '200',
  documentId: '100',
  parentRevisionId: null,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  title: 'Draft title',
  text: 'Draft body',
  content: '{"root":{}}',
  contentFormat: 'lexical' as const,
  images: null,
  meta: null,
  typeSpecificData: {
    slug: 'hello',
    summary: 'One line',
    tags: ['cli'],
    sourceLang: 'zh-CN',
    image: 'https://cdn.example/cover.png',
    categoryId: '10',
    seo: { title: 'SEO', description: 'Desc' },
    publicAt: '2026-12-01T00:00:00.000Z',
  },
}

describe('canonicalArticleId', () => {
  it('uses the published post id when the document is linked', () => {
    expect(canonicalArticleId({ id: '100', refId: '9' })).toBe('9')
  })

  it('falls back to the document id for an unpublished draft', () => {
    expect(canonicalArticleId({ id: '100', refId: null })).toBe('100')
  })
})

describe('buildPostRowFromDraft', () => {
  it('builds a post-shaped article from an unpublished draft revision', () => {
    const post = buildPostRowFromDraft({ document, revision })
    expect(post).toMatchObject({
      id: '100',
      title: 'Draft title',
      slug: 'hello',
      text: 'Draft body',
      summary: 'One line',
      tags: ['cli'],
      sourceLang: 'zh-CN',
      image: 'https://cdn.example/cover.png',
      categoryId: '10',
      isPublished: false,
      seo: { title: 'SEO', description: 'Desc' },
    })
    expect(post.publicAt?.toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })

  it('keeps the published post id and overlays the draft head', () => {
    const post = buildPostRowFromDraft({
      document: { ...document, refId: '9' },
      revision,
      existing: {
        id: '9',
        title: 'Published',
        slug: 'old',
        text: 'old body',
        content: null,
        contentFormat: 'lexical',
        summary: 'old',
        images: null,
        meta: null,
        tags: ['old'],
        modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
        categoryId: '1',
        isPublished: true,
        publicAt: null,
        sourceLang: 'en',
        image: null,
        seo: null,
        pinAt: null,
        pinOrder: null,
        createdAt: new Date('2025-12-01T00:00:00.000Z'),
      },
    })
    expect(post.id).toBe('9')
    expect(post.isPublished).toBe(true)
    expect(post.title).toBe('Draft title')
    expect(post.sourceLang).toBe('zh-CN')
    expect(post.image).toBe('https://cdn.example/cover.png')
    expect(post.slug).toBe('hello')
  })
})
