import type { Locale } from './types'

export type FeatureCatalog<K extends string> = Record<K, Record<Locale, string>>

export function createFeatureCopy<K extends string>(
  catalog: FeatureCatalog<K>,
) {
  return function featureCopy(
    locale: Locale,
    key: K,
    values?: Record<string, number | string>,
  ): string {
    const template = catalog[key][locale] ?? catalog[key]['zh-CN']
    if (!values) return template
    return template.replaceAll(/\{(\w+)\}/g, (match, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : match,
    )
  }
}
