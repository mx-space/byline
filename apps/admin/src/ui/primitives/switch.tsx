import {
  createStaticStyles,
  Flexbox,
  Switch as LobeSwitch,
  Text,
} from '@lobehub/ui'
import type { ReactNode } from 'react'

interface SwitchProps {
  'aria-label'?: string
  checked: boolean
  className?: string
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

const styles = createStaticStyles(({ css }) => ({
  copy: css`
    display: flex;
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
  return (
    <label>
      <Flexbox
        align="center"
        className={props.className}
        gap={16}
        horizontal
        justify="space-between"
        style={props.disabled ? { opacity: 0.6 } : undefined}
      >
        <span className={styles.copy}>
          <Text>{props.label}</Text>
          {props.description ? (
            <Text type="secondary">{props.description}</Text>
          ) : null}
        </span>
        <Switch
          checked={props.checked}
          disabled={props.disabled}
          onCheckedChange={props.onCheckedChange}
        />
      </Flexbox>
    </label>
  )
}
