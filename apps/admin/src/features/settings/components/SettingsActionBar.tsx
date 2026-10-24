import { createStaticStyles, Flexbox, Text } from '@lobehub/ui'
import { createContext, useContext } from 'react'

import { useI18n } from '~/i18n'
import { Button } from '~/ui/site-button'

import { settingsCopy } from '../copy'

export type SettingsDirtyAction = {
  count: number
  error?: string
  onDiscard: () => void
  onSave: () => void
  saving: boolean
}

export const SettingsActionBarContext = createContext<
  (action: SettingsDirtyAction | null) => void
>(() => {})

export function useSettingsActionBarSetter() {
  return useContext(SettingsActionBarContext)
}

const styles = createStaticStyles(({ css, cssVar }) => ({
  bar: css`
    width: 100%;
    max-width: 800px;
    margin-inline: auto;
  `,
  count: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorText};
  `,
  error: css`
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

export function SettingsSaveBar(props: { action: SettingsDirtyAction }) {
  const { locale } = useI18n()
  const { action } = props
  return (
    <Flexbox
      align="center"
      aria-live="polite"
      className={styles.bar}
      gap={8}
      horizontal
      justify="space-between"
    >
      <Flexbox align="center" gap={12} horizontal style={{ minWidth: 0 }}>
        <Text as="span" className={styles.count} weight={500}>
          {settingsCopy(locale, 'unsavedCount', { count: action.count })}
        </Text>
        {action.error ? (
          <Text
            as="span"
            className={styles.error}
            title={action.error}
            type="danger"
          >
            {action.error}
          </Text>
        ) : null}
      </Flexbox>
      <Flexbox flex="none" gap={8} horizontal>
        <Button disabled={action.saving} onClick={action.onDiscard}>
          {settingsCopy(locale, 'discard')}
        </Button>
        <Button loading={action.saving} onClick={action.onSave} type="primary">
          {settingsCopy(locale, 'save')}
        </Button>
      </Flexbox>
    </Flexbox>
  )
}
