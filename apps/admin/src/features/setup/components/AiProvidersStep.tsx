import { Alert, Empty, Icon, Input, Text, toast } from '@lobehub/ui'
import { Form, useForm, useWatch } from '@lobehub/ui/form'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useState } from 'react'

import { getModelList, testConfig } from '~/api/ai'
import type { AIProviderPreset } from '~/features/settings/config/aiProviderPresets'
import {
  aiProviderPresets,
  createProviderFromPreset,
} from '~/features/settings/config/aiProviderPresets'
import { ListSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useSetupCopy } from '../copy'
import {
  useOnboardingAiConfig,
  useSaveOnboardingAiConfig,
} from '../hooks/use-onboarding-ai'
import { removeProviderFromConfig } from '../utils/onboarding'
import { getErrorMessage } from '../utils/setup'
import {
  OnboardingCard,
  OnboardingFooter,
  OnboardingShell,
} from './OnboardingShell'
import { wizardStyles } from './wizard-styles'

const onboardingPresetIds = ['anthropic', 'openai', 'openrouter', 'custom']

const onboardingPresets = onboardingPresetIds
  .map((id) => aiProviderPresets.find((preset) => preset.id === id))
  .filter((preset): preset is AIProviderPreset => Boolean(preset))

type TestResult = { count: number; ok: true } | { message: string; ok: false }

interface ProviderDraft {
  apiKey: string
  endpoint: string
}

export function AiProvidersStep(props: {
  onBack: () => void
  onLater?: () => void
  onNext: () => void
  onSkip: () => void
}) {
  const copy = useSetupCopy()
  const configQuery = useOnboardingAiConfig()
  const save = useSaveOnboardingAiConfig()
  const [preset, setPreset] = useState(onboardingPresets[0])
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [modelCounts, setModelCounts] = useState<Record<string, number>>({})
  const providers = configQuery.data?.providers ?? []
  const form = useForm<ProviderDraft>({
    initialValues: { apiKey: '', endpoint: preset.endpoint ?? '' },
    onSubmit: async (values) => {
      await addProvider(values)
    },
  })
  const apiKey = useWatch(form, 'apiKey')

  const presetLabel = (item: AIProviderPreset) =>
    item.id === 'custom' ? copy('providersCompatible') : item.name

  const selectPreset = (item: AIProviderPreset) => {
    setPreset(item)
    form.setValue('endpoint', item.endpoint ?? '', { asUser: true })
    setResult(null)
  }

  const addProvider = async (values: ProviderDraft) => {
    if (!configQuery.data || !values.apiKey.trim() || testing) return
    setTesting(true)
    setResult(null)
    const base = createProviderFromPreset(preset)
    const trimmedEndpoint = values.endpoint.trim() || base.endpoint
    const provider = {
      ...base,
      apiKey: values.apiKey.trim(),
      endpoint: trimmedEndpoint,
      name: base.name || hostnameOf(trimmedEndpoint) || presetLabel(preset),
    }

    try {
      const list = await getModelList({
        apiKey: provider.apiKey,
        endpoint: provider.endpoint,
        modelListUrl: provider.modelListUrl,
        providerId: provider.id,
        type: provider.type,
      })
      if (list.error) throw new Error(list.error)
      const model = provider.defaultModel || list.models[0]?.id
      if (!model) throw new Error(copy('providersTestFailed'))
      await testConfig({
        apiKey: provider.apiKey,
        appendV1: provider.appendV1,
        endpoint: provider.endpoint,
        model,
        providerId: provider.id,
        type: provider.type,
      })
      await save({
        ...configQuery.data,
        providers: [...providers, { ...provider, defaultModel: model }],
      })
      setModelCounts((current) => ({
        ...current,
        [provider.id]: list.models.length,
      }))
      setResult({ count: list.models.length, ok: true })
      form.setValue('apiKey', '')
    } catch (error) {
      setResult({
        message: getErrorMessage(error, copy('providersTestFailed')),
        ok: false,
      })
    } finally {
      setTesting(false)
    }
  }

  const removeProvider = async (id: string) => {
    if (!configQuery.data) return
    try {
      await save(removeProviderFromConfig(configQuery.data, id))
    } catch (error) {
      toast.error(getErrorMessage(error, copy('providersSaveError')))
    }
  }

  const addBlocked = !apiKey.trim() || testing || !configQuery.data
  const addTitle = configQuery.isError
    ? copy('providersLoadError')
    : configQuery.isPending
      ? copy('providersLoading')
      : !apiKey.trim()
        ? copy('providersAddBlocked')
        : undefined

  return (
    <OnboardingShell onLater={props.onLater} step="ai-providers">
      <OnboardingCard
        description={copy('providersDescription')}
        footer={
          <OnboardingFooter onBack={props.onBack}>
            <Button htmlType="button" onClick={props.onSkip} type="text">
              {copy('providersSkip')}
            </Button>
            <Button
              data-testid="onboarding-submit"
              disabled={providers.length === 0}
              htmlType="button"
              onClick={props.onNext}
              title={
                providers.length === 0
                  ? copy('providersContinueBlocked')
                  : undefined
              }
              type="primary"
            >
              {copy('providersContinue')}
            </Button>
          </OnboardingFooter>
        }
        title={copy('providersTitle')}
      >
        <div className={wizardStyles.stack}>
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
          <Text>{copy('providersList')}</Text>
          {configQuery.isPending ? (
            <ListSkeleton label={copy('providersLoading')} rows={2} />
          ) : configQuery.isError ? null : providers.length === 0 ? (
            <Empty description={copy('providersEmpty')} />
          ) : (
            providers.map((provider) => (
              <div className={wizardStyles.provider} key={provider.id}>
                <Icon icon={CircleCheck} size="small" />
                <span className={wizardStyles.providerName}>
                  {provider.name}
                </span>
                {modelCounts[provider.id] ? (
                  <Text as="span" type="secondary">
                    {copy('providersModels', {
                      count: modelCounts[provider.id],
                    })}
                  </Text>
                ) : null}
                <Button
                  aria-label={copy('providersRemove', { name: provider.name })}
                  data-testid={`onboarding-provider-remove-${provider.id}`}
                  htmlType="button"
                  icon={X}
                  onClick={() => void removeProvider(provider.id)}
                  type="text"
                />
              </div>
            ))
          )}
          <Text type="secondary">{copy('providersAsideHint')}</Text>
          <div className={wizardStyles.choices}>
            {onboardingPresets.map((item) => (
              <Button
                aria-pressed={item.id === preset.id}
                data-testid={`onboarding-preset-${item.id}`}
                htmlType="button"
                icon={item.id === preset.id ? CircleCheck : undefined}
                key={item.id}
                onClick={() => selectPreset(item)}
                type="default"
              >
                {presetLabel(item)}
              </Button>
            ))}
          </div>
          <Form form={form} gap={16} layout="vertical">
            <Form.Field
              desc={copy('providersKeyHint')}
              label={copy('providersKey')}
              name="apiKey"
            >
              <Input autoComplete="off" name="apiKey" type="password" />
            </Form.Field>
            <Form.Field
              desc={copy('providersEndpointHint')}
              label={copy('providersEndpoint')}
              name="endpoint"
            >
              <Input
                name="endpoint"
                placeholder={copy('providersEndpointPlaceholder')}
                type="url"
              />
            </Form.Field>
            <Button
              data-testid="onboarding-provider-add"
              disabled={addBlocked}
              htmlType="submit"
              loading={testing}
              title={addTitle}
              type="default"
            >
              {copy('providersAdd')}
            </Button>
          </Form>
          {result?.ok ? (
            <Alert
              showIcon
              title={copy('providersTestOk', { count: result.count })}
              type="success"
            />
          ) : null}
          {result && !result.ok ? (
            <Alert
              description={result.message}
              icon={CircleAlert}
              showIcon
              title={copy('providersTestFailed')}
              type="error"
            />
          ) : null}
        </div>
      </OnboardingCard>
    </OnboardingShell>
  )
}

function hostnameOf(url?: string) {
  if (!url) return ''
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
