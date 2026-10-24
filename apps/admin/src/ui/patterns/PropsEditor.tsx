import { createStaticStyles, TextArea } from '@lobehub/ui'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import {
  fieldsFromSchema,
  formatJson,
  parseJsonObject,
} from '~/lib/dynamic-props'
import { SegmentedControl } from '~/ui/primitives/segmented-control'

import { SchemaPropsForm } from './SchemaPropsForm'

type PropsEditorMode = 'form' | 'json'

const styles = createStaticStyles(({ css, cssVar }) => ({
  error: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorError};
  `,
  json: css`
    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    line-height: 20px;
  `,
  mode: css`
    align-self: flex-start;
  `,
  root: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
}))

export function PropsEditor(props: {
  onChange: (value: Record<string, unknown>) => void
  schema: Record<string, unknown>
  value: Record<string, unknown>
}) {
  const { t } = useI18n()
  const [mode, setMode] = useState<PropsEditorMode>(() =>
    fieldsFromSchema(props.schema).length > 0 ? 'form' : 'json',
  )
  const [jsonText, setJsonText] = useState(() => formatJson(props.value))
  const [jsonInvalid, setJsonInvalid] = useState(false)

  const switchMode = (next: PropsEditorMode) => {
    if (next === 'json') {
      setJsonText(formatJson(props.value))
      setJsonInvalid(false)
    }
    setMode(next)
  }

  return (
    <div className={styles.root}>
      <SegmentedControl<PropsEditorMode>
        className={styles.mode}
        onValueChange={switchMode}
        options={[
          { label: t('dynamicProps.form'), value: 'form' },
          { label: 'JSON', value: 'json' },
        ]}
        value={mode}
      />
      {mode === 'form' ? (
        <SchemaPropsForm
          onChange={props.onChange}
          schema={props.schema}
          value={props.value}
        />
      ) : (
        <div className={styles.stack}>
          <TextArea
            autoSize={{ maxRows: 16, minRows: 5 }}
            classNames={{ input: styles.json }}
            onChange={(event) => {
              const text = event.target.value
              setJsonText(text)
              const parsed = parseJsonObject(text)
              setJsonInvalid(!parsed)
              if (parsed) props.onChange(parsed)
            }}
            spellCheck={false}
            value={jsonText}
          />
          {jsonInvalid ? (
            <p className={styles.error} role="alert">
              {t('dynamicProps.jsonInvalid')}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
