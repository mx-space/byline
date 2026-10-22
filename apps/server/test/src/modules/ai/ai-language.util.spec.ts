import { describe, expect, it } from 'vitest'

import {
  getLanguageName,
  normalizeTargetLang,
  parseLanguageCode,
  resolveTargetLanguages,
} from '~/modules/ai/ai-language.util'

describe('ai-language.util', () => {
  describe('parseLanguageCode', () => {
    it('keeps the region of a regional locale', () => {
      expect(parseLanguageCode('en-US')).toBe('en-US')
      expect(parseLanguageCode('zh-CN')).toBe('zh-CN')
      expect(parseLanguageCode('zh_tw')).toBe('zh-TW')
      expect(parseLanguageCode('pt-br')).toBe('pt-BR')
    })

    it('should handle Accept-Language header format', () => {
      expect(parseLanguageCode('en-US,en;q=0.9,zh;q=0.8')).toBe('en-US')
      expect(parseLanguageCode('zh-CN,zh;q=0.9')).toBe('zh-CN')
    })

    it('should handle simple language code', () => {
      expect(parseLanguageCode('en')).toBe('en')
      expect(parseLanguageCode('zh')).toBe('zh')
    })

    it('should remap legacy aliases to canonical codes', () => {
      expect(parseLanguageCode('jp')).toBe('ja')
      expect(parseLanguageCode('cn')).toBe('zh-CN')
      expect(parseLanguageCode('tw')).toBe('zh-TW')
      expect(parseLanguageCode('kr')).toBe('ko')
    })

    it('should pass through unknown but valid base codes', () => {
      expect(parseLanguageCode('fil')).toBe('fil')
      expect(parseLanguageCode('yue')).toBe('yue')
      expect(parseLanguageCode('FIL-PH')).toBe('fil')
    })

    it('should return default when empty, garbage, or undefined', () => {
      expect(parseLanguageCode('')).toBe('zh')
      expect(parseLanguageCode(undefined)).toBe('zh')
      expect(parseLanguageCode('1234')).toBe('zh')
      expect(parseLanguageCode('not a lang')).toBe('zh')
    })

    it('canonicalizes the casing of language and region', () => {
      expect(parseLanguageCode('EN-US')).toBe('en-US')
      expect(parseLanguageCode('ZH-HANT')).toBe('zh-Hant')
    })
  })

  describe('getLanguageName', () => {
    it('should return full language name for known codes', () => {
      expect(getLanguageName('en')).toBe('English')
      expect(getLanguageName('zh')).toBe('Simplified Chinese')
      expect(getLanguageName('ja')).toBe('Japanese')
      expect(getLanguageName('ko')).toBe('Korean')
    })

    it('names regional locales', () => {
      expect(getLanguageName('zh-CN')).toBe('Simplified Chinese')
      expect(getLanguageName('zh-TW')).toBe('Traditional Chinese (Taiwan)')
      expect(getLanguageName('pt-BR')).toBe('Brazilian Portuguese')
      expect(getLanguageName('en-GB')).toBe('English (GB)')
    })

    it('should return code itself for unknown codes', () => {
      expect(getLanguageName('unknown')).toBe('unknown')
      expect(getLanguageName('xyz')).toBe('xyz')
    })
  })

  describe('normalizeTargetLang', () => {
    it('keeps regional targets distinct instead of folding them', () => {
      expect(normalizeTargetLang('zh-CN')).toBe('zh-CN')
      expect(normalizeTargetLang('zh-tw')).toBe('zh-TW')
      expect(normalizeTargetLang('en_US')).toBe('en-US')
      expect(normalizeTargetLang('zh')).toBe('zh')
    })

    it('passes an unrecognized token through as trim + lowercase, unlike parseLanguageCode', () => {
      // parseLanguageCode('english') would collapse to DEFAULT_SUMMARY_LANG
      // ('zh'), silently colliding with an actual zh row — this must not.
      expect(normalizeTargetLang('english')).toBe('english')
      expect(normalizeTargetLang(' Spanish ')).toBe('spanish')
    })

    it('passes an unrecognized 3-letter code through unchanged', () => {
      expect(normalizeTargetLang('jam')).toBe('jam')
      expect(normalizeTargetLang('FIL-PH')).toBe('fil-ph')
    })

    it('returns undefined for a blank or whitespace-only token instead of an empty-string language', () => {
      expect(normalizeTargetLang('')).toBeUndefined()
      expect(normalizeTargetLang('   ')).toBeUndefined()
    })
  })

  describe('resolveTargetLanguages', () => {
    it('should return explicit languages when provided', () => {
      expect(resolveTargetLanguages(['en', 'ja'], ['ko'])).toEqual(['en', 'ja'])
    })

    it('should fallback to configured when explicit is empty', () => {
      expect(resolveTargetLanguages([], ['ko', 'ja'])).toEqual(['ko', 'ja'])
    })

    it('should fallback to configured when explicit is undefined', () => {
      expect(resolveTargetLanguages(undefined, ['zh'])).toEqual(['zh'])
    })

    it('should return empty array when both are undefined', () => {
      expect(resolveTargetLanguages(undefined, undefined)).toEqual([])
    })

    it('should return empty array when both are empty', () => {
      expect(resolveTargetLanguages([], [])).toEqual([])
    })
  })
})
