import { Alert, Flexbox, Skeleton, Switch, Text, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { Check } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/ui/site-button'

import { useSetupCopy } from '../copy'
import {
  useOnboardingAiConfig,
  useSaveOnboardingAiConfig,
} from '../hooks/use-onboarding-ai'
import { nextSummaryLanguages, onboardingLanguages } from '../utils/onboarding'
import { getErrorMessage } from '../utils/setup'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

interface FeatureDraft {
  insights: boolean
  languages: string[]
  summary: boolean
  translation: boolean
  tts: boolean
}

export function AiFeaturesStep(props: {
  onBack: () => void
  onLater?: () => void
  onNext: () => void
}) {
  // lobe-design-ignore DETAIL-NO-EMPTY: 目标语言是固定清单，不是请求回来的列表
  const copy = useSetupCopy()
  const configQuery = useOnboardingAiConfig()
  const save = useSaveOnboardingAiConfig()
  const config = configQuery.data
  const [draft, setDraft] = useState<FeatureDraft | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const lock = useRef(false)
  const ttsAvailable = Boolean(
    config?.tts?.model?.providerId && config.tts.model.model,
  )

  useEffect(() => {
    if (!config || draft) return
    setDraft({
      insights: Boolean(config.enableInsights),
      languages: config.translationTargetLanguages ?? [],
      summary: Boolean(config.enableSummary),
      translation: Boolean(config.enableTranslation),
      tts: Boolean(config.tts?.enable),
    })
  }, [config, draft])

  const update = (patch: Partial<FeatureDraft>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current))

  const toggleLanguage = (code: string) => {
    if (!draft) return
    update({
      languages: draft.languages.includes(code)
        ? draft.languages.filter((item) => item !== code)
        : [...draft.languages, code],
    })
  }

  const form = useForm({
    initialValues: { ready: true },
    onSubmit: async () => {
      if (!config || !draft || lock.current) return
      lock.current = true
      setSubmitting(true)
      try {
        await save({
          ...config,
          enableInsights: draft.insights,
          enableSummary: draft.summary,
          enableTranslation: draft.translation,
          summaryTargetLanguages: nextSummaryLanguages(config, draft.languages),
          translationTargetLanguages: draft.languages,
          tts: { ...config.tts, enable: ttsAvailable && draft.tts },
        })
        props.onNext()
      } catch (error) {
        toast.error(getErrorMessage(error, copy('featuresSaveError')))
      } finally {
        lock.current = false
        setSubmitting(false)
      }
    },
  })

  return (
    <OnboardingShell onLater={props.onLater} step="ai-features">
      <Form form={form} layout="vertical">
        <OnboardingCard
          description={copy('featuresDescription')}
          footer={
            <OnboardingFooter onBack={props.onBack}>
              <Button
                data-testid="onboarding-submit"
                disabled={!draft || submitting}
                htmlType="submit"
                loading={submitting}
                title={!draft ? copy('featuresBlocked') : undefined}
                type="primary"
              >
                {copy('featuresContinue')}
              </Button>
            </OnboardingFooter>
          }
          title={copy('featuresTitle')}
        >
          <div className={wizardStyles.stack}>
            {configQuery.isPending ? (
              <Skeleton.Text
                aria-label={copy('featuresBlocked')}
                rows={1}
                width="42%"
              />
            ) : null}
            {configQuery.isError ? (
              <Alert showIcon title={copy('providersLoadError')} type="error" />
            ) : null}
            {configQuery.isError ? (
              <Button
                htmlType="button"
                onClick={() => void configQuery.refetch()}
                type="text"
              >
                {copy('retry')}
              </Button>
            ) : null}
            <FeatureRow
              checked={Boolean(draft?.translation)}
              hint={copy('featuresTranslationHint')}
              id="translation"
              label={copy('featuresTranslation')}
              onCheckedChange={(translation) => update({ translation })}
            >
              <div className={wizardStyles.choices}>
                <Text as="span" type="secondary">
                  {copy('featuresLanguages')}
                </Text>
                {onboardingLanguages.map((language) => {
                  const selected = Boolean(
                    draft?.languages.includes(language.code),
                  )
                  return (
                    <Button
                      aria-pressed={selected}
                      data-testid={`onboarding-language-${language.code}`}
                      disabled={!draft?.translation}
                      htmlType="button"
                      icon={selected ? Check : undefined}
                      key={language.code}
                      onClick={() => toggleLanguage(language.code)}
                      title={
                        draft?.translation
                          ? undefined
                          : copy('featuresLanguageBlocked')
                      }
                      type="default"
                    >
                      {language.label}
                    </Button>
                  )
                })}
              </div>
            </FeatureRow>
            <FeatureRow
              checked={Boolean(draft?.summary)}
              hint={copy('featuresSummaryHint')}
              id="summary"
              label={copy('featuresSummary')}
              onCheckedChange={(summary) => update({ summary })}
            />
            <FeatureRow
              checked={Boolean(draft?.insights)}
              hint={copy('featuresInsightsHint')}
              id="insights"
              label={copy('featuresInsights')}
              onCheckedChange={(insights) => update({ insights })}
            />
            <FeatureRow
              checked={ttsAvailable && Boolean(draft?.tts)}
              disabled={!ttsAvailable}
              hint={
                ttsAvailable
                  ? copy('featuresTtsHint')
                  : copy('featuresTtsUnavailable')
              }
              id="tts"
              label={copy('featuresTts')}
              onCheckedChange={(tts) => update({ tts })}
            />
          </div>
        </OnboardingCard>
      </Form>
    </OnboardingShell>
  )
}

function FeatureRow(
  props: PropsWithChildren<{
    checked: boolean
    disabled?: boolean
    hint: string
    id: string
    label: string
    onCheckedChange: (checked: boolean) => void
  }>,
) {
  return (
    <div
      className={wizardStyles.feature}
      data-testid={`onboarding-feature-${props.id}`}
    >
      <Flexbox align="flex-start" gap={12} horizontal>
        <Flexbox direction="vertical" gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Text>{props.label}</Text>
          <Text type="secondary">{props.hint}</Text>
        </Flexbox>
        <Switch
          aria-label={props.label}
          checked={props.checked}
          disabled={props.disabled}
          onChange={props.onCheckedChange}
          {...(props.disabled ? { 'data-disabled': '' } : {})}
        />
      </Flexbox>
      {props.checked ? props.children : null}
    </div>
  )
}
