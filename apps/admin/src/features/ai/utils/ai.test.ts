import { describe, expect, it } from 'vitest'

import {
  buildTtsRegeneratePayload,
  buildTtsResumePayload,
  isTtsNarrationIncomplete,
  parseLangInput,
} from './ai'

describe('parseLangInput', () => {
  it('splits on full-width and half-width commas, trims, lowercases, dedupes, and drops empty segments', () => {
    expect(parseLangInput('zh, EN，ja , , zh')).toEqual(['zh', 'en', 'ja'])
  })

  it('preserves first-occurrence order when deduping', () => {
    expect(parseLangInput('ja, zh, en, ja, zh')).toEqual(['ja', 'zh', 'en'])
  })

  it('returns an empty array for whitespace-only input', () => {
    expect(parseLangInput('  ')).toEqual([])
  })

  it('returns an empty array for empty input', () => {
    expect(parseLangInput('')).toEqual([])
  })

  it('keeps regional locales distinct and canonicalizes their casing', () => {
    expect(parseLangInput('zh-cn, zh, ZH-TW, zh_CN')).toEqual([
      'zh-CN',
      'zh',
      'zh-TW',
    ])
  })

  it('treats underscore as a hyphen', () => {
    expect(parseLangInput('en_US, en-us')).toEqual(['en-US'])
  })

  it('keeps a 3-letter primary tag that has no 2-letter form', () => {
    expect(parseLangInput('FIL-PH, jam')).toEqual(['fil-PH', 'jam'])
  })

  it('folds an alias onto the canonical code, so jp and ja are one language', () => {
    expect(parseLangInput('jp, ja')).toEqual(['ja'])
  })

  it('maps a 3-letter ISO code onto its 2-letter form', () => {
    expect(parseLangInput('eng')).toEqual(['en'])
  })

  it('canonicalizes script and region subtags', () => {
    expect(parseLangInput('zh-hant, pt-br, kr')).toEqual([
      'zh-Hant',
      'pt-BR',
      'ko',
    ])
  })

  it('returns a single value when there is no separator', () => {
    expect(parseLangInput('zh')).toEqual(['zh'])
  })
})

describe('buildTtsRegeneratePayload', () => {
  it('forces regeneration and scopes the task to the row language', () => {
    expect(buildTtsRegeneratePayload({ lang: 'zh', refId: '42' })).toEqual({
      force: true,
      langs: ['zh'],
      refId: '42',
    })
  })

  it('always sets force, so an unchanged article still re-synthesizes', () => {
    // Without this the management page's regenerate action is a no-op by
    // construction: every row it can act on already has narration.
    expect(buildTtsRegeneratePayload({ lang: 'en', refId: '7' }).force).toBe(
      true,
    )
  })
})

describe('buildTtsResumePayload', () => {
  it('never sets force, so committed chunks are reused and only the rest generate', () => {
    expect(buildTtsResumePayload({ lang: 'zh', refId: '42' })).toEqual({
      force: false,
      langs: ['zh'],
      refId: '42',
    })
  })
})

describe('isTtsNarrationIncomplete', () => {
  it('treats an empty blockOrder as an interrupted, unpublished narration', () => {
    expect(isTtsNarrationIncomplete({ blockOrder: [] })).toBe(true)
  })

  it('treats a published blockOrder as complete', () => {
    expect(isTtsNarrationIncomplete({ blockOrder: ['a', 'b'] })).toBe(false)
  })
})
