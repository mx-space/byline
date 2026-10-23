import { Empty } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Empty
      action={action}
      className={className}
      description={description}
      icon={icon}
      title={title}
    />
  )
}
