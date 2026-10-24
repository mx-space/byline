import { CollectionRefTypes } from '~/constants/db.constant'
import { paginationOf } from '~/processors/database/base.repository'
import type {
  DatabaseService,
  RefArticleInfo,
} from '~/processors/database/database.service'

import {
  compareArticlesByPublishTime,
  type PublishOrderArticle,
} from './article-publish-order'

export interface BuildGroupedWithOrphansInput<TItem> {
  page: number
  size: number
  search?: string

  databaseService: DatabaseService

  fetchCandidateArticles: () => Promise<{
    posts: PublishOrderArticle[]
  }>

  fetchItemsByRefIds: (refIds: string[]) => Promise<TItem[]>

  getItemRefId: (item: TItem) => string
}

export interface GroupedWithOrphansResult<TItem> {
  data: Array<{ article: RefArticleInfo; items: TItem[] }>
  pagination: ReturnType<typeof paginationOf>
}

/**
 * Paginate every article, including ones with no AI rows. Unpublished posts
 * come first; public posts follow by publish time. `items` is empty for
 * articles that have no records.
 */
export async function buildGroupedWithOrphans<TItem>(
  input: BuildGroupedWithOrphansInput<TItem>,
): Promise<GroupedWithOrphansResult<TItem>> {
  const { page, size, databaseService } = input
  const search = input.search?.trim()

  const searchableRefIds = search
    ? await databaseService.findArticleIdsByTitle(search)
    : undefined

  if (search && (!searchableRefIds || searchableRefIds.length === 0)) {
    return { data: [], pagination: paginationOf(0, page, size) }
  }

  const { posts } = await input.fetchCandidateArticles()
  const searchableRefSet = searchableRefIds
    ? new Set(searchableRefIds)
    : undefined
  const ordered = posts
    .filter((post) => !searchableRefSet || searchableRefSet.has(post.id))
    .sort(compareArticlesByPublishTime)

  const total = ordered.length
  const offset = (page - 1) * size
  const pagePosts = ordered.slice(offset, offset + size)
  if (!pagePosts.length) {
    return { data: [], pagination: paginationOf(total, page, size) }
  }

  const items = await input.fetchItemsByRefIds(pagePosts.map((post) => post.id))
  const itemsByRefId = items.reduce<Record<string, TItem[]>>((acc, item) => {
    const refId = input.getItemRefId(item)
    if (!acc[refId]) acc[refId] = []
    acc[refId].push(item)
    return acc
  }, {})

  const data = pagePosts.map((post) => ({
    article: {
      id: post.id,
      title: post.title,
      type: CollectionRefTypes.Post,
      ...(post.draftId ? { draftId: post.draftId } : {}),
    },
    items: itemsByRefId[post.id] ?? [],
  }))

  return { data, pagination: paginationOf(total, page, size) }
}
