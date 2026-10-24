import { Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { createHashRouter, Navigate, Outlet } from 'react-router'
import type { AppRoute, RedirectEntry } from 'virtual:admin-routes'
import { publicRoutes, redirects, shellRoutes } from 'virtual:admin-routes'

import { DocumentTitleSync } from './hooks/use-document-title'
import { useI18n } from './i18n'
import { ProtectedLayout } from './layouts/protected-layout'
import { LegacyStaticRedirect } from './lib/legacy-redirects'
import { PageLoadingFrame } from './ui/page'

function toRouteObject(route: AppRoute): RouteObject {
  return {
    path: route.path,
    Component: route.element,
    children: route.children?.map(toRouteObject),
  }
}

function redirectToRouteObject(entry: RedirectEntry): RouteObject | null {
  if (entry.to) {
    return {
      path: entry.from,
      element: <LegacyStaticRedirect to={entry.to} />,
    }
  }
  if (entry.element) {
    return { path: entry.from, Component: entry.element }
  }
  return null
}

function RootLayout() {
  return (
    <>
      <DocumentTitleSync />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </>
  )
}

function RouteLoadingFallback() {
  const { t } = useI18n()
  return <PageLoadingFrame label={t('common.loading')} />
}

const routeTree: RouteObject[] = [
  {
    Component: RootLayout,
    children: [
      ...publicRoutes.map(toRouteObject),
      ...redirects
        .map(redirectToRouteObject)
        .filter((entry): entry is RouteObject => entry !== null),
      {
        Component: ProtectedLayout,
        children: [
          { index: true, element: <Navigate replace to="/dashboard" /> },
          ...shellRoutes.map(toRouteObject),
          { path: '*', element: <Navigate replace to="/dashboard" /> },
        ],
      },
    ],
  },
]

export const appRouter = createHashRouter(routeTree)
