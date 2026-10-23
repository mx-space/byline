import { Drawer } from '@lobehub/ui'
import type { ReactNode } from 'react'

export function DetailDrawer(props: {
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  title: ReactNode
}) {
  return (
    <Drawer
      footer={props.footer}
      onClose={props.onClose}
      open
      placement="right"
      styles={{ bodyContent: { height: '100%', padding: 0 } }}
      title={props.title}
      width="min(760px, 100%)"
    >
      {props.children}
    </Drawer>
  )
}
