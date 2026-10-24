import { Alert } from '@lobehub/ui'
import type { ReactNode } from 'react'

import { Button } from '~/ui/site-button'

import { authStyles } from './auth-styles'

export function StatusAlert(props: {
  action?: ReactNode
  description?: string
  onRetry?: () => void
  retryLabel?: string
  title: string
  type?: 'error' | 'warning'
}) {
  const retry = props.onRetry ? (
    <Button
      className={authStyles.method}
      htmlType="button"
      onClick={props.onRetry}
      size="large"
      type="default"
    >
      {props.retryLabel}
    </Button>
  ) : null

  return (
    <Alert
      action={props.action ?? retry ?? undefined}
      className={authStyles.notice}
      description={props.description}
      showIcon
      title={props.title}
      type={props.type ?? 'error'}
    />
  )
}
