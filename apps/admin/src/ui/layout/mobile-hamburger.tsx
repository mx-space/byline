import { createStaticStyles } from '@lobehub/ui'
import { Menu } from 'lucide-react'

import { useI18n } from '~/i18n'
import { useShellNav } from '~/ui/layout/shell-nav-context'
import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u0f4e562c: css`
    display: inline-flex;
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
    @media (min-width: 1024px) {
      display: none;
    }
    :where(.dark, .dark *) &:hover {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

interface MobileHamburgerProps {
  className?: string
}

export function MobileHamburger(props: MobileHamburgerProps) {
  const shellNav = useShellNav()
  const { t } = useI18n()
  if (!shellNav) return null

  return (
    <button
      aria-label={t('common.openNavigation')}
      className={cn(lobeStyles.u0f4e562c, props.className)}
      onClick={() => shellNav.toggle()}
      type="button"
    >
      <Menu aria-hidden="true" className={lobeStyles.uf7b5fa97} />
    </button>
  )
}
