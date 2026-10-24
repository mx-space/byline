import { TextArea } from '@lobehub/ui'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
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

const styles = stylex.create({
  error: { margin: '0', fontSize: cssVar.fontSizeSM, color: cssVar.colorError },
  json: {
    fontFamily: cssVar.fontFamilyCode,
    fontSize: cssVar.fontSizeSM,
    lineHeight: '20px',
  },
  mode: { alignSelf: 'flex-start' },
  root: { display: 'flex', flexDirection: 'column', gap: '12px' },
  stack: { display: 'flex', flexDirection: 'column', gap: '6px' },
})

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
    <div {...stylex.props(styles.root)}>
      <SegmentedControl<PropsEditorMode>
        className={stylex.props(styles.mode).className}
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
        <div {...stylex.props(styles.stack)}>
          <TextArea
            autoSize={{ maxRows: 16, minRows: 5 }}
            classNames={{ input: stylex.props(styles.json).className }}
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
            <p {...stylex.props(styles.error)} role="alert">
              {t('dynamicProps.jsonInvalid')}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
