import type {
  BreadcrumbItem,
  ConsoleNavGroup,
  ConsoleNavItem,
} from '@lobehub/ui/dashboard'
import {
  Files,
  FileText,
  type LucideIcon,
  Settings,
  Sparkles,
} from 'lucide-react'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'

import type { TranslationKey } from '~/i18n/types'

type Translate = (key: TranslationKey) => string

const GROUP_ICON: Partial<Record<TranslationKey, LucideIcon>> = {
  'shell.nav.assets': Files,
  'shell.nav.content': FileText,
  'shell.nav.intelligence': Sparkles,
  'shell.nav.system': Settings,
}

// Top items already draw a line under the dashboard. These keys start the
// next job cluster: checking AI output, then maintaining the site.
const DIVIDER_BEFORE = new Set<TranslationKey>([
  'shell.nav.intelligence',
  'shell.nav.assets',
])

function labelOf(node: SidebarNode, t: Translate) {
  return node.route.titleKey ? t(node.route.titleKey) : node.route.path
}

type Badges = Partial<Record<string, number>>

function withBadge(item: ConsoleNavItem, badges: Badges): ConsoleNavItem {
  const badge = badges[item.href]
  return badge ? { ...item, badge } : item
}

function collectItems(
  node: SidebarNode,
  t: Translate,
  badges: Badges,
): ConsoleNavItem[] {
  const children = (node.children ?? []).flatMap((child) =>
    collectItems(child, t, badges),
  )
  if (node.route.hidden) return children
  return [
    withBadge({ href: node.route.path, label: labelOf(node, t) }, badges),
    ...children,
  ]
}

export function toConsoleNavigation(
  sections: SidebarSection[],
  t: Translate,
  badges: Badges = {},
): {
  dividerBefore: string[]
  groups: ConsoleNavGroup[]
  items: ConsoleNavItem[]
} {
  const items: ConsoleNavItem[] = []
  const groups: ConsoleNavGroup[] = []
  const dividerBefore: string[] = []

  for (const section of sections) {
    if (!section.titleKey) {
      for (const node of section.items) {
        if (node.route.hidden) {
          items.push(...collectItems(node, t, badges))
          continue
        }
        items.push(
          withBadge(
            {
              href: node.route.path,
              label: labelOf(node, t),
              ...(node.route.icon ? { icon: node.route.icon } : {}),
            },
            badges,
          ),
        )
        for (const child of node.children ?? []) {
          items.push(...collectItems(child, t, badges))
        }
      }
      continue
    }

    const leaves = section.items.flatMap((node) =>
      collectItems(node, t, badges),
    )
    if (leaves.length === 0) continue

    const icon = GROUP_ICON[section.titleKey]
    if (DIVIDER_BEFORE.has(section.titleKey)) {
      dividerBefore.push(section.titleKey)
    }
    groups.push({
      items: leaves,
      key: section.titleKey,
      label: t(section.titleKey),
      ...(icon ? { icon } : {}),
    })
  }

  return { dividerBefore, groups, items }
}

interface CrumbChain {
  nodes: SidebarNode[]
  section?: SidebarSection
}

function findCrumbChain(
  sections: SidebarSection[],
  pathname: string,
): CrumbChain | null {
  let best: CrumbChain | null = null
  let bestLength = -1

  const visit = (
    section: SidebarSection,
    node: SidebarNode,
    ancestors: SidebarNode[],
  ) => {
    const path = node.route.path
    const matches = pathname === path || pathname.startsWith(`${path}/`)
    if (matches && path.length > bestLength) {
      bestLength = path.length
      best = { nodes: [...ancestors, node], section }
    }
    for (const child of node.children ?? []) {
      visit(section, child, [...ancestors, node])
    }
  }

  for (const section of sections) {
    for (const node of section.items) visit(section, node, [])
  }

  return best
}

export function toBreadcrumbItems(
  sections: SidebarSection[],
  pathname: string,
  t: Translate,
): BreadcrumbItem[] {
  const chain = findCrumbChain(sections, pathname)
  if (!chain) return []

  // A hidden leaf (the editor, a merged tab) still names the current page.
  const visible = chain.nodes.filter(
    (node, index) =>
      !node.route.hidden ||
      (index === chain.nodes.length - 1 && Boolean(node.route.titleKey)),
  )
  const crumbs: BreadcrumbItem[] = []

  if (chain.section?.titleKey) {
    crumbs.push({ label: t(chain.section.titleKey), optional: true })
  }

  visible.forEach((node, index) => {
    const last = index === visible.length - 1
    crumbs.push({
      href: last ? undefined : node.route.path,
      label: labelOf(node, t),
    })
  })

  return crumbs
}

/** Turn the current trail's last item into a link and append the detail page. */
export function withDetailCrumb(
  items: BreadcrumbItem[],
  parentHref: string,
  detailLabel: BreadcrumbItem['label'],
): BreadcrumbItem[] {
  const parent = items.at(-1)
  if (!parent) return [{ label: detailLabel }]
  return [
    ...items.slice(0, -1),
    { href: parent.href ?? parentHref, label: parent.label },
    { label: detailLabel },
  ]
}

const PRODUCT_LIST_TITLE = {
  insights: 'routes.aiInsights.title',
  overview: 'routes.aiOverview.title',
  summary: 'routes.aiSummary.title',
  translation: 'routes.aiTranslation.title',
  tts: 'routes.aiTts.title',
} as const satisfies Record<string, TranslationKey>

export function productDetailBreadcrumb(
  pathname: string,
  search: string,
  detailLabel: BreadcrumbItem['label'],
  t: Translate,
): BreadcrumbItem[] | null {
  const match =
    /^\/ai\/(overview|translation|summary|insights|tts)\/[^/]+$/.exec(pathname)
  if (!match) return null
  const segment = match[1] as keyof typeof PRODUCT_LIST_TITLE
  const params = new URLSearchParams(search)
  params.delete('item')
  params.delete('lang')
  const query = params.toString()
  return [
    { label: t('shell.nav.intelligence'), optional: true },
    {
      href: query ? `/ai/${segment}?${query}` : `/ai/${segment}`,
      label: t(PRODUCT_LIST_TITLE[segment]),
    },
    { label: detailLabel },
  ]
}

const WRITE_ARTEFACT = {
  insightsId: 'insights',
  summaryId: 'summary',
  translationId: 'translation',
} as const

export function artefactWriteBreadcrumb(
  search: string,
  detailLabel: BreadcrumbItem['label'],
  t: Translate,
): BreadcrumbItem[] | null {
  const params = new URLSearchParams(search)
  const postId = params.get('id')
  if (!postId) return null
  const key = (
    Object.keys(WRITE_ARTEFACT) as (keyof typeof WRITE_ARTEFACT)[]
  ).find((name) => params.get(name))
  if (!key) return null
  const segment = WRITE_ARTEFACT[key]
  return [
    { label: t('shell.nav.intelligence'), optional: true },
    {
      href: `/ai/${segment}/${postId}`,
      label: t(PRODUCT_LIST_TITLE[segment]),
    },
    { label: detailLabel },
  ]
}

export function withParentCrumb(
  items: BreadcrumbItem[],
  parent: { href: string; label: BreadcrumbItem['label'] },
): BreadcrumbItem[] {
  if (items.some((item) => item.href === parent.href)) return items
  const current = items.at(-1)
  const head = current ? items.slice(0, -1) : items
  return [
    ...head,
    { href: parent.href, label: parent.label },
    ...(current ? [{ label: current.label }] : []),
  ]
}
