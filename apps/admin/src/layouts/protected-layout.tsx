import { createStaticStyles } from '@lobehub/ui'
import { PageLoading } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { checkLogged } from '~/api/users'
import { loggedStatusQueryKey } from '~/features/auth/constants'
import { PublishProcessDock } from '~/features/write/components/PublishProcessDock'
import { useI18n } from '~/i18n'
import { AdminShell, LayoutLoading } from '~/shell'
import { SocketBridge } from '~/socket/SocketBridge'
import { CommandPaletteProvider } from '~/ui/command-palette'
import { KeyboardShortcutsProvider } from '~/ui/keyboard-shortcut-overlay'

const styles = createStaticStyles(({ css, responsive }) => ({
  loader: css`
    height: 100%;
    padding-block: 28px 40px;
    padding-inline: 32px;

    ${responsive.md} {
      padding-block: 16px 24px;
      padding-inline: 16px;
    }
  `,
}))

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
      <CommandPaletteProvider>
        <AdminShell>
          <SocketBridge />
          <Suspense fallback={<ShellContentLoader />}>
            <Outlet />
          </Suspense>
          <PublishProcessDock />
        </AdminShell>
      </CommandPaletteProvider>
    </KeyboardShortcutsProvider>
  )
}

function ShellContentLoader() {
  const { t } = useI18n()
  return (
    <div className={styles.loader}>
      <PageLoading label={t('common.loading')} />
    </div>
  )
}
