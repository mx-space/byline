import { describe, expect, it } from 'vitest'

import {
  buildLocaleMeta,
  isSummaryStale,
} from '~/modules/ai/ai-overview/ai-overview-locale-meta.util'

const base = {
  sourceLang: 'en',
  sourceSeo: { title: 'Source title', description: 'Source description' },
  aiSeoDescription: null,
  translations: [],
  summaries: [],
  configuredLangs: [],
}

describe('buildLocaleMeta', () => {
  it('puts the source first, then every other language alphabetically', () => {
    const rows = buildLocaleMeta({
      ...base,
      configuredLangs: ['ja', 'en'],
      translations: [{ lang: 'zh-TW', seo: null, isLocked: false }],
      summaries: [{ lang: 'de', summary: 's', isLocked: false }],
    })

    expect(rows.map((row) => row.lang)).toEqual(['en', 'de', 'ja', 'zh-TW'])
    expect(rows[0].isSource).toBe(true)
  })

  it('tags author-written source SEO as human and an AI-filled description as ai', () => {
    const [human] = buildLocaleMeta(base)
    const [ai] = buildLocaleMeta({
      ...base,
      aiSeoDescription: 'Source description',
    })

    expect(human.seoTitle).toEqual({ text: 'Source title', source: 'human' })
    expect(human.seoDescription.source).toBe('human')
    expect(ai.seoDescription).toEqual({
      text: 'Source description',
      source: 'ai',
    })
  })

  it('tags a locked translation SEO as human and an unlocked one as ai', () => {
    const rows = buildLocaleMeta({
      ...base,
      translations: [
        { lang: 'ja', seo: { title: 'JA' }, isLocked: true },
        { lang: 'de', seo: { title: 'DE' }, isLocked: false },
      ],
    })
    const byLang = Object.fromEntries(rows.map((row) => [row.lang, row]))

    expect(byLang.ja.seoTitle).toEqual({ text: 'JA', source: 'human' })
    expect(byLang.de.seoTitle).toEqual({ text: 'DE', source: 'ai' })
  })

  it('falls back to the source SEO when a translation has no value for a field', () => {
    const rows = buildLocaleMeta({
      ...base,
      translations: [{ lang: 'ja', seo: { title: 'JA' }, isLocked: true }],
      configuredLangs: ['fr'],
    })
    const byLang = Object.fromEntries(rows.map((row) => [row.lang, row]))

    expect(byLang.ja.seoDescription).toEqual({
      text: 'Source description',
      source: 'inherited',
    })
    expect(byLang.fr.seoTitle).toEqual({
      text: 'Source title',
      source: 'inherited',
    })
  })

  it('marks a field empty when neither the language nor the source has it', () => {
    const rows = buildLocaleMeta({
      ...base,
      sourceSeo: null,
      configuredLangs: ['fr'],
    })

    expect(rows[0].seoTitle).toEqual({ text: null, source: 'empty' })
    expect(rows[1].seoDescription).toEqual({ text: null, source: 'empty' })
    expect(rows[1].summary).toEqual({ text: null, source: 'empty' })
  })

  it('tags locked summaries as locked and the rest as ai', () => {
    const rows = buildLocaleMeta({
      ...base,
      summaries: [
        { lang: 'en', summary: 'human en', isLocked: true },
        { lang: 'ja', summary: 'ai ja', isLocked: false },
      ],
    })

    expect(rows[0].summary).toEqual({ text: 'human en', source: 'locked' })
    expect(rows[1].summary).toEqual({ text: 'ai ja', source: 'ai' })
  })
})

describe('isSummaryStale', () => {
  const rows = [
    { lang: 'en', hash: 'old', isTranslation: false, isLocked: true },
    { lang: 'ja', hash: 'old', isTranslation: true, isLocked: false },
    { lang: 'de', hash: 'older', isTranslation: true, isLocked: false },
    { lang: 'fr', hash: 'older', isTranslation: true, isLocked: true },
  ]

  it('never marks a locked summary stale', () => {
    expect(isSummaryStale(rows[0], rows, 'current')).toBe(false)
    expect(isSummaryStale(rows[3], rows, 'current')).toBe(false)
  })

  it('compares translations of a locked base against the base hash', () => {
    expect(isSummaryStale(rows[1], rows, 'current')).toBe(false)
    expect(isSummaryStale(rows[2], rows, 'current')).toBe(true)
  })

  it('compares rows against the content hash when the base is not locked', () => {
    const unlocked = rows.map((row) => ({ ...row, isLocked: false }))

    expect(isSummaryStale(unlocked[1], unlocked, 'current')).toBe(true)
    expect(isSummaryStale(unlocked[1], unlocked, 'old')).toBe(false)
  })
})
