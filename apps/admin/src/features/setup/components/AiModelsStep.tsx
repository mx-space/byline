import { Alert, Select, Skeleton, Text, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import { getModelsByCapability } from '~/api/ai'
import type { AIProviderCapability } from '~/features/settings/types/settings'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { type SetupCopyKey, useSetupCopy } from '../copy'
import {
  useOnboardingAiConfig,
  useSaveOnboardingAiConfig,
} from '../hooks/use-onboarding-ai'
import type { ModelFeature, ModelOption } from '../utils/onboarding'
import {
  applyModelPlan,
  buildModelOptions,
  parseModelOption,
  toModelOption,
} from '../utils/onboarding'
import { getErrorMessage } from '../utils/setup'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

const featureRows: Array<{
  capability: AIProviderCapability
  feature: ModelFeature
  hint: SetupCopyKey
  label: SetupCopyKey
}> = [
  {
    capability: 'text',
    feature: 'writerModel',
    hint: 'modelsWriterHint',
    label: 'modelsWriter',
  },
  {
    capability: 'text',
    feature: 'summaryModel',
    hint: 'modelsSummaryHint',
    label: 'modelsSummary',
  },
  {
    capability: 'text',
    feature: 'translationModel',
    hint: 'modelsTranslationHint',
    label: 'modelsTranslation',
  },
  {
    capability: 'text',
    feature: 'translationReviewModel',
    hint: 'modelsReviewHint',
    label: 'modelsReview',
  },
  {
    capability: 'text',
    feature: 'insightsModel',
    hint: 'modelsInsightsHint',
    label: 'modelsInsights',
  },
  {
    capability: 'speech',
    feature: 'ttsModel',
    hint: 'modelsTtsHint',
    label: 'modelsTts',
  },
  {
    capability: 'image',
    feature: 'imageModel',
    hint: 'modelsImageHint',
    label: 'modelsImage',
  },
]

function useModelOptions(capability: AIProviderCapability) {
  return useQuery({
    queryFn: async () =>
      buildModelOptions(await getModelsByCapability(capability)),
    queryKey: adminQueryKeys.onboarding.models(capability),
  })
}

export function AiModelsStep(props: {
  onBack: () => void
  onLater?: () => void
  onNext: () => void
}) {
  const copy = useSetupCopy()
  const configQuery = useOnboardingAiConfig()
  const save = useSaveOnboardingAiConfig()
  const imageQuery = useModelOptions('image')
  const speechQuery = useModelOptions('speech')
  const textQuery = useModelOptions('text')
  const optionsByCapability: Record<AIProviderCapability, ModelOption[]> = {
    decision: [],
    image: imageQuery.data ?? [],
    speech: speechQuery.data ?? [],
    text: textQuery.data ?? [],
  }
  const modelsLoading =
    imageQuery.isPending || speechQuery.isPending || textQuery.isPending
  const modelsError =
    imageQuery.isError || speechQuery.isError || textQuery.isError
  const textOptions = optionsByCapability.text
  const [defaultChoice, setDefaultChoice] = useState<string | null>(null)
  const [overrides, setOverrides] = useState<
    Partial<Record<ModelFeature, string>>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const lock = useRef(false)

  const savedDefault = toModelOption(configQuery.data?.writerModel)
  const defaultValue =
    defaultChoice ??
    (textOptions.some((option) => option.value === savedDefault)
      ? savedDefault
      : (textOptions[0]?.value ?? ''))

  const savedOverride = (feature: ModelFeature) => {
    if (feature === 'ttsModel')
      return toModelOption(configQuery.data?.tts?.model)
    if (feature === 'imageModel') {
      return toModelOption(configQuery.data?.imageGeneration?.model)
    }
    const saved = toModelOption(configQuery.data?.[feature])
    return saved === savedDefault ? '' : saved
  }

  const form = useForm({
    initialValues: { ready: true },
    onSubmit: async () => {
      if (!configQuery.data || lock.current) return
      lock.current = true
      setSubmitting(true)
      try {
        const plan = {
          defaultModel: parseModelOption(defaultValue),
          overrides: Object.fromEntries(
            featureRows.map(({ feature }) => [
              feature,
              parseModelOption(overrides[feature] ?? savedOverride(feature)),
            ]),
          ),
        }
        await save(applyModelPlan(configQuery.data, plan))
        props.onNext()
      } catch (error) {
        toast.error(getErrorMessage(error, copy('modelsSaveError')))
      } finally {
        lock.current = false
        setSubmitting(false)
      }
    },
  })

  const blocked =
    submitting || modelsLoading || modelsError || !configQuery.data

  return (
    <OnboardingShell onLater={props.onLater} step="ai-models">
      <Form form={form} layout="vertical">
        <OnboardingCard
          description={copy('modelsDescription')}
          footer={
            <OnboardingFooter onBack={props.onBack}>
              <Button
                data-testid="onboarding-submit"
                disabled={blocked}
                htmlType="submit"
                loading={submitting}
                title={blocked ? copy('modelsBlocked') : undefined}
                type="primary"
              >
                {copy('modelsContinue')}
              </Button>
            </OnboardingFooter>
          }
          title={copy('modelsTitle')}
        >
          <div className={wizardStyles.stack}>
            {modelsLoading || configQuery.isPending ? (
              <Skeleton.Text
                aria-label={copy('modelsLoading')}
                rows={1}
                width="42%"
              />
            ) : null}
            {modelsError || configQuery.isError ? (
              <Alert showIcon title={copy('modelsLoadError')} type="error" />
            ) : null}
            {modelsError || configQuery.isError ? (
              <Button
                htmlType="button"
                onClick={() => {
                  void imageQuery.refetch()
                  void speechQuery.refetch()
                  void textQuery.refetch()
                  void configQuery.refetch()
                }}
                type="text"
              >
                {copy('retry')}
              </Button>
            ) : null}
            <Form.Field
              desc={copy('modelsDefaultHint')}
              label={copy('modelsDefault')}
            >
              <Select
                aria-label={copy('modelsDefault')}
                disabled={textOptions.length === 0}
                onChange={(value) => {
                  if (typeof value === 'string') setDefaultChoice(value)
                }}
                options={textOptions}
                value={defaultValue}
              />
            </Form.Field>
            {featureRows.map((row) => {
              const capabilityOptions = optionsByCapability[row.capability]
              const unavailable = capabilityOptions.length === 0
              const emptyLabel = unavailable
                ? copy('modelsMissing')
                : row.capability === 'text'
                  ? copy('modelsFollow')
                  : copy('modelsNone')
              const value = overrides[row.feature] ?? savedOverride(row.feature)
              return (
                <Form.Field
                  desc={copy(row.hint)}
                  key={row.feature}
                  label={copy(row.label)}
                >
                  <Select
                    aria-label={copy(row.label)}
                    disabled={unavailable}
                    onChange={(next) => {
                      if (typeof next !== 'string') return
                      setOverrides((current) => ({
                        ...current,
                        [row.feature]: next,
                      }))
                    }}
                    options={[
                      { label: emptyLabel, value: '' },
                      ...capabilityOptions,
                    ]}
                    value={value}
                  />
                </Form.Field>
              )
            })}
            <Text type="secondary">{copy('modelsLater')}</Text>
          </div>
        </OnboardingCard>
      </Form>
    </OnboardingShell>
  )
}
