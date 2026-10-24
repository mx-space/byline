import { FileText, Gauge, Pencil } from 'lucide-react'
import type { SidebarNode, SidebarSection } from 'virtual:admin-routes'
import { describe, expect, it } from 'vitest'

import {
  collectSearchPages,
  filterSearchPages,
  groupSearchPages,
} from './pages'

const t = (key: string) => key

function node(
  path: string,
  titleKey: SidebarNode['route']['titleKey'],
  extra?: {
    children?: SidebarNode[]
    descriptionKey?: SidebarNode['route']['descriptionKey']
    hidden?: boolean
    icon?: SidebarNode['route']['icon']
  },
): SidebarNode {
  return {
    children: extra?.children,
    route: {
      descriptionKey: extra?.descriptionKey,
      element: () => null,
      hidden: extra?.hidden,
      icon: extra?.icon,
      layout: 'shell',
      path,
      titleKey,
    },
  }
}

const sections: SidebarSection[] = [
  {
    items: [
      node('/dashboard', 'routes.dashboard.title', {
        descriptionKey: 'routes.dashboard.description',
        icon: Gauge,
      }),
    ],
    order: 0,
  },
  {
    items: [
      node('/posts', 'routes.posts.title', {
        children: [
          node('/posts/:id', undefined),
          node('/posts/edit', 'routes.writePost.title', {
            hidden: true,
            icon: Pencil,
          }),
        ],
        descriptionKey: 'routes.posts.description',
        icon: FileText,
      }),
    ],
    order: 1,
    titleKey: 'shell.nav.content',
  },
]

describe('collectSearchPages', () => {
  it('keeps titled pages, including hidden destinations, and drops detail routes', () => {
    const pages = collectSearchPages(sections, t)

    expect(pages.map((page) => page.href)).toEqual([
      '/dashboard',
      '/posts',
      '/posts/edit',
    ])
    expect(pages[0]).toMatchObject({
      description: 'routes.dashboard.description',
      group: '',
      icon: Gauge,
      title: 'routes.dashboard.title',
    })
    expect(pages[2]).toMatchObject({
      group: 'shell.nav.content',
      icon: Pencil,
      title: 'routes.writePost.title',
    })
  })
})

describe('groupSearchPages', () => {
  const pages = collectSearchPages(sections, t)

  it('labels the ungrouped dashboard and keeps section order', () => {
    expect(
      groupSearchPages(pages, '', 'Pages').map((group) => group.label),
    ).toEqual(['Pages', 'shell.nav.content'])
  })

  it('requires every term to match the title, description, group, or path', () => {
    expect(
      filterSearchPages(pages, 'write content').map((page) => page.href),
    ).toEqual(['/posts/edit'])
    expect(
      filterSearchPages(pages, 'missing').map((page) => page.href),
    ).toEqual([])
    expect(groupSearchPages(pages, 'dashboard', 'Pages')).toEqual([
      {
        label: 'Pages',
        pages: [pages[0]],
      },
    ])
  })
})
