import {
  ActionIcon,
  createStaticStyles,
  Empty,
  Flexbox,
  InputPassword,
  Text,
  TextArea,
} from '@lobehub/ui'
import { Form } from '@lobehub/ui/form'
import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/site-button'

import { settingsCopy } from '../copy'

const CONTROL_WIDTH = 360

const styles = createStaticStyles(({ css, cssVar }) => ({
  empty: css`
    padding-block: 24px;
  `,
  field: css`
    display: grid;
    gap: 8px;
    font-size: ${cssVar.fontSize};
    color: ${cssVar.colorText};
  `,
  error: css`
    font-size: ${cssVar.fontSizeSM};
  `,
  fieldLabel: css`
    font-weight: 500;
  `,
  control: css`
    display: flex;
    gap: 4px;
    align-items: center;

    > :first-child {
      flex: 1;
      min-width: 0;
    }
  `,
  rowFooter: css`
    margin-block-start: 4px;
  `,
}))

/** Stacked label for controls inside drawers and modals. */
export function FieldShell(props: { children: ReactNode; label: string }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{props.label}</span>
      {props.children}
    </label>
  )
}

export function EmptyState(props: { icon: ReactNode; label: string }) {
  return (
    <div className={styles.empty}>
      <Empty image={props.icon} title={props.label} />
    </div>
  )
}

export function SettingsGroup(props: {
  children: ReactNode
  desc?: ReactNode
  extra?: ReactNode
  title: ReactNode
}) {
  return (
    <Form.Group
      collapsible={false}
      desc={props.desc}
      extra={props.extra}
      title={props.title}
      variant="outlined"
    >
      {props.children}
    </Form.Group>
  )
}

export function SettingRow(props: {
  children: ReactNode
  className?: string
  desc?: ReactNode
  divider?: boolean
  error?: string
  label: ReactNode
  onReset?: () => void
  required?: boolean
  /** Long or composite controls take the full row under their label. */
  wide?: boolean
  /** Fixed control column width; `auto` keeps the control's own size, for switches and buttons. */
  width?: 'auto' | number
}) {
  const { locale } = useI18n()
  const footer = props.error ? (
    <div className={styles.rowFooter}>
      <Text as="span" className={styles.error} role="alert" type="danger">
        {props.error}
      </Text>
    </div>
  ) : null
  const resetLabel = settingsCopy(locale, 'resetToDefault')

  return (
    <Form.Field
      className={props.className}
      desc={props.desc}
      divider={props.divider}
      extra={footer}
      label={props.label}
      layout={props.wide ? 'vertical' : undefined}
      minWidth={
        props.wide || props.width === 'auto'
          ? undefined
          : (props.width ?? CONTROL_WIDTH)
      }
      required={props.required}
    >
      {props.onReset ? (
        <div className={styles.control}>
          {props.children}
          <ActionIcon
            aria-label={resetLabel}
            icon={RotateCcw}
            onClick={props.onReset}
            size="small"
            title={resetLabel}
          />
        </div>
      ) : (
        props.children
      )}
    </Form.Field>
  )
}

/** Stored secrets are never sent back, so the field shows a mask until the user replaces it. */
export function SecretInput(props: {
  'aria-label'?: string
  multiline?: boolean
  onChange: (value: string) => void
  placeholder?: string
  stored?: boolean
  value: string
}) {
  const { locale } = useI18n()
  const [replacing, setReplacing] = useState(false)
  const canCancel = props.stored !== false

  if (canCancel && !replacing && !props.value) {
    return (
      <Flexbox align="center" gap={8} horizontal justify="space-between">
        <Text as="span" type="secondary">
          {props.stored ? '••••••••' : settingsCopy(locale, 'secretHidden')}
        </Text>
        <Button
          aria-label={props['aria-label']}
          onClick={() => setReplacing(true)}
          size="small"
        >
          {settingsCopy(locale, 'secretReplace')}
        </Button>
      </Flexbox>
    )
  }

  const placeholder =
    props.placeholder ?? settingsCopy(locale, 'secretReplacePlaceholder')
  const input = props.multiline ? (
    <TextArea
      aria-label={props['aria-label']}
      autoFocus={canCancel}
      onChange={(event) => props.onChange(event.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      value={props.value}
    />
  ) : (
    <InputPassword
      aria-label={props['aria-label']}
      autoComplete="new-password"
      autoFocus={canCancel}
      onChange={(event) => props.onChange(event.target.value)}
      placeholder={placeholder}
      value={props.value}
    />
  )

  if (!canCancel) return input
  return (
    <Flexbox
      align={props.multiline ? 'flex-end' : 'center'}
      gap={8}
      horizontal={!props.multiline}
    >
      <Flexbox flex={1} style={{ minWidth: 0, width: '100%' }}>
        {input}
      </Flexbox>
      <Button
        onClick={() => {
          props.onChange('')
          setReplacing(false)
        }}
        size="small"
        type="text"
      >
        {settingsCopy(locale, 'cancel')}
      </Button>
    </Flexbox>
  )
}
