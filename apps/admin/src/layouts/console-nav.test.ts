import { Files, FileText, Gauge, Settings, Sparkles } from 'lucide-react'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'
import { describe, expect, it } from 'vitest'

import { toBreadcrumbItems, toConsoleNavigation } from './console-nav'

const t = (key: string) => key

function node(
  path: string,
  titleKey: SidebarNode['route']['titleKey'],
  extra?: {
    children?: SidebarNode[]
    hidden?: boolean
    icon?: SidebarNode['route']['icon']
  },
): SidebarNode {
  return {
    children: extra?.children,
    route: {
      element: () => null,
      layout: 'shell',
      path,
      titleKey,
      hidden: extra?.hidden,
      icon: extra?.icon,
    },
  }
}

describe('toConsoleNavigation', () => {
  it('keeps the dashboard as a top item and flattens a section into one group', () => {
    const sections: SidebarSection[] = [
      {
        items: [node('/dashboard', 'routes.dashboard.title', { icon: Gauge })],
        order: 0,
      },
      {
        items: [
          node('/posts', 'routes.posts.title', {
            children: [
              node('/posts/edit', 'routes.writePost.title'),
              node('/posts/hidden', 'routes.posts.title', { hidden: true }),
            ],
          }),
        ],
        order: 1,
        titleKey: 'shell.nav.content',
      },
    ]

    const nav = toConsoleNavigation(sections, t)

    expect(nav.items).toEqual([
      {
        href: '/dashboard',
        icon: Gauge,
        label: 'routes.dashboard.title',
      },
    ])
    expect(nav.groups).toEqual([
      {
        icon: FileText,
        items: [
          { href: '/posts', label: 'routes.posts.title' },
          { href: '/posts/edit', label: 'routes.writePost.title' },
        ],
        key: 'shell.nav.content',
        label: 'shell.nav.content',
      },
    ])
    expect(nav.dividerBefore).toEqual([])
  })

  it('promotes children of a hidden parent and divides later clusters', () => {
    const sections: SidebarSection[] = [
      {
        items: [node('/posts', 'routes.posts.title')],
        order: 1,
        titleKey: 'shell.nav.content',
      },
      {
        items: [
          node('/ai', 'routes.ai.title', {
            hidden: true,
            children: [node('/ai/overview', 'routes.aiOverview.title')],
          }),
        ],
        order: 2,
        titleKey: 'shell.nav.intelligence',
      },
      {
        items: [node('/files', 'routes.files.title')],
        order: 3,
        titleKey: 'shell.nav.assets',
      },
      {
        items: [node('/users', 'routes.users.title')],
        order: 4,
        titleKey: 'shell.nav.system',
      },
    ]

    const nav = toConsoleNavigation(sections, t)

    expect(nav.groups.map((group) => group.key)).toEqual([
      'shell.nav.content',
      'shell.nav.intelligence',
      'shell.nav.assets',
      'shell.nav.system',
    ])
    expect(nav.groups.map((group) => group.icon)).toEqual([
      FileText,
      Sparkles,
      Files,
      Settings,
    ])
    expect(nav.groups[1]?.items).toEqual([
      { href: '/ai/overview', label: 'routes.aiOverview.title' },
    ])
    expect(nav.dividerBefore).toEqual([
      'shell.nav.intelligence',
      'shell.nav.assets',
    ])
  })
})

describe('toBreadcrumbItems', () => {
  it('uses the longest matching route and drops hidden nodes', () => {
    const sections: SidebarSection[] = [
      {
        items: [
          node('/posts', 'routes.posts.title'),
          node('/posts/category', 'routes.categories.title', {
            children: [
              node('/posts/category/:id', 'routes.categories.title', {
                hidden: true,
              }),
            ],
          }),
        ],
        order: 1,
        titleKey: 'shell.nav.content',
      },
    ]

    expect(toBreadcrumbItems(sections, '/posts/category/1', t)).toEqual([
      { label: 'shell.nav.content', optional: true },
      { label: 'routes.categories.title' },
    ])
  })
})
