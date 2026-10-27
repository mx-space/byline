import type { PostSeo } from '../../post/post.types'
import type { LocaleMetaField, LocaleMetaRow } from './ai-overview.types'

type SeoTextKey = 'title' | 'description'

interface LocaleMetaInput {
  sourceLang: string
  sourceSeo: PostSeo | null | undefined
  aiSeoDescription: string | null
  translations: Array<{
    lang: string
    seo: PostSeo | null | undefined
    isLocked: boolean
  }>
  summaries: Array<{ lang: string; summary: string; isLocked: boolean }>
  configuredLangs: string[]
}

interface SummaryHashRow {
  lang: string
  hash: string
  isTranslation: boolean
  isLocked: boolean
}

const EMPTY: LocaleMetaField = { text: null, source: 'empty' }

const readText = (seo: PostSeo | null | undefined, key: SeoTextKey) => {
  const value = seo?.[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function sourceField(input: LocaleMetaInput, key: SeoTextKey): LocaleMetaField {
  const text = readText(input.sourceSeo, key)
  if (!text) return EMPTY
  const aiFilled = key === 'description' && text === input.aiSeoDescription
  return { text, source: aiFilled ? 'ai' : 'human' }
}

function translatedField(
  input: LocaleMetaInput,
  translation: LocaleMetaInput['translations'][number] | undefined,
  key: SeoTextKey,
): LocaleMetaField {
  const text = readText(translation?.seo, key)
  if (text) return { text, source: translation!.isLocked ? 'human' : 'ai' }
  const fallback = readText(input.sourceSeo, key)
  return fallback ? { text: fallback, source: 'inherited' } : EMPTY
}

export function buildLocaleMeta(input: LocaleMetaInput): LocaleMetaRow[] {
  const translations = new Map(input.translations.map((row) => [row.lang, row]))
  const summaries = new Map(input.summaries.map((row) => [row.lang, row]))
  const others = [
    ...new Set([
      ...input.configuredLangs,
      ...translations.keys(),
      ...summaries.keys(),
    ]),
  ]
    .filter((lang) => lang !== input.sourceLang)
    .sort((a, b) => a.localeCompare(b))

  return [input.sourceLang, ...others].map((lang) => {
    const isSource = lang === input.sourceLang
    const translation = translations.get(lang)
    const summary = summaries.get(lang)
    return {
      lang,
      isSource,
      seoTitle: isSource
        ? sourceField(input, 'title')
        : translatedField(input, translation, 'title'),
      seoDescription: isSource
        ? sourceField(input, 'description')
        : translatedField(input, translation, 'description'),
      summary: summary
        ? { text: summary.summary, source: summary.isLocked ? 'locked' : 'ai' }
        : EMPTY,
    }
  })
}

export function isSummaryStale(
  row: SummaryHashRow,
  rows: SummaryHashRow[],
  articleHash: string,
): boolean {
  if (row.isLocked) return false
  if (row.isTranslation) {
    const lockedBase = rows.find((item) => !item.isTranslation && item.isLocked)
    if (lockedBase) return row.hash !== lockedBase.hash
  }
  return row.hash !== articleHash
}
