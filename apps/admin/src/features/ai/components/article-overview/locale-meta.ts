import type { LocaleMetaRow } from '~/api/ai-overview'

export const LOCALE_META_PREVIEW = 5

export const LOCALE_META_ANCHOR = 'locale-meta'

export function visibleLocaleMeta(rows: LocaleMetaRow[], expanded: boolean) {
  if (expanded || rows.length <= LOCALE_META_PREVIEW) {
    return { hidden: 0, rows }
  }
  return {
    hidden: rows.length - LOCALE_META_PREVIEW,
    rows: rows.slice(0, LOCALE_META_PREVIEW),
  }
}

export function localeMetaEditPath(
  row: LocaleMetaRow,
  refId: string,
  translations: Array<{ id: string; lang: string }>,
  postEditPath: ((id: string) => string) | undefined,
): string | null {
  if (row.isSource) return postEditPath ? postEditPath(refId) : null
  const translation = translations.find((item) => item.lang === row.lang)
  if (!translation) return null
  const params = new URLSearchParams({
    id: refId,
    translationId: translation.id,
  })
  return `/posts/edit?${params.toString()}`
}
