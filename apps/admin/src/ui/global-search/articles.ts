import type { PaginateResult } from '~/models/base'

export const POST_SEARCH_SIZE = 8
const POST_SCAN_PAGE_SIZE = 50
const POST_SCAN_PAGE_LIMIT = 20

export interface SearchablePost {
  category?: { name?: string }
  id: string
  isPublished?: boolean
  slug?: string
  summary?: string | null
  text?: string
  title?: string
}

export function postMatchesKeyword(post: SearchablePost, keyword: string) {
  const terms = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return false
  const haystack = [
    post.title,
    post.slug,
    post.summary,
    post.text,
    post.category?.name,
  ]
    .filter((part) => part)
    .join('\n')
    .toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export async function collectMatchingPosts<T extends SearchablePost>(
  keyword: string,
  limit: number,
  list: (page: number) => Promise<PaginateResult<T>>,
): Promise<PaginateResult<T>> {
  const matches: T[] = []
  let page = 1
  let totalPages = 1

  while (
    page <= totalPages &&
    page <= POST_SCAN_PAGE_LIMIT &&
    matches.length < limit
  ) {
    const result = await list(page)
    totalPages = result.pagination?.totalPages ?? page
    for (const post of result.data ?? []) {
      if (!postMatchesKeyword(post, keyword)) continue
      matches.push(post)
      if (matches.length >= limit) break
    }
    page += 1
  }

  return {
    data: matches,
    pagination: {
      page: 1,
      size: limit,
      total: matches.length,
      totalPages: 1,
    },
  }
}

export { POST_SCAN_PAGE_SIZE }

export function postSearchHref(id: string) {
  return `/posts/edit?id=${encodeURIComponent(id)}`
}

export function postsListSearchHref(keyword: string) {
  const params = new URLSearchParams({ keyword })
  return `/posts?${params.toString()}`
}

export function postSearchMeta(
  post: {
    category?: { name?: string }
    isPublished?: boolean
    slug?: string
    summary?: string | null
  },
  unpublished: string,
) {
  const summary = post.summary?.trim()
  const path = [post.category?.name, post.slug].filter(Boolean).join(' · ')
  const detail = summary || path
  if (post.isPublished === false) {
    return detail ? `${unpublished} · ${detail}` : unpublished
  }
  return detail || undefined
}
