import { PageTabs } from '@lobehub/ui/dashboard'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'

export interface RouteTab {
  count?: ReactNode
  /** Also active for paths below this one. */
  href: string
  label: string
}

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Page-level tabs where each tab is its own route. The longest matching href
 * wins, so `/files` and `/files/orphans` can sit side by side.
 */
export function RouteTabs(props: {
  className?: string
  label: string
  tabs: RouteTab[]
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const active =
    [...props.tabs]
      .sort((a, b) => b.href.length - a.href.length)
      .find((tab) => matches(location.pathname, tab.href))?.href ??
    props.tabs[0]?.href ??
    ''

  return (
    <PageTabs
      className={props.className}
      label={props.label}
      onChange={(href) => {
        if (href !== active) navigate(href)
      }}
      tabs={props.tabs.map((tab) => ({
        content: null,
        count: tab.count,
        label: tab.label,
        value: tab.href,
      }))}
      value={active}
    />
  )
}
