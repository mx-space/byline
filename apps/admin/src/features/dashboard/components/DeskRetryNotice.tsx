import { Alert } from '@lobehub/ui'

import { Button } from '~/ui/site-button'

export function DeskRetryNotice(props: {
  fetching: boolean
  message: string
  onRetry: () => void
  retryLabel: string
  tone?: 'error' | 'warning'
}) {
  return (
    <Alert
      action={
        <Button loading={props.fetching} onClick={props.onRetry} type="default">
          {props.retryLabel}
        </Button>
      }
      showIcon
      title={props.message}
      type={props.tone ?? 'error'}
    />
  )
}
