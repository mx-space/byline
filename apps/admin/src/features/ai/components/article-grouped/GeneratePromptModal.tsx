import { Checkbox, createStaticStyles, Input, Tag, toast } from '@lobehub/ui'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/site-button'

import { useAiCopy } from '../../copy'
import { aiStyles } from '../../shell/styles'
import { parseLangInput } from '../../utils/ai'

const styles = createStaticStyles(({ css }) => ({
  body: css`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 16px;
    padding-inline: 1rem;
  `,
}))

export interface GeneratePromptModalProps {
  defaultLangs?: string[]
  lockedLangs?: string[]
  promptForLang: boolean
  replacesUnlocked?: boolean
  title: string
}

export interface GeneratePromptResult {
  force: boolean
  langs: string[]
  overwriteLocked: boolean
}

function GeneratePromptModal(props: GeneratePromptModalProps) {
  const copy = useAiCopy()
  const modal = useModal<GeneratePromptResult>()
  const [langInput, setLangInput] = useState(
    props.defaultLangs?.join(', ') ?? '',
  )
  const [force, setForce] = useState(false)
  const [overwriteLocked, setOverwriteLocked] = useState(false)
  const langs = parseLangInput(langInput)
  const locked = props.lockedLangs ?? []

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    modal.close({
      force,
      langs: props.promptForLang ? langs : [],
      overwriteLocked: force && overwriteLocked,
    })
  }

  const submitLabel =
    force && props.replacesUnlocked ? copy('replaceConfirm') : props.title

  return (
    <form className={aiStyles.stack} onSubmit={handleSubmit}>
      <ModalHeader title={props.title} />
      <div className={styles.body}>
        {locked.length ? (
          <div className={aiStyles.lockedStrip}>
            <span className={aiStyles.label}>{copy('lockedBefore')}</span>
            {locked.map((lang) => (
              <Tag color="gold" key={lang}>
                {copy('locked')} {lang}
              </Tag>
            ))}
          </div>
        ) : (
          <p className={aiStyles.meta}>{copy('noLocked')}</p>
        )}
        {props.promptForLang ? (
          <label className={aiStyles.field}>
            <span className={aiStyles.label}>{copy('langsLabel')}</span>
            <Input
              onChange={(event) =>
                setLangInput(
                  typeof event === 'string' ? event : event.target.value,
                )
              }
              placeholder="zh-CN, en, ja"
              value={langInput}
            />
            <span className={aiStyles.meta}>{copy('langsHint')}</span>
            {langs.length ? (
              <span className={aiStyles.meta}>
                {copy('langsCount', { count: langs.length })}
              </span>
            ) : null}
          </label>
        ) : (
          <p className={aiStyles.meta}>{props.title}</p>
        )}
        <Checkbox checked={force} onChange={setForce}>
          {copy('forceLabel')}
        </Checkbox>
        <p className={aiStyles.meta}>
          {props.replacesUnlocked
            ? copy('forceHintTranslation')
            : copy('forceHintOther')}
        </p>
        {force && props.replacesUnlocked && locked.length ? (
          <Checkbox checked={overwriteLocked} onChange={setOverwriteLocked}>
            {copy('overwriteLocked')}
          </Checkbox>
        ) : null}
      </div>
      <ModalFooter>
        <Button htmlType="button" onClick={() => modal.dismiss()}>
          {copy('cancel')}
        </Button>
        <Button
          danger={force && props.replacesUnlocked}
          htmlType="submit"
          type="primary"
        >
          {submitLabel}
        </Button>
      </ModalFooter>
    </form>
  )
}

export async function presentGeneratePrompt(
  props: GeneratePromptModalProps,
): Promise<GeneratePromptResult | undefined> {
  const handle = present<GeneratePromptModalProps, GeneratePromptResult>(
    GeneratePromptModal,
    props,
    { modalProps: { popupStyle: { width: 'min(92vw, 28rem)' } } },
  )
  return await handle
}

export function toastTaskResult(
  result: { created: boolean },
  copy: (key: 'taskCreated' | 'taskExists') => string,
) {
  toast.success(result.created ? copy('taskCreated') : copy('taskExists'))
}
