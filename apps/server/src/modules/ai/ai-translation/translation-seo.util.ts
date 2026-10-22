import { md5 } from '~/utils/tool.util'

import type { PostSeo } from '../../post/post.types'

const SEO_TEXT_KEYS = ['title', 'description'] as const
const SEO_KEYS = ['title', 'description', 'image'] as const

type SeoTextKey = (typeof SEO_TEXT_KEYS)[number]

const hasValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

export function pickSeoText(
  seo: PostSeo | null | undefined,
): Partial<Record<SeoTextKey, string>> {
  const fields: Partial<Record<SeoTextKey, string>> = {}
  for (const key of SEO_TEXT_KEYS) {
    const value = seo?.[key]
    if (hasValue(value)) fields[key] = value
  }
  return fields
}

export function hashSeoText(fields: Partial<Record<SeoTextKey, string>>) {
  return md5(JSON.stringify(SEO_TEXT_KEYS.map((key) => fields[key] ?? null)))
}

export function readSeoSourceHash(sourceMetaHashes: unknown) {
  const value = (sourceMetaHashes as { seo?: unknown } | null | undefined)?.seo
  return typeof value === 'string' ? value : undefined
}

export function collectTranslatedSeo(
  fields: Partial<Record<SeoTextKey, string>>,
  translations: Record<string, unknown> | undefined,
): PostSeo | null {
  const seo: PostSeo = {}
  for (const key of Object.keys(fields) as SeoTextKey[]) {
    const value = translations?.[key]
    if (hasValue(value)) seo[key] = value.trim()
  }
  return Object.keys(seo).length ? seo : null
}

export function mergeTranslatedSeo(
  source: PostSeo | null | undefined,
  translated: PostSeo | null | undefined,
): PostSeo | null {
  if (!translated) return source ?? null
  const merged: PostSeo = { ...source }
  for (const key of SEO_KEYS) {
    const value = translated[key]
    if (hasValue(value)) merged[key] = value
  }
  return Object.keys(merged).length ? merged : null
}
