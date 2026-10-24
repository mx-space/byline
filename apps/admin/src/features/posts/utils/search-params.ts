import type { PostSortKey, SortOrder } from '../types/posts'

export function readPage(value: string | null) {
  const page = Number(value)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export function readPostSortKey(
  value: string | null,
  fallback: PostSortKey = 'createdAt',
): PostSortKey {
  if (
    value === 'createdAt' ||
    value === 'modifiedAt' ||
    value === 'pinAt' ||
    value === 'publicAt'
  ) {
    return value
  }
  return fallback
}

export function readSortOrder(
  value: string | null,
  fallback: SortOrder = 'desc',
): SortOrder {
  if (value === 'asc' || value === 'desc') return value
  return fallback
}
