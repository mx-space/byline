import { Checkbox as LobeCheckbox } from '@lobehub/ui'
import type { MouseEventHandler, ReactNode } from 'react'

interface CheckboxProps {
  'aria-label'?: string
  checked: boolean
  className?: string
  cursor?: boolean
  disabled?: boolean
  indeterminate?: boolean
  label?: ReactNode
  onCheckedChange: (checked: boolean) => void
  onClick?: MouseEventHandler<HTMLElement>
}

export function Checkbox(props: CheckboxProps) {
  return (
    <LobeCheckbox
      aria-label={props['aria-label']}
      checked={props.checked}
      className={props.className}
      disabled={props.disabled}
      onChange={props.onCheckedChange}
      onClick={props.onClick}
    >
      {props.label}
    </LobeCheckbox>
  )
}
