import { ContextMenuHost } from '@lobehub/ui'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import type { PropsWithChildren } from 'react'

import { jotaiStore } from '~/store/jotai-store'
import { ModalRoot } from '~/ui/feedback/modal-imperative'

import { I18nProvider } from './i18n'
import { AppTheme } from './layouts/app-theme'
import { queryClient } from './query-client'

export function AppProviders(props: PropsWithChildren) {
  return (
    <JotaiProvider store={jotaiStore}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AppTheme>
            {props.children}
            <ModalRoot />
            <ContextMenuHost />
          </AppTheme>
        </I18nProvider>
      </QueryClientProvider>
    </JotaiProvider>
  )
}
