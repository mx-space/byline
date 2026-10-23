export function categoryIdFromRouteParam(
  raw: string | undefined,
): string | null {
  if (!raw) return null
  if (raw.startsWith('t-')) return null
  if (raw.startsWith('c-')) {
    const id = raw.slice(2)
    return id || null
  }
  return raw
}
