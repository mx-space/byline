import { normalizeTargetLang as normalizeSharedTargetLang } from '@mx-space/ai'

import { parseAcceptLanguage } from '~/utils/lang.util'

import { DEFAULT_SUMMARY_LANG, LANGUAGE_CODE_TO_NAME } from './ai.constants'

export const normalizeTargetLang = (lang: string): string | undefined =>
  normalizeSharedTargetLang(lang, { foldRegion: false })

export function normalizeTargetLangs(langs?: string[] | null): string[] {
  return [
    ...new Set(
      (langs ?? [])
        .map((lang) => normalizeTargetLang(lang))
        .filter((lang): lang is string => lang !== undefined),
    ),
  ]
}

/**
 * Extract the primary language code from an Accept-Language header or a language code.
 * Examples: "en-US,en;q=0.9" -> "en", "zh-CN" -> "zh", "jp" -> "ja"
 *
 * Codes unknown to the alias tables (e.g. "fil", "yue") fall back to the
 * lowercased base segment instead of the default, so valid ISO codes are
 * never silently collapsed to DEFAULT_SUMMARY_LANG.
 */
export function parseLanguageCode(lang?: string): string {
  const normalized = parseAcceptLanguage(lang)
  if (normalized) return normalized

  const base = lang
    ?.split(',')[0]
    ?.split(';')[0]
    ?.trim()
    .split('-')[0]
    ?.toLowerCase()
  if (base && /^[a-z]{2,3}$/.test(base)) return base

  return DEFAULT_SUMMARY_LANG
}

const REGIONAL_LANGUAGE_NAMES: Record<string, string> = {
  'zh-CN': 'Simplified Chinese',
  'zh-Hans': 'Simplified Chinese',
  'zh-SG': 'Simplified Chinese',
  'zh-TW': 'Traditional Chinese (Taiwan)',
  'zh-HK': 'Traditional Chinese (Hong Kong)',
  'zh-Hant': 'Traditional Chinese',
  'pt-BR': 'Brazilian Portuguese',
  'pt-PT': 'European Portuguese',
}

export function getLanguageName(langCode: string): string {
  const exact =
    LANGUAGE_CODE_TO_NAME[langCode] ?? REGIONAL_LANGUAGE_NAMES[langCode]
  if (exact) return exact
  const [base, ...subtags] = langCode.split('-')
  const baseName = LANGUAGE_CODE_TO_NAME[base]
  return baseName && subtags.length
    ? `${baseName} (${subtags.join('-')})`
    : langCode
}

export function resolveTargetLanguages(
  explicit?: string[],
  configured?: string[],
): string[] {
  return explicit?.length ? explicit : (configured ?? [])
}

export function resolveArticleSourceLang(document: {
  sourceLang?: string | null
  meta?: Record<string, unknown> | null
}): string {
  const raw = document.sourceLang || document.meta?.lang
  return typeof raw === 'string' && raw.trim()
    ? parseLanguageCode(raw)
    : DEFAULT_SUMMARY_LANG
}
