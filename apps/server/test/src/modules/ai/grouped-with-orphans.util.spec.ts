import { describe, expect, it, vi } from 'vitest'

import { buildGroupedWithOrphans } from '~/modules/ai/grouped-with-orphans.util'

type FakeItem = { id: string; refId: string }

const POSTS = [
  {
    id: 'draft',
    title: 'Draft',
    isPublished: false,
    createdAt: '2024-03-01T00:00:00.000Z',
  },
  {
    id: 'scheduled',
    title: 'Scheduled',
    isPublished: true,
    publicAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2024-04-01T00:00:00.000Z',
  },
  {
    id: 'newer',
    title: 'Newer',
    isPublished: true,
    publicAt: '2024-06-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'older',
    title: 'Older',
    isPublished: true,
    createdAt: '2020-01-01T00:00:00.000Z',
  },
]

const buildHarness = (items: FakeItem[] = []) => {
  const databaseService = {
    findArticleIdsByTitle: vi.fn().mockResolvedValue([]),
  }
  return {
    databaseService,
    fetchCandidateArticles: vi.fn(async () => ({ posts: POSTS })),
    fetchItemsByRefIds: vi.fn(async (refIds: string[]) =>
      items.filter((item) => refIds.includes(item.refId)),
    ),
    getItemRefId: (item: FakeItem) => item.refId,
  }
}

describe('buildGroupedWithOrphans', () => {
  it('puts unpublished posts first, then public posts by publish time', async () => {
    const harness = buildHarness([
      { id: 'item-newer', refId: 'newer' },
      { id: 'item-older', refId: 'older' },
    ])

    const result = await buildGroupedWithOrphans({
      page: 1,
      size: 10,
      databaseService: harness.databaseService as any,
      fetchCandidateArticles: harness.fetchCandidateArticles,
      fetchItemsByRefIds: harness.fetchItemsByRefIds,
      getItemRefId: harness.getItemRefId,
    })

    expect(result.pagination.total).toBe(4)
    expect(result.data.map((row) => row.article.id)).toEqual([
      'scheduled',
      'draft',
      'newer',
      'older',
    ])
    expect(result.data[0].items).toEqual([])
    expect(result.data[2].items).toEqual([{ id: 'item-newer', refId: 'newer' }])
  })

  it('keeps a never-published draft ahead of public posts', async () => {
    const harness = buildHarness()
    harness.fetchCandidateArticles.mockResolvedValue({
      posts: [
        ...POSTS,
        {
          id: 'draft-only',
          title: 'Only a draft',
          isPublished: false,
          createdAt: '2024-08-01T00:00:00.000Z',
          draftId: 'draft-only',
        },
      ],
    })

    const result = await buildGroupedWithOrphans({
      page: 1,
      size: 10,
      databaseService: harness.databaseService as any,
      fetchCandidateArticles: harness.fetchCandidateArticles,
      fetchItemsByRefIds: harness.fetchItemsByRefIds,
      getItemRefId: harness.getItemRefId,
    })

    expect(result.data[0].article).toMatchObject({
      id: 'draft-only',
      draftId: 'draft-only',
      title: 'Only a draft',
    })
    expect(result.data[0].items).toEqual([])
  })

  it('paginates the publish-time order', async () => {
    const harness = buildHarness()

    const result = await buildGroupedWithOrphans({
      page: 2,
      size: 2,
      databaseService: harness.databaseService as any,
      fetchCandidateArticles: harness.fetchCandidateArticles,
      fetchItemsByRefIds: harness.fetchItemsByRefIds,
      getItemRefId: harness.getItemRefId,
    })

    expect(result.data.map((row) => row.article.id)).toEqual(['newer', 'older'])
    expect(harness.fetchItemsByRefIds).toHaveBeenCalledWith(['newer', 'older'])
  })

  it('returns an empty list immediately when search yields zero matches', async () => {
    const harness = buildHarness()
    harness.databaseService.findArticleIdsByTitle.mockResolvedValue([])

    const result = await buildGroupedWithOrphans({
      page: 1,
      size: 10,
      search: 'nothing',
      databaseService: harness.databaseService as any,
      fetchCandidateArticles: harness.fetchCandidateArticles,
      fetchItemsByRefIds: harness.fetchItemsByRefIds,
      getItemRefId: harness.getItemRefId,
    })

    expect(result).toEqual({
      data: [],
      pagination: expect.objectContaining({ total: 0 }),
    })
    expect(harness.fetchCandidateArticles).not.toHaveBeenCalled()
  })

  it('keeps only articles whose titles match the search', async () => {
    const harness = buildHarness()
    harness.databaseService.findArticleIdsByTitle.mockResolvedValue([
      'older',
      'draft',
    ])

    const result = await buildGroupedWithOrphans({
      page: 1,
      size: 10,
      search: 'post',
      databaseService: harness.databaseService as any,
      fetchCandidateArticles: harness.fetchCandidateArticles,
      fetchItemsByRefIds: harness.fetchItemsByRefIds,
      getItemRefId: harness.getItemRefId,
    })

    expect(result.data.map((row) => row.article.id)).toEqual(['draft', 'older'])
  })
})
