import { Select } from '@lobehub/ui'
import type { ReactNode } from 'react'

type SelectValue = number | string

export interface SelectOption<TValue extends SelectValue = string> {
  label: ReactNode
  value: TValue
}

interface SelectFieldProps<TValue extends SelectValue = string> {
  'aria-label'?: string
  className?: string
  disabled?: boolean
  id?: string
  onValueChange: (value: TValue) => void
  options: SelectOption<TValue>[]
  popupClassName?: string
  triggerClassName?: string
  value: TValue
  variant?: 'borderless' | 'filled' | 'outlined'
}

export function SelectField<TValue extends SelectValue = string>(
  props: SelectFieldProps<TValue>,
) {
  return (
    <Select
      className={props.triggerClassName ?? props.className}
      disabled={props.disabled}
      id={props.id}
      onChange={(value) => {
        if (value !== null && value !== undefined && !Array.isArray(value)) {
          props.onValueChange(value as TValue)
        }
      }}
      options={props.options}
      popupClassName={props.popupClassName}
      value={props.value}
      variant={props.variant}
    />
  )
}
