import { Input } from '@lobehub/ui'
import * as stylex from '@stylexjs/stylex'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import { PropsEditor } from '~/ui/patterns/PropsEditor'
import { Button } from '~/ui/site-button'

import { styles } from './styles'

const NO_SCHEMA = {}

export function ManualDynamicForm(props: {
  initialHeight: number
  onApply: (value: {
    initialHeight: number
    props: Record<string, unknown>
    url: string
  }) => void
  onBack: () => void
  onRemove: () => void
  props: Record<string, unknown>
  url: string
}) {
  const { t } = useI18n()
  const [url, setUrl] = useState(props.url)
  const [height, setHeight] = useState(String(props.initialHeight))
  const [componentProps, setComponentProps] = useState(props.props)

  const apply = () => {
    const parsedHeight = Number(height)
    props.onApply({
      initialHeight:
        Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 320,
      props: componentProps,
      url: url.trim(),
    })
  }

  return (
    <>
      <div {...stylex.props(styles.body)}>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.label)}>{t('dynamicNode.url')}</span>
          <Input
            autoFocus
            classNames={{ input: stylex.props(styles.mono).className }}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://cdn.example.com/widget.js"
            type="url"
            value={url}
          />
        </label>
        <label {...stylex.props(styles.field)}>
          <span {...stylex.props(styles.label)}>{t('dynamicNode.height')}</span>
          <Input
            min={0}
            onChange={(event) => setHeight(event.target.value)}
            type="number"
            value={height}
          />
        </label>
        <PropsEditor
          onChange={setComponentProps}
          schema={NO_SCHEMA}
          value={componentProps}
        />
        <p {...stylex.props(styles.hint)}>{t('dynamicNode.manualHint')}</p>
      </div>
      <div {...stylex.props(styles.footer)}>
        <Button
          icon={ArrowLeft}
          onClick={props.onBack}
          size="small"
          type="text"
        >
          {t('dynamicNode.backToPicker')}
        </Button>
        <div {...stylex.props(styles.footerActions)}>
          <Button danger onClick={props.onRemove}>
            {t('dynamicNode.remove')}
          </Button>
          <Button disabled={!url.trim()} onClick={apply} type="primary">
            {t('dynamicNode.apply')}
          </Button>
        </div>
      </div>
    </>
  )
}
