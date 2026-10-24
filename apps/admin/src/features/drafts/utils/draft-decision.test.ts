import { describe, expect, it } from 'vitest'

import type { DraftModel } from '~/models/draft'
import { DraftRefType } from '~/models/draft'

import { draftCopy } from '../copy'
import {
  countWords,
  draftAuthorIds,
  draftChangeKind,
  draftFieldChanges,
  draftHasConflict,
  draftRevertsChanges,
  draftTitle,
  isPublishedIdenticalDraft,
  parentPostLabel,
  sortDrafts,
} from './draft-decision'

function draft(patch: Partial<DraftModel> = {}): DraftModel {
  return {
    baseRevision: {
      content: null,
      contentFormat: 'lexical',
      createdAt: '2026-10-01T00:00:00.000Z',
      documentId: 'doc',
      id: 'base',
      images: null,
      meta: null,
      parentRevisionId: null,
      text: '',
      title: '已发布',
      typeSpecificData: null,
    },
    baseRevisionId: 'base',
    commonAncestorRevisionId: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    document: {
      createdAt: '2026-10-01T00:00:00.000Z',
      id: 'doc',
      publishedRevisionId: null,
      refId: null,
      refType: DraftRefType.Post,
      updatedAt: null,
    },
    documentId: 'doc',
    headRevision: {
      content: null,
      contentFormat: 'lexical',
      createdAt: '2026-10-02T00:00:00.000Z',
      documentId: 'doc',
      id: 'head',
      images: null,
      meta: null,
      parentRevisionId: null,
      text: 'body',
      title: ' 晨记 ',
      typeSpecificData: { authors: ['u1', { id: 'u2' }] },
    },
    headRevisionId: 'head',
    id: 'draft-1',
    publishedRevision: null,
    relationToPublished: null,
    status: 'active',
    updatedAt: '2026-10-02T00:00:00.000Z',
    ...patch,
  }
}

describe('draft decision', () => {
  it('names the draft in the delete confirmation', () => {
    expect(draftCopy('zh-CN', 'confirmDeleteTitle', { title: '晨记' })).toBe(
      '删除草稿「晨记」？',
    )
    expect(draftCopy('zh-CN', 'confirmDeleteBody')).toContain('无法恢复')
    expect(draftCopy('zh-CN', 'changeBehind')).toBe('改动')
    expect(draftCopy('zh-CN', 'confirmRevertTitle', { title: '晨记' })).toBe(
      '撤销「晨记」的改动？',
    )
    expect(draftCopy('zh-CN', 'confirmRevertBody')).toContain('已发布的文章')
  })

  it('reads title, parent post, change, and conflict from the draft', () => {
    const fresh = draft()
    expect(draftTitle(fresh, '无标题')).toBe('晨记')
    expect(draftChangeKind(fresh)).toBe('new')
    expect(parentPostLabel(fresh, '尚未发布', '--')).toBe('尚未发布')
    expect(draftAuthorIds(fresh)).toEqual(['u1', 'u2'])

    const diverged = draft({
      document: {
        createdAt: '2026-10-01T00:00:00.000Z',
        id: 'doc',
        publishedRevisionId: 'pub',
        refId: 'post-1',
        refType: DraftRefType.Post,
        updatedAt: null,
      },
      publishedRevision: {
        content: null,
        contentFormat: 'lexical',
        createdAt: '2026-10-01T00:00:00.000Z',
        documentId: 'doc',
        id: 'pub',
        images: null,
        meta: null,
        parentRevisionId: null,
        text: 'live',
        title: '已发布标题',
        typeSpecificData: null,
      },
      relationToPublished: 'diverged',
    })
    expect(draftChangeKind(diverged)).toBe('changed')
    expect(draftRevertsChanges(diverged)).toBe(false)
    expect(draftRevertsChanges(fresh)).toBe(false)
    expect(
      draftRevertsChanges(
        draft({ ...diverged, relationToPublished: 'ancestor' }),
      ),
    ).toBe(true)
    expect(isPublishedIdenticalDraft(diverged)).toBe(false)
    expect(
      isPublishedIdenticalDraft(
        draft({ ...diverged, relationToPublished: 'same' }),
      ),
    ).toBe(true)
    expect(draftHasConflict(diverged)).toBe(true)
    expect(parentPostLabel(diverged, '尚未发布', '--')).toBe('已发布标题')
  })

  it('counts CJK characters and latin words, ignoring links and images', () => {
    expect(countWords('你好世界')).toBe(4)
    expect(countWords('Hello world, it’s me')).toBe(4)
    expect(
      countWords(
        '看 [文档](https://example.com/a) ![图](https://x.y/z.png) ok',
      ),
    ).toBe(4)
  })

  it('lists only the fields that differ from the published revision', () => {
    const published = draft().baseRevision
    const head = {
      ...draft().headRevision,
      title: '已发布',
      typeSpecificData: {
        authors: ['u1'],
        categoryId: 'c2',
        slug: 'same',
        tags: ['a', 'b'],
      },
    }
    const changes = draftFieldChanges(
      {
        ...published,
        typeSpecificData: {
          authors: ['u1'],
          categoryId: 'c1',
          slug: 'same',
          tags: ['a'],
        },
      },
      head,
      {
        authors: (ids) => ids.join('/'),
        category: (id) => `cat-${id}`,
        empty: '--',
        listJoin: '、',
      },
    )
    expect(changes).toEqual([
      { from: 'cat-c1', key: 'category', to: 'cat-c2' },
      { from: 'a', key: 'tags', to: 'a、b' },
    ])
  })

  it('sorts the loaded page by oldest save or title', () => {
    const a = draft({ id: 'a', updatedAt: '2026-10-03T00:00:00.000Z' })
    const b = draft({
      headRevision: { ...draft().headRevision, title: 'Alpha' },
      id: 'b',
      updatedAt: '2026-10-01T00:00:00.000Z',
    })
    expect(
      sortDrafts([a, b], 'saved', '无标题', 'zh-CN').map((d) => d.id),
    ).toEqual(['a', 'b'])
    expect(
      sortDrafts([a, b], 'oldest', '无标题', 'zh-CN').map((d) => d.id),
    ).toEqual(['b', 'a'])
    expect(
      sortDrafts([a, b], 'title', '无标题', 'en-US').map((d) => d.id),
    ).toEqual(['b', 'a'])
  })
})
