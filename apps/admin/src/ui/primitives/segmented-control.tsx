import { Segmented } from '@lobehub/ui'
import type { ReactNode } from 'react'

export interface SegmentedControlOption<TValue extends string = string> {
  label: ReactNode
  value: TValue
}

interface SegmentedControlProps<TValue extends string = string> {
  'aria-label'?: string
  className?: string
  fill?: boolean
  onValueChange: (value: TValue) => void
  options: SegmentedControlOption<TValue>[]
  value: TValue
}

export function SegmentedControl<TValue extends string = string>(
  props: SegmentedControlProps<TValue>,
) {
  return (
    <Segmented
      block={props.fill}
      className={props.className}
      onChange={props.onValueChange}
      options={props.options}
      size="small"
      value={props.value}
      {...(props['aria-label']
        ? ({ 'aria-label': props['aria-label'] } as object)
        : null)}
    />
  )
}
