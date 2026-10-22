const PRIMARY_ALIASES: Record<string, string> = {
  jp: 'ja',
  kr: 'ko',
  iw: 'he',
  in: 'id',
  nb: 'no',
  nn: 'no',
}

const TAG_ALIASES: Record<string, string> = {
  cn: 'zh-CN',
  tw: 'zh-TW',
}

const ISO_639_2_TO_1: Record<string, string> = {
  eng: 'en',
  zho: 'zh',
  chi: 'zh',
  jpn: 'ja',
  kor: 'ko',
  fra: 'fr',
  fre: 'fr',
  deu: 'de',
  ger: 'de',
  spa: 'es',
  por: 'pt',
  rus: 'ru',
  ita: 'it',
  nld: 'nl',
  dut: 'nl',
  swe: 'sv',
  dan: 'da',
  fin: 'fi',
  nor: 'no',
}

function formatSubtag(subtag: string): string {
  if (subtag.length === 2) return subtag.toUpperCase()
  if (subtag.length === 4 && /^[a-z]+$/.test(subtag)) {
    return subtag[0].toUpperCase() + subtag.slice(1)
  }
  return subtag
}

export const normalizeTargetLang = (lang: string): string | undefined => {
  const normalized = lang.trim().toLowerCase().replaceAll('_', '-')
  if (!normalized) return undefined

  const tagAlias = TAG_ALIASES[normalized]
  if (tagAlias) return tagAlias

  const [rawPrimary, ...rest] = normalized.split('-').filter(Boolean)
  if (!rawPrimary) return undefined
  const primary =
    PRIMARY_ALIASES[rawPrimary] ?? ISO_639_2_TO_1[rawPrimary] ?? rawPrimary

  return [primary, ...rest.map(formatSubtag)].join('-')
}
