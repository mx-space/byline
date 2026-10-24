import { createStaticStyles, Drawer as LobeDrawer } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '~/utils/cn'

const styles = createStaticStyles(({ css }) => ({
  icon: css`
    flex-shrink: 0;
  `,
  title: css`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  `,
  titleText: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

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
          <span className={styles.title}>
            {Icon ? (
              <Icon aria-hidden="true" className={styles.icon} size={16} />
            ) : null}
            <span
              className={styles.titleText}
              title={typeof props.title === 'string' ? props.title : undefined}
            >
              {props.title}
            </span>
          </span>
        ) : undefined
      }
      width={props.widthClassName ? undefined : 'min(90vw, 28.125rem)'}
    >
      <div className={props.bodyClassName}>{props.children}</div>
    </LobeDrawer>
  )
}
