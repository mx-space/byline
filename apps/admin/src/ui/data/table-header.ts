export type HeaderSortOrder = 'ascend' | 'descend'

export const newestFirst: HeaderSortOrder[] = ['descend', 'ascend']

export const alphaFirst: HeaderSortOrder[] = ['ascend', 'descend']

export function compareText(left: string, right: string) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

export function compareNumber(
  left: number | null | undefined,
  right: number | null | undefined,
) {
  return (left ?? 0) - (right ?? 0)
}

export function compareTime(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
) {
  return timeValue(left) - timeValue(right)
}

export function orderedBy<T>(
  rows: readonly T[],
  order: HeaderSortOrder | null,
  compare: (left: T, right: T) => number,
) {
  if (!order) return [...rows]
  const direction = order === 'ascend' ? 1 : -1
  return [...rows].sort((left, right) => direction * compare(left, right) || 0)
}

export function readFilterValues(
  filters: Record<string, unknown> | undefined,
  key: string,
) {
  const value = filters?.[key]
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string' || typeof value === 'number') {
    return [String(value)]
  }
  return []
}

export function readSingleFilter(
  filters: Record<string, unknown> | undefined,
  key: string,
) {
  return readFilterValues(filters, key)[0] ?? null
}

function timeValue(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value) {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}
