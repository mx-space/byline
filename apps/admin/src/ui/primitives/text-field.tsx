import { Input, TextArea as LobeTextArea } from '@lobehub/ui'
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
} from 'react'
import { forwardRef } from 'react'

type TextInputType = ComponentPropsWithoutRef<'input'>['type']

interface TextInputProps {
  'aria-label'?: string
  autoComplete?: string
  autoFocus?: boolean
  className?: string
  controlClassName?: string
  disabled?: boolean
  id?: string
  inputMode?: ComponentPropsWithoutRef<'input'>['inputMode']
  label?: ReactNode
  labelClassName?: string
  list?: string
  maxLength?: number
  min?: ComponentPropsWithoutRef<'input'>['min']
  name?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  onChange: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>
  placeholder?: string
  required?: boolean
  spellCheck?: boolean
  style?: CSSProperties
  type?: TextInputType
  value: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(props, ref) {
    const control = (
      <Input
        aria-label={props['aria-label']}
        autoComplete={props.autoComplete}
        autoFocus={props.autoFocus}
        className={props.controlClassName ?? props.className}
        disabled={props.disabled}
        id={props.id}
        inputMode={props.inputMode}
        list={props.list}
        maxLength={props.maxLength}
        min={props.min}
        name={props.name}
        onBlur={props.onBlur}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={props.onKeyDown}
        placeholder={props.placeholder}
        ref={ref}
        required={props.required}
        spellCheck={props.spellCheck}
        style={props.style}
        type={props.type ?? 'text'}
        value={props.value}
      />
    )

    if (!props.label) return control

    return (
      <label className={props.className}>
        <span className={props.labelClassName}>
          {props.label}
          {props.required ? ' *' : null}
        </span>
        {control}
      </label>
    )
  },
)

interface TextAreaProps {
  autoFocus?: boolean
  className?: string
  controlClassName?: string
  disabled?: boolean
  label?: ReactNode
  labelClassName?: string
  maxLength?: number
  name?: string
  onBlur?: FocusEventHandler<HTMLTextAreaElement>
  onChange: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLTextAreaElement>
  placeholder?: string
  required?: boolean
  spellCheck?: boolean
  style?: CSSProperties
  value: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(props, ref) {
    const control = (
      <LobeTextArea
        autoFocus={props.autoFocus}
        className={props.controlClassName ?? props.className}
        disabled={props.disabled}
        maxLength={props.maxLength}
        name={props.name}
        onBlur={props.onBlur}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={props.onKeyDown}
        placeholder={props.placeholder}
        ref={ref}
        required={props.required}
        spellCheck={props.spellCheck}
        style={props.style}
        value={props.value}
      />
    )

    if (!props.label) return control

    return (
      <label className={props.className}>
        <span className={props.labelClassName}>
          {props.label}
          {props.required ? ' *' : null}
        </span>
        {control}
      </label>
    )
  },
)
