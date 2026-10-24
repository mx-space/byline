import { createStaticStyles, toast } from '@lobehub/ui'
import { CloudCog } from 'lucide-react'
import { useState } from 'react'

import { useI18n } from '~/i18n'
import { ModalFooter, ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'
import { TextInput } from '~/ui/primitives/text-field'

import {
  type AIProviderPreset,
  type AIProviderPresetTemplateValues,
  interpolatePresetTemplate,
} from '../../config/aiProviderPresets'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ue67af7dc: css`
    display: flex;
    width: min(92vw, 30rem);
    flex-direction: column;
  `,
  u61d25f78: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
    padding-inline: 1.25rem;
    padding-block: 1.25rem;
  `,
  u5a250822: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.375rem;
    }
  `,
  u0f0df7aa: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u4aadb3d6: css`
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.625rem;
  `,
  u4d697d0e: css`
    margin-bottom: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u0ff5c778: css`
    word-break: break-all;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorText};
  `,
}))

function AIProviderPresetModal(props: { preset: AIProviderPreset }) {
  const { t } = useI18n()
  const modal = useModal<AIProviderPresetTemplateValues>()
  const [values, setValues] = useState<AIProviderPresetTemplateValues>({})
  const endpoint = interpolatePresetTemplate(props.preset.endpoint, values)

  const submit = () => {
    const missingRequiredField = props.preset.templateFields?.some(
      (field) => field.required && !values[field.key]?.trim(),
    )
    if (missingRequiredField) {
      toast.warning(t('settings.ai.preset.modal.requiredField'))
      return
    }
    modal.close(values)
  }

  return (
    <form
      className={lobeStyles.ue67af7dc}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <ModalHeader
        icon={CloudCog}
        subtitle={t('settings.ai.preset.modal.description')}
        title={t('settings.ai.preset.modal.title')}
      />
      <div className={lobeStyles.u61d25f78}>
        {props.preset.templateFields?.map((field) => (
          <div className={lobeStyles.u5a250822} key={field.key}>
            <TextInput
              autoFocus
              label={t('settings.ai.field.projectId')}
              onChange={(projectId) =>
                setValues((current) => ({ ...current, projectId }))
              }
              placeholder={t('settings.ai.preset.modal.projectIdPlaceholder')}
              required={field.required}
              spellCheck={false}
              value={values.projectId ?? ''}
            />
            <p className={lobeStyles.u0f0df7aa}>
              {t('settings.ai.preset.modal.projectIdHelp')}
            </p>
          </div>
        ))}
        <div className={lobeStyles.u4aadb3d6}>
          <div className={lobeStyles.u4d697d0e}>
            {t('settings.ai.preset.modal.endpointPreview')}
          </div>
          <div className={lobeStyles.u0ff5c778}>{endpoint}</div>
        </div>
      </div>
      <ModalFooter>
        <Button onClick={() => modal.dismiss()} type="button" variant="subtle">
          {t('common.cancel')}
        </Button>
        <Button type="submit">{t('settings.ai.preset.modal.add')}</Button>
      </ModalFooter>
    </form>
  )
}

export function presentAIProviderPresetModal(preset: AIProviderPreset) {
  return present<{ preset: AIProviderPreset }, AIProviderPresetTemplateValues>(
    AIProviderPresetModal,
    { preset },
  )
}
