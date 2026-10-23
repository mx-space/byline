import { Drawer as LobeDrawer } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '~/utils/cn'

type DrawerSide = 'left' | 'right'

export function Drawer(props: {
  bodyClassName?: string
  children: ReactNode
  className?: string
  footer?: ReactNode
  icon?: LucideIcon
  onClose: () => void
  open: boolean
  side?: DrawerSide
  showHeader?: boolean
  title: ReactNode
  widthClassName?: string
}) {
  const side: DrawerSide = props.side ?? 'right'
  const Icon = props.icon
  const showHeader = props.showHeader ?? true

  return (
    <LobeDrawer
      className={cn(props.widthClassName, props.className)}
      footer={props.footer}
      noHeader={!showHeader}
      onClose={props.onClose}
      open={props.open}
      placement={side}
      title={
        showHeader ? (
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {Icon ? <Icon aria-hidden="true" size={16} /> : null}
            <span>{props.title}</span>
          </span>
        ) : undefined
      }
      width={props.widthClassName ? undefined : 'min(90vw, 28.125rem)'}
    >
      <div className={props.bodyClassName}>{props.children}</div>
    </LobeDrawer>
  )
}
