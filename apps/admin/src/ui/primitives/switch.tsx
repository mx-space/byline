import {
  createStaticStyles,
  Flexbox,
  Switch as LobeSwitch,
  Text,
} from '@lobehub/ui'
import type { ReactNode } from 'react'
import { useId } from 'react'

interface SwitchProps {
  'aria-label'?: string
  checked: boolean
  className?: string
  disabled?: boolean
  id?: string
  onCheckedChange: (checked: boolean) => void
}

const styles = createStaticStyles(({ css }) => ({
  copy: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
}))

export function Switch(props: SwitchProps) {
  return (
    <LobeSwitch
      aria-label={props['aria-label']}
      checked={props.checked}
      className={props.className}
      disabled={props.disabled}
      id={props.id}
      onChange={props.onCheckedChange}
    />
  )
}

interface FormSwitchProps {
  bordered?: boolean
  checked: boolean
  className?: string
  description?: ReactNode
  disabled?: boolean
  label: ReactNode
  onCheckedChange: (checked: boolean) => void
}

export function FormSwitch(props: FormSwitchProps) {
  const id = useId()
  return (
    <Flexbox
      align="center"
      className={props.className}
      gap={16}
      horizontal
      justify="space-between"
      style={props.disabled ? { opacity: 0.6 } : undefined}
    >
      <label className={styles.copy} htmlFor={id}>
        <Text as="span">{props.label}</Text>
        {props.description ? (
          <Text as="span" type="secondary">
            {props.description}
          </Text>
        ) : null}
      </label>
      <Switch
        checked={props.checked}
        disabled={props.disabled}
        id={id}
        onCheckedChange={props.onCheckedChange}
      />
    </Flexbox>
  )
}
