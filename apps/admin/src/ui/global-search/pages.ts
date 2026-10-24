import type { LucideIcon } from 'lucide-react'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'

import type { TranslationKey } from '~/i18n/types'

export interface SearchPage {
  /** What this page is for. Shown under the title; never the sidebar group name. */
  description?: string
  group: string
  href: string
  icon?: LucideIcon
  title: string
}

export interface SearchResultGroup {
  label: string
  pages: SearchPage[]
}

type Translate = (key: TranslationKey) => string

const isNavigable = (path: string) => !path.includes(':') && !path.includes('*')

/**
 * Hidden static pages stay in search. Byline hides real destinations (the
 * editor, AI tabs) from the sidebar; detail routes have no title and drop out.
 */
export const collectSearchPages = (
  sections: readonly SidebarSection[],
  t: Translate,
): SearchPage[] => {
  const pages: SearchPage[] = []

  const walk = (node: SidebarNode, group: string, inherited?: LucideIcon) => {
    const icon = node.route.icon ?? inherited
    if (isNavigable(node.route.path) && node.route.titleKey) {
      pages.push({
        description: node.route.descriptionKey
          ? t(node.route.descriptionKey)
          : undefined,
        group,
        href: node.route.path,
        icon,
        title: t(node.route.titleKey),
      })
    }
    for (const child of node.children ?? []) walk(child, group, icon)
  }

  for (const section of sections) {
    const group = section.titleKey ? t(section.titleKey) : ''
    for (const node of section.items) walk(node, group)
  }

  return pages
}

const queryTerms = (query: string): string[] =>
  query.trim().toLowerCase().split(/\s+/).filter(Boolean)

export const pageMatches = (page: SearchPage, query: string): boolean => {
  const terms = queryTerms(query)
  if (terms.length === 0) return true
  const haystack =
    `${page.title}\n${page.description ?? ''}\n${page.group}\n${page.href}`.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export const filterSearchPages = (
  pages: readonly SearchPage[],
  query: string,
): SearchPage[] => {
  if (queryTerms(query).length === 0) return [...pages]
  return pages.filter((page) => pageMatches(page, query))
}

export const groupSearchPages = (
  pages: readonly SearchPage[],
  query: string,
  ungroupedLabel: string,
): SearchResultGroup[] => {
  const groups: SearchResultGroup[] = []

  for (const page of filterSearchPages(pages, query)) {
    const label = page.group || ungroupedLabel
    const last = groups.at(-1)
    const group = last?.label === label ? last : { label, pages: [] }
    if (group !== last) groups.push(group)
    group.pages.push(page)
  }

  return groups
}
