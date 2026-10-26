import { describe, expect, it } from 'vitest'

import type { AiOverviewListRow } from '~/api/ai-overview'
import type { DraftModel } from '~/models/draft'
import { DraftRefType } from '~/models/draft'

import {
  aiGapRows,
  aiOverviewArticlePath,
  buildCreationHeatmap,
  buildWritingItems,
  countCategoryShare,
  countPublishStates,
  countUnpublishedDrafts,
  displayDeskTime,
  postSeoChecks,
  postTranslationCheck,
  SEO_DESCRIPTION_LIMIT,
  SEO_TITLE_LIMIT,
  takePublishedPosts,
  taskRecordPath,
  translationGapSummary,
  versionLabel,
} from './desk'

function draft(over: {
  documentId: string
  id: string
  refId?: string | null
  relation?: DraftModel['relation']
  text?: string
  updatedAt: string
}): DraftModel {
  return {
    createdAt: over.updatedAt,
    document: {
      refId: over.refId ?? null,
      refType: DraftRefType.Post,
    },
    documentId: over.documentId,
    headRevision: {
      text: over.text ?? '',
      title: over.id,
    },
    id: over.id,
    relation: over.relation ?? 'fresh',
    status: 'active',
    updatedAt: over.updatedAt,
  } as unknown as DraftModel
}

describe('buildWritingItems', () => {
  it('lists each working copy that is ahead or fresh, newest first', () => {
    const items = buildWritingItems([
      draft({
        documentId: 'doc-a',
        id: 'a1',
        refId: 'p1',
        relation: 'ahead',
        updatedAt: '2026-09-14',
      }),
      draft({
        documentId: 'doc-b',
        id: 'b1',
        text: 'first line\n\nsecond   line',
        updatedAt: '2026-09-12',
      }),
      draft({
        documentId: 'doc-c',
        id: 'c1',
        refId: 'p3',
        relation: 'in_sync',
        updatedAt: '2026-09-13',
      }),
    ])
    expect(items.map((item) => [item.id, item.status])).toEqual([
      ['doc-a', 'modified'],
      ['doc-b', 'unpublished'],
    ])
    expect(items[0].draftId).toBe('a1')
  })
})

describe('aiGapRows', () => {
  it('keeps only posts that miss at least one AI output', () => {
    const row = (id: string, gapCount: number) =>
      ({
        article: { id, title: id, type: 'Post' },
        gapCount,
      }) as unknown as AiOverviewListRow
    expect(
      aiGapRows([row('a', 0), row('b', 2), row('c', 1)]).map(
        (r) => r.article.id,
      ),
    ).toEqual(['b', 'c'])
    expect(aiOverviewArticlePath('b 1')).toBe('/ai/overview/b%201')
  })
})

describe('countUnpublishedDrafts', () => {
  it('counts fresh drafts and working copies ahead of published', () => {
    expect(
      countUnpublishedDrafts([
        draft({ documentId: 'n', id: 'n1', updatedAt: '2026-10-01' }),
        draft({
          documentId: 'c',
          id: 'c1',
          refId: 'p2',
          relation: 'ahead',
          updatedAt: '2026-10-03',
        }),
        draft({
          documentId: 's',
          id: 's1',
          refId: 'p3',
          relation: 'in_sync',
          updatedAt: '2026-10-04',
        }),
      ]),
    ).toEqual({ changes: 1, drafts: 1 })
  })
})

describe('takePublishedPosts', () => {
  it('keeps published order and stops at the limit', () => {
    expect(
      takePublishedPosts(
        [
          { id: 'a', isPublished: false },
          { id: 'b', isPublished: true },
          { id: 'c', isPublished: true },
          { id: 'd', isPublished: true },
        ],
        2,
      ),
    ).toEqual([
      { id: 'b', isPublished: true },
      { id: 'c', isPublished: true },
    ])
  })
})

describe('countCategoryShare', () => {
  it('groups blank names and sorts by count', () => {
    expect(
      countCategoryShare(['Product', 'Product', 'Product', ' ', null, 'Notes']),
    ).toEqual([
      { count: 3, name: 'Product' },
      { count: 2, name: null },
      { count: 1, name: 'Notes' },
    ])
  })
})

describe('buildCreationHeatmap', () => {
  it('fills the year and scales the busiest day to the top level', () => {
    const quiet = new Date(2026, 0, 2, 15).toISOString()
    const busy = [
      new Date(2026, 2, 4, 9).toISOString(),
      new Date(2026, 2, 4, 18).toISOString(),
    ]
    const otherYear = new Date(2025, 5, 1, 12).toISOString()
    const days = buildCreationHeatmap([quiet, ...busy, otherYear], 2026)
    const january = days.find((day) => day.date === '2026-01-02')
    const march = days.find((day) => day.date === '2026-03-04')
    const empty = days.find((day) => day.date === '2026-01-03')

    expect(days[0]?.date).toBe('2026-01-01')
    expect(days.at(-1)?.date).toBe('2026-12-31')
    expect(january).toMatchObject({ count: 1, level: 2 })
    expect(march).toMatchObject({ count: 2, level: 4 })
    expect(empty).toMatchObject({ count: 0, level: 0 })
    expect(days.some((day) => day.date.startsWith('2025'))).toBe(false)
  })
})

describe('countPublishStates', () => {
  it('splits posts by the published flag and keeps the latest publish time', () => {
    expect(
      countPublishStates([
        { createdAt: '2026-09-01T00:00:00.000Z', isPublished: true },
        { isPublished: false },
        { createdAt: '2026-10-02T08:30:00.000Z', isPublished: true },
        {},
      ]),
    ).toEqual({
      latestPublishedAt: '2026-10-02T08:30:00.000Z',
      published: 2,
      unpublished: 2,
    })
  })
})

describe('postTranslationCheck', () => {
  it('treats a filled language list with no expected langs as done', () => {
    expect(
      postTranslationCheck({
        applicable: true,
        expected: [],
        langs: ['en', 'zh-CN'],
      }),
    ).toEqual({
      done: 2,
      missing: 0,
      missingLangs: [],
      state: 'done',
      total: 2,
    })
  })

  it('counts expected langs that are absent', () => {
    expect(
      postTranslationCheck({
        applicable: true,
        expected: ['en', 'ja'],
        langs: ['en'],
      }),
    ).toEqual({
      done: 1,
      missing: 1,
      missingLangs: ['ja'],
      state: 'gap',
      total: 2,
    })
  })
})

describe('postSeoChecks', () => {
  it('accepts the post title, summary, and cover as fallbacks', () => {
    expect(
      postSeoChecks({
        image: 'https://cdn.example/cover.jpg',
        summary: 'A summary',
        title: 'Hello',
      }).map((field) => field.state),
    ).toEqual(['ok', 'ok', 'ok'])
  })

  it('flags a missing cover and an over-long title or description', () => {
    const checks = postSeoChecks({
      summary: 'y'.repeat(SEO_DESCRIPTION_LIMIT + 1),
      title: 'x'.repeat(SEO_TITLE_LIMIT + 1),
    })
    expect(checks.map((field) => [field.key, field.state])).toEqual([
      ['image', 'missing'],
      ['title', 'long'],
      ['description', 'long'],
    ])
    expect(checks[1]?.used).toBe(SEO_TITLE_LIMIT + 1)
  })

  it('prefers a stored seo value over the post fallback', () => {
    expect(
      postSeoChecks({
        image: 'https://cdn.example/cover.jpg',
        seo: { title: 'Short' },
        summary: 'A summary',
        title: 'x'.repeat(SEO_TITLE_LIMIT + 1),
      })[1],
    ).toMatchObject({ key: 'title', state: 'ok', used: 5 })
  })
})

describe('translationGapSummary', () => {
  function row(expected: string[], langs: string[], applicable = true) {
    return {
      article: { id: expected.join(','), title: '', type: 'Post' as const },
      coverage: {
        translation: { applicable, expected, langs },
      },
      gapCount: 0,
    }
  }

  it('counts posts and languages that are missing a translation', () => {
    expect(
      translationGapSummary([
        row(['zh', 'ja'], ['zh']),
        row(['zh'], ['zh']),
        row([], ['zh-CN']),
        row([], []),
        row(['ja'], [], false),
      ]),
    ).toEqual({ applicable: 3, items: 1, posts: 1 })
  })
})

describe('task records', () => {
  it('keeps the task filter on the link', () => {
    expect(taskRecordPath('42', 'failed')).toBe('/tasks/42?status=failed')
    expect(taskRecordPath('42', 'active')).toBe('/tasks/42?status=active')
  })

  it('renders a missing time as an empty placeholder', () => {
    expect(displayDeskTime('-')).toBe('--')
    expect(displayDeskTime('3 分钟前')).toBe('3 分钟前')
    expect(versionLabel('')).toBe('--')
    expect(versionLabel('1.2.0')).toBe('v1.2.0')
  })
})
