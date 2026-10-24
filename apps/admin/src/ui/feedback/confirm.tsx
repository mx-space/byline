import { Button, createModal, ModalFooter, useModalContext } from '@lobehub/ui'
import type { ReactNode } from 'react'

import { translate } from '~/i18n/translate'

export interface ConfirmDialogOptions {
  title: ReactNode
  description?: ReactNode
  confirmText?: ReactNode
  cancelText?: ReactNode
  destructive?: boolean
}

function ConfirmActions(props: {
  cancelText: ReactNode
  confirmText: ReactNode
  destructive?: boolean
  onResolve: (value: boolean) => void
}) {
  const { close } = useModalContext()
  const choose = (value: boolean) => {
    props.onResolve(value)
    close()
  }

  return (
    <ModalFooter>
      <Button onClick={() => choose(false)}>{props.cancelText}</Button>
      <Button
        danger={props.destructive}
        onClick={() => choose(true)}
        type="primary"
      >
        {props.confirmText}
      </Button>
    </ModalFooter>
  )
}

/**
 * Imperative confirm dialog. Resolves true on confirm, false on cancel or dismiss.
 */
export function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    createModal({
      content: options.description,
      footer: (
        <ConfirmActions
          cancelText={options.cancelText ?? translate('common.cancel')}
          confirmText={options.confirmText ?? translate('common.confirm')}
          destructive={options.destructive}
          onResolve={finish}
        />
      ),
      onOpenChange: (open) => {
        if (!open) finish(false)
      },
      title: options.title,
      width: 'min(92vw, 26rem)',
    })
  })
}
