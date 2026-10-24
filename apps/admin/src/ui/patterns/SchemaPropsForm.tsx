import { createStaticStyles } from '@lobehub/ui'
import { useMemo } from 'react'

import { useI18n } from '~/i18n'
import type { PropsField } from '~/lib/dynamic-props'
import { applyFieldValue, fieldsFromSchema } from '~/lib/dynamic-props'
import { SelectField } from '~/ui/primitives/select'
import { Switch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'

const styles = createStaticStyles(({ css, cssVar }) => ({
  field: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `,
  fields: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  hint: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    line-height: 1.5;
    color: ${cssVar.colorTextDescription};
  `,
  label: css`
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  required: css`
    color: ${cssVar.colorError};
  `,
  switchRow: css`
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  `,
}))

export function SchemaPropsForm(props: {
  onChange: (value: Record<string, unknown>) => void
  schema: Record<string, unknown>
  value: Record<string, unknown>
}) {
  const { t } = useI18n()
  const fields = useMemo(() => fieldsFromSchema(props.schema), [props.schema])

  if (fields.length === 0) {
    return <p className={styles.hint}>{t('dynamicProps.noFields')}</p>
  }

  const update = (field: PropsField, input: boolean | string) =>
    props.onChange(applyFieldValue(props.value, field, input))

  return (
    <div className={styles.fields}>
      {fields.map((field) => (
        <div className={styles.field} key={field.key}>
          <FieldControl
            field={field}
            onInput={(input) => update(field, input)}
            value={props.value[field.key]}
          />
          {field.description ? (
            <p className={styles.hint}>{field.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function FieldControl(props: {
  field: PropsField
  onInput: (input: boolean | string) => void
  value: unknown
}) {
  const { field } = props
  const placeholder =
    field.defaultValue === undefined ? undefined : String(field.defaultValue)

  if (field.kind === 'boolean') {
    return (
      <label className={styles.switchRow}>
        <FieldLabel field={field} />
        <Switch
          aria-label={field.label}
          checked={Boolean(props.value ?? field.defaultValue)}
          onCheckedChange={props.onInput}
        />
      </label>
    )
  }

  if (field.kind === 'enum') {
    return (
      <div className={styles.field}>
        <FieldLabel field={field} />
        <SelectField
          aria-label={field.label}
          onValueChange={props.onInput}
          options={field.options.map((option) => ({
            label: option,
            value: option,
          }))}
          value={String(props.value ?? field.defaultValue ?? '')}
        />
      </div>
    )
  }

  return (
    <TextInput
      inputMode={field.kind === 'number' ? 'decimal' : undefined}
      label={field.label}
      name={field.key}
      onChange={props.onInput}
      placeholder={placeholder}
      required={field.required}
      type={field.kind === 'number' ? 'number' : 'text'}
      value={props.value === undefined ? '' : String(props.value)}
    />
  )
}

function FieldLabel(props: { field: PropsField }) {
  return (
    <span className={styles.label}>
      {props.field.label}
      {props.field.required ? (
        <span className={styles.required}> *</span>
      ) : null}
    </span>
  )
}
