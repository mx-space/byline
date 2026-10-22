import { normalizeLanguageCode as normalizeSharedLanguageCode } from '@mx-space/ai'

export const normalizeLanguageCode = (
  input?: string | null,
): string | undefined =>
  normalizeSharedLanguageCode(input, { foldRegion: false })

// A regional request falls back to its bare base language only. Sibling
// regions are never substituted: zh-HK must not be served zh-TW or zh-CN.
export const languageFallbackChain = (input?: string | null): string[] => {
  const normalized = normalizeLanguageCode(input)
  if (!normalized) return []
  const base = normalized.split('-')[0]
  return base !== normalized ? [normalized, base] : [normalized]
}

export const resolveRequestedLanguage = (
  input: unknown,
  fallback?: string,
): string | undefined => {
  if (typeof input !== 'string') return fallback
  if (input.toLowerCase() === 'original') return undefined

  return normalizeLanguageCode(input) ?? fallback
}

export const parseAcceptLanguage = (
  header?: string | string[] | null,
): string | undefined => {
  if (Array.isArray(header)) {
    return parseAcceptLanguage(header.join(','))
  }
  if (typeof header !== 'string') return undefined
  const trimmed = header.trim()
  if (!trimmed) return undefined

  const parts = trimmed.split(',')
  for (const part of parts) {
    const token = part.trim().split(';')[0]?.trim()
    if (!token) continue
    const normalized = normalizeLanguageCode(token)
    if (normalized) return normalized
  }

  return undefined
}
