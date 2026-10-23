import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

import { Page, RouteTabs } from '~/ui/page'

import { useAiCopy } from '../copy'

export function AiHubPage(props: {
  actions?: ReactNode
  children: ReactNode
  count?: ReactNode
}) {
  const copy = useAiCopy()
  return (
    <Page
      actions={props.actions}
      count={props.count}
      description={copy('hubDescription')}
      tabs={
        <RouteTabs
          label={copy('hubTabs')}
          tabs={[
            { href: '/ai/overview', label: copy('tabOverview') },
            { href: '/ai/translation', label: copy('tabTranslation') },
            { href: '/ai/summary', label: copy('tabSummary') },
            { href: '/ai/insights', label: copy('tabInsights') },
            { href: '/ai/tts', label: copy('tabTts') },
          ]}
        />
      }
      title={copy('hubTitle')}
      width="wide"
    >
      {props.children}
      <Outlet />
    </Page>
  )
}
