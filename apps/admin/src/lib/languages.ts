import { normalizeTargetLang } from './lang'

export const COMMON_LANGUAGE_CODES = [
  'en',
  'en-US',
  'en-GB',
  'zh-CN',
  'zh-TW',
  'zh-HK',
  'ja',
  'ko',
  'fr',
  'de',
  'es',
  'es-419',
  'pt-BR',
  'pt-PT',
  'it',
  'nl',
  'ru',
  'uk',
  'pl',
  'tr',
  'ar',
  'fa',
  'he',
  'hi',
  'bn',
  'id',
  'ms',
  'th',
  'vi',
  'sv',
  'da',
  'no',
  'fi',
  'cs',
  'el',
  'ro',
  'hu',
] as const

const LANGUAGE_CODE_RE = /^[a-z]{2,3}(?:-[\da-z]{2,8})*$/i

export function canonicalizeLanguageCode(raw: string): string | null {
  const normalized = normalizeTargetLang(raw)
  if (!normalized || !LANGUAGE_CODE_RE.test(normalized)) return null
  return normalized
}

export function formatLanguageLabel(code: string, displayLocale: string) {
  try {
    const name = new Intl.DisplayNames([displayLocale], {
      type: 'language',
    }).of(code)
    return name && name !== code ? `${name} (${code})` : code
  } catch {
    return code
  }
}

export function buildLanguageOptions(
  displayLocale: string,
  extra: Array<string | null | undefined> = [],
) {
  const codes = [...COMMON_LANGUAGE_CODES] as string[]
  for (const code of extra) {
    if (code && !codes.includes(code)) codes.unshift(code)
  }
  return codes.map((code) => ({
    label: formatLanguageLabel(code, displayLocale),
    value: code,
  }))
}
