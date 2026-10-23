import { describe, expect, it } from 'vitest'

import type { AiOverviewListRow } from '~/api/ai-overview'
import type { DraftModel } from '~/models/draft'
import { DraftRefType } from '~/models/draft'

import {
  aiGapRows,
  aiOverviewArticlePath,
  buildWritingItems,
  displayDeskTime,
  taskRecordPath,
  versionLabel,
} from './desk'

function draft(over: {
  documentId: string
  id: string
  refId?: string | null
  relation?: DraftModel['relationToPublished']
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
    relationToPublished: over.relation ?? null,
    status: 'active',
    updatedAt: over.updatedAt,
  } as unknown as DraftModel
}

describe('buildWritingItems', () => {
  it('collapses branches per document and drops published-identical drafts', () => {
    const items = buildWritingItems([
      draft({
        documentId: 'doc-a',
        id: 'a1',
        refId: 'p1',
        relation: 'descendant',
        updatedAt: '2026-09-14',
      }),
      draft({
        documentId: 'doc-a',
        id: 'a2',
        refId: 'p1',
        relation: 'diverged',
        updatedAt: '2026-09-10',
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
        relation: 'same',
        updatedAt: '2026-09-13',
      }),
    ])
    expect(
      items.map((item) => [item.id, item.status, item.branchCount]),
    ).toEqual([
      ['doc-a', 'modified', 2],
      ['doc-b', 'unpublished', 1],
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
