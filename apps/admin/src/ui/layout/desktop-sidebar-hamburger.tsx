import { createStaticStyles } from '@lobehub/ui'
import { useAtom } from 'jotai'
import { PanelLeftOpen } from 'lucide-react'

import { useI18n } from '~/i18n'
import { sidebarCollapsedAtom } from '~/ui/layout/sidebar-layout'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u1fd4aed9: css`
    &:focus-visible {
      outline: none;
    }
    margin-left: calc(0.375rem * -1);
    display: none;
    width: 2.25rem;
    height: 2.25rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 15%, transparent);
    }
    @media (min-width: 1024px) {
      display: inline-flex;
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

interface Props {
  className?: string
}

export function DesktopSidebarHamburger(props: Props) {
  const [collapsed, setCollapsed] = useAtom(sidebarCollapsedAtom)
  const { t } = useI18n()
  if (!collapsed) return null

  return (
    <button
      aria-label={t('ui.layout.expandSidebar')}
      className={cn(lobeStyles.u1fd4aed9, props.className)}
      onClick={() => setCollapsed(false)}
      title={t('ui.layout.expandSidebar')}
      type="button"
    >
      <PanelLeftOpen aria-hidden="true" className={lobeStyles.uf7b5fa97} />
    </button>
  )
}
