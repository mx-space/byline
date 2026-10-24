import { createStaticStyles, toast } from '@lobehub/ui'
import { X } from 'lucide-react'
import { useId, useState } from 'react'

import { useI18n } from '~/i18n'
import {
  canonicalizeLanguageCode,
  COMMON_LANGUAGE_CODES,
  formatLanguageLabel,
} from '~/lib/languages'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u6f7e013d: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
  `,
  u152c1189: css`
    display: flex;
    gap: 0.5rem;
  `,
  u3b4c716c: css`
    min-width: 0px;
    flex: 1 1 0%;
  `,
  udbad9057: css`
    flex-shrink: 0;
    white-space: nowrap;
  `,
  u6978b7c6: css`
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  `,
  ucfefb1ef: css`
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    &:disabled {
      cursor: not-allowed;
    }
    &:disabled {
      opacity: 0.6;
    }
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

export function AITextListField(props: {
  disabled?: boolean
  label: string
  onChange: (value: string[]) => void
  value: string[]
}) {
  const { locale, t } = useI18n()
  const [draft, setDraft] = useState('')
  const listId = useId()

  const add = () => {
    if (!draft.trim() || props.disabled) return
    const value = canonicalizeLanguageCode(draft)
    if (!value) {
      toast.warning(t('settings.ai.test.invalidLanguageCode'))
      return
    }
    if (props.value.includes(value)) {
      toast.warning(t('settings.ai.test.languageExists', { language: value }))
      return
    }
    props.onChange([...props.value, value])
    setDraft('')
  }

  return (
    <div className={lobeStyles.u6f7e013d}>
      <div className={lobeStyles.u152c1189}>
        <TextInput
          aria-label={props.label}
          className={lobeStyles.u3b4c716c}
          disabled={props.disabled}
          list={listId}
          maxLength={35}
          onChange={setDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          placeholder={t('settings.ai.test.placeholder')}
          value={draft}
        />
        <datalist id={listId}>
          {COMMON_LANGUAGE_CODES.filter(
            (code) => !props.value.includes(code),
          ).map((code) => (
            <option key={code} value={code}>
              {formatLanguageLabel(code, locale)}
            </option>
          ))}
        </datalist>
        <Button
          className={lobeStyles.udbad9057}
          disabled={props.disabled || !draft.trim()}
          onClick={add}
          type="button"
          variant="subtle"
        >
          {t('common.add')}
        </Button>
      </div>
      <div className={lobeStyles.u6978b7c6}>
        {props.value.map((item) => (
          <button
            className={lobeStyles.ucfefb1ef}
            disabled={props.disabled}
            key={item}
            onClick={() =>
              props.onChange(props.value.filter((value) => value !== item))
            }
            title={formatLanguageLabel(item, locale)}
            type="button"
          >
            {item}
            <X aria-hidden="true" className={lobeStyles.ud05630af} />
          </button>
        ))}
      </div>
    </div>
  )
}
