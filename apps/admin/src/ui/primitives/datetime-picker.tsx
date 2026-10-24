import { DatePicker } from '@lobehub/ui'
import type { CSSProperties, ReactNode } from 'react'

interface DateTimePickerProps {
  className?: string
  controlClassName?: string
  disabled?: boolean
  id?: string
  label?: ReactNode
  labelClassName?: string
  max?: string
  min?: string
  name?: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  style?: CSSProperties
  /** datetime-local string: "YYYY-MM-DDTHH:mm" */
  value: string
}

const TIME_INTERVAL = 30

function toDatetimeLocal(date: Date): string {
  const offset = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offset.toISOString().slice(0, 16)
}

function parseDatetimeLocal(value: string | undefined | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / TIME_INTERVAL },
  (_, index) => {
    const hours = Math.floor((index * TIME_INTERVAL) / 60)
    const minutes = (index * TIME_INTERVAL) % 60
    return {
      hours,
      minutes,
      label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    }
  },
)

export function applyTime(
  base: Date | null,
  hours: number,
  minutes: number,
): string {
  const merged = new Date(base ?? Date.now())
  merged.setHours(hours, minutes, 0, 0)
  return toDatetimeLocal(merged)
}

export function DateTimePicker(props: DateTimePickerProps) {
  const min = parseDatetimeLocal(props.min)
  const max = parseDatetimeLocal(props.max)

  return (
    <label className={props.className} style={props.style}>
      {props.label ? (
        <span className={props.labelClassName}>{props.label}</span>
      ) : null}
      <DatePicker
        className={props.controlClassName}
        disabled={props.disabled}
        disabledDate={(current) => {
          if (min && current.getTime() < min.getTime()) return true
          if (max && current.getTime() > max.getTime()) return true
          return false
        }}
        id={props.id}
        needConfirm={false}
        onChange={(date) => {
          props.onChange(date ? toDatetimeLocal(date) : '')
        }}
        placeholder={props.placeholder}
        showTime
        value={parseDatetimeLocal(props.value)}
      />
      {props.name ? (
        <input name={props.name} type="hidden" value={props.value} />
      ) : null}
      {props.required ? (
        <input
          required
          style={{ display: 'none' }}
          tabIndex={-1}
          value={props.value}
          onChange={() => undefined}
        />
      ) : null}
    </label>
  )
}
