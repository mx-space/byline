import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { checkLogged } from '~/api/users'
import { loggedStatusQueryKey } from '~/features/auth/constants'
import { PublishProcessDock } from '~/features/write/components/PublishProcessDock'
import { useI18n } from '~/i18n'
import { AdminShell, LayoutLoading } from '~/shell'
import { SocketBridge } from '~/socket/SocketBridge'
import { KeyboardShortcutsProvider } from '~/ui/keyboard-shortcut-overlay'
import { PageLoadingFrame } from '~/ui/page'

export function ProtectedLayout() {
  const location = useLocation()
  const { t } = useI18n()
  const loggedQuery = useQuery({
    queryFn: checkLogged,
    queryKey: loggedStatusQueryKey,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })
  const from = `${location.pathname}${location.search}`

  if (loggedQuery.isLoading) {
    return <LayoutLoading label={t('app.loading.auth')} />
  }

  if (!loggedQuery.data?.ok) {
    return (
      <Navigate
        replace
        to={`/login?from=${encodeURIComponent(from || '/dashboard')}`}
      />
    )
  }

  return (
    <KeyboardShortcutsProvider>
      <AdminShell>
        <SocketBridge />
        <Suspense fallback={<ShellContentLoader />}>
          <Outlet />
        </Suspense>
        <PublishProcessDock />
      </AdminShell>
    </KeyboardShortcutsProvider>
  )
}

function ShellContentLoader() {
  const { t } = useI18n()
  return <PageLoadingFrame label={t('common.loading')} />
}
