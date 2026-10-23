import { Tag as LobeTag } from '@lobehub/ui'
import type { ReactNode } from 'react'

export interface TagProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Tag(props: TagProps) {
  return (
    <LobeTag className={props.className} title={props.title}>
      {props.children}
    </LobeTag>
  )
}
