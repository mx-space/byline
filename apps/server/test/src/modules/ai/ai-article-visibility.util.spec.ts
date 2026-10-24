import { CollectionRefTypes } from '~/constants/db.constant'
import { isArticleVisibleToViewer } from '~/modules/ai/ai-article-visibility.util'

describe('scheduled post visibility', () => {
  afterEach(() => vi.useRealTimers())

  it('withholds a prepared post until its public time, including AI resources', () => {
    vi.useFakeTimers()
    const article = {
      type: CollectionRefTypes.Post,
      document: {
        isPublished: true,
        publicAt: new Date('2030-01-01T12:00:00Z'),
      },
    }
    vi.setSystemTime(new Date('2030-01-01T11:59:59Z'))
    expect(isArticleVisibleToViewer(article, {})).toBe(false)
    expect(isArticleVisibleToViewer(article, { isOwner: true })).toBe(true)

    vi.setSystemTime(new Date('2030-01-01T12:00:00Z'))
    expect(isArticleVisibleToViewer(article, {})).toBe(true)
    article.document.isPublished = false
    expect(isArticleVisibleToViewer(article, {})).toBe(false)
  })
})
