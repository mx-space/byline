import { describe, expect, it } from 'vitest'

import type { LocaleMetaRow } from '~/api/ai-overview'

import {
  LOCALE_META_PREVIEW,
  localeMetaEditPath,
  visibleLocaleMeta,
} from './locale-meta'

const field = { text: null, source: 'empty' as const }
const row = (lang: string, isSource = false): LocaleMetaRow => ({
  isSource,
  lang,
  seoDescription: field,
  seoTitle: field,
  summary: field,
})

describe('visibleLocaleMeta', () => {
  const rows = ['en', 'ar', 'de', 'es', 'fr', 'ja', 'ko'].map((lang, index) =>
    row(lang, index === 0),
  )

  it('shows the first rows and counts the rest while collapsed', () => {
    expect(visibleLocaleMeta(rows, false)).toEqual({
      hidden: rows.length - LOCALE_META_PREVIEW,
      rows: rows.slice(0, LOCALE_META_PREVIEW),
    })
  })

  it('shows every row once expanded', () => {
    expect(visibleLocaleMeta(rows, true)).toEqual({ hidden: 0, rows })
  })
})

describe('localeMetaEditPath', () => {
  const translations = [{ id: 't-ja', lang: 'ja' }]
  const postEditPath = (id: string) => `/posts/edit?id=${id}`

  it('opens the post editor for the source row', () => {
    expect(
      localeMetaEditPath(row('en', true), '42', translations, postEditPath),
    ).toBe('/posts/edit?id=42')
  })

  it('opens the translation editor for a translated language', () => {
    expect(
      localeMetaEditPath(row('ja'), '42', translations, postEditPath),
    ).toBe('/posts/edit?id=42&translationId=t-ja')
  })

  it('has no target for a language without a translation', () => {
    expect(
      localeMetaEditPath(row('fr'), '42', translations, postEditPath),
    ).toBeNull()
  })
})
