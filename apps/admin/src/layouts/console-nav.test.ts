import { Files, FileText, Gauge, Settings, Sparkles } from 'lucide-react'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'
import { describe, expect, it } from 'vitest'

import {
  artefactWriteBreadcrumb,
  productDetailBreadcrumb,
  toBreadcrumbItems,
  toConsoleNavigation,
  withDetailCrumb,
  withParentCrumb,
} from './console-nav'

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

describe('withDetailCrumb', () => {
  it('links the list and names the detail page', () => {
    expect(
      withDetailCrumb(
        [
          { label: 'shell.nav.system', optional: true },
          { label: 'routes.users.title' },
        ],
        '/users',
        'routes.users.detail',
      ),
    ).toEqual([
      { label: 'shell.nav.system', optional: true },
      { href: '/users', label: 'routes.users.title' },
      { label: 'routes.users.detail' },
    ])
  })
})

describe('productDetailBreadcrumb', () => {
  it('links the category list and names the article', () => {
    expect(
      productDetailBreadcrumb(
        '/ai/translation/post-1',
        '?q=lobe&item=abc&lang=zh-CN',
        'Towards LobeHub',
        t,
      ),
    ).toEqual([
      { label: 'shell.nav.intelligence', optional: true },
      { href: '/ai/translation?q=lobe', label: 'routes.aiTranslation.title' },
      { label: 'Towards LobeHub' },
    ])
  })

  it('stays off the category list itself', () => {
    expect(productDetailBreadcrumb('/ai/overview', '', 'Post', t)).toBeNull()
  })
})

describe('artefactWriteBreadcrumb', () => {
  it('links the translation detail for this post', () => {
    expect(
      artefactWriteBreadcrumb('?id=post-1&translationId=tr-1', '译文标题', t),
    ).toEqual([
      { label: 'shell.nav.intelligence', optional: true },
      { href: '/ai/translation/post-1', label: 'routes.aiTranslation.title' },
      { label: '译文标题' },
    ])
  })

  it('links the summary and close-reading details', () => {
    expect(
      artefactWriteBreadcrumb('?id=post-1&summaryId=s-1', '文章', t),
    ).toEqual([
      { label: 'shell.nav.intelligence', optional: true },
      { href: '/ai/summary/post-1', label: 'routes.aiSummary.title' },
      { label: '文章' },
    ])
    expect(
      artefactWriteBreadcrumb('?id=post-1&insightsId=i-1', '文章', t),
    ).toEqual([
      { label: 'shell.nav.intelligence', optional: true },
      { href: '/ai/insights/post-1', label: 'routes.aiInsights.title' },
      { label: '文章' },
    ])
  })

  it('stays off a normal post editor', () => {
    expect(artefactWriteBreadcrumb('?id=post-1', 'Draft', t)).toBeNull()
  })
})

describe('withParentCrumb', () => {
  it('puts a link to the list before the current page', () => {
    expect(
      withParentCrumb(
        [
          { label: 'shell.nav.content', optional: true },
          { label: 'routes.writePost.title' },
        ],
        { href: '/posts', label: 'routes.posts.title' },
      ),
    ).toEqual([
      { label: 'shell.nav.content', optional: true },
      { href: '/posts', label: 'routes.posts.title' },
      { label: 'routes.writePost.title' },
    ])
  })

  it('leaves a trail that already links to the parent', () => {
    const items = [
      { href: '/posts', label: 'routes.posts.title' },
      { label: 'routes.writePost.title' },
    ]
    expect(withParentCrumb(items, { href: '/posts', label: '文章' })).toBe(
      items,
    )
  })
})
