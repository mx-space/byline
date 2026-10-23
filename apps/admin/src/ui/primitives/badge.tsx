import { Tag } from '@lobehub/ui'
import type { ReactNode } from 'react'

export type BadgeTone =
  'accent' | 'danger' | 'info' | 'neutral' | 'success' | 'warning'

export type BadgeSize = 'md' | 'sm'

export type BadgeVariant = 'bordered' | 'outline' | 'soft'

export interface BadgeProps {
  children: ReactNode
  className?: string
  pill?: boolean
  size?: BadgeSize
  title?: string
  tone?: BadgeTone
  variant?: BadgeVariant
  'data-testid'?: string
}

const toneColor: Record<BadgeTone, string | undefined> = {
  accent: 'blue',
  danger: 'error',
  info: 'blue',
  neutral: undefined,
  success: 'success',
  warning: 'warning',
}

export function Badge(props: BadgeProps) {
  return (
    <Tag
      className={props.className}
      color={toneColor[props.tone ?? 'neutral']}
      data-testid={props['data-testid']}
      shape={props.pill ? 'round' : 'normal'}
      size={props.size === 'sm' ? 'small' : 'middle'}
      title={props.title}
      variant={props.variant === 'outline' ? 'outlined' : 'filled'}
    >
      {props.children}
    </Tag>
  )
}
