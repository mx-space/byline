import { createStaticStyles } from '@lobehub/ui'
import { X } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import { TextInput } from '~/ui/primitives/text-field'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u6f7e013d: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
  `,
  u8a292509: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  `,
  ue70220ea: css`
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  ud05630af: css`
    margin-left: 0.25rem;
    display: inline;
    width: 0.75rem;
    height: 0.75rem;
  `,
}))

export function TagsEditor(props: {
  onChange: (value: string[]) => void
  value: string[]
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    props.onChange([...props.value, value])
    setDraft('')
  }

  return (
    <div className={lobeStyles.u6f7e013d}>
      <div className={lobeStyles.u8a292509}>
        {props.value.map((tag) => (
          <button
            className={lobeStyles.ue70220ea}
            key={tag}
            onClick={() =>
              props.onChange(props.value.filter((item) => item !== tag))
            }
            type="button"
          >
            {tag}
            <X aria-hidden="true" className={lobeStyles.ud05630af} />
          </button>
        ))}
      </div>
      <TextInput
        onChange={setDraft}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            add()
          }
        }}
        placeholder={t('settings.tags.placeholder')}
        value={draft}
      />
    </div>
  )
}
