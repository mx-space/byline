import {
  AutoComplete,
  Button,
  Checkbox,
  Flexbox,
  InputPassword,
  Spin,
  Tag,
  toast,
} from '@lobehub/ui'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { getModelList, getRegistryModels, testConfig } from '~/api/ai'
import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { SelectField } from '~/ui/primitives/select'
import { TextInput } from '~/ui/primitives/text-field'

import {
  aiProviderPresets,
  findAIProviderPreset,
  interpolatePresetTemplate,
} from '../../config/aiProviderPresets'
import { aiProviderTypeOptions } from '../../constants'
import { settingsCopy } from '../../copy'
import type {
  AIProviderConfig,
  AIProviderModel,
  AIProviderType,
} from '../../types/settings'
import { formatAIModelPricing } from '../../utils/aiModelPricing'
import {
  formatAIProviderLabel,
  getAIProviderKeyPlaceholder,
  getAIProviderModelPlaceholder,
  getAIProviderNamePlaceholder,
  getDefaultAIModel,
  getErrorMessage,
  matchRegistryModel,
  mergeModelOptions,
  resolvePiProviderId,
} from '../../utils/settings'
import { FieldShell } from '../SettingsPrimitives'
import { AIModelAvatar, AIModelOptionLabel, AIProviderAvatar } from './ai-brand'
import { LobeHubConnection } from './LobeHubConnection'

const styles = stylex.create({
  note: {
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
    marginBlock: 0,
  },
  label: { fontWeight: 500 },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 12,
    rowGap: 4,
    fontSize: cssVar.fontSizeSM,
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    color: cssVar.colorPrimary,
    textDecoration: { default: 'none', ':hover': 'underline' },
  },
  secondaryLink: {
    color: { default: cssVar.colorTextSecondary, ':hover': cssVar.colorText },
  },
  linkIcon: { width: 12, height: 12 },
})

const BUILD_HASH =
  (typeof window !== 'undefined' && (window as any).version) || 'dev'
const REGISTRY_STALE_MS = 10 * 60 * 1000

export function AIProviderDrawer(props: {
  modelCacheKey: readonly unknown[]
  onChange: (patch: Partial<AIProviderConfig>) => void
  onClose: () => void
  provider: AIProviderConfig | null
  providerModels: AIProviderModel[]
}) {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const [fetching, setFetching] = useState(false)
  const [testing, setTesting] = useState(false)
  const [lobeHubConnected, setLobeHubConnected] = useState(false)
  const provider = props.provider
  const decisionEnabled = provider?.type === 'typesafe'
  const textEnabled = provider?.capabilities?.text ?? true
  const matchedPreset = provider ? findAIProviderPreset(provider) : undefined
  const isGoogleVertex = provider?.type === 'google-vertex'

  const isLobeHub = provider?.type === 'lobehub'
  const showEndpoint = Boolean(provider) && !isLobeHub
  const piProviderId =
    provider && textEnabled ? resolvePiProviderId(provider) : null

  const registryQuery = useQuery({
    enabled: Boolean(provider) && piProviderId !== null,
    queryFn: () => getRegistryModels(piProviderId as string),
    queryKey: ['ai-registry-models', piProviderId, BUILD_HASH] as const,
    staleTime: REGISTRY_STALE_MS,
  })

  const registryModels = useMemo(
    () =>
      isGoogleVertex
        ? (registryQuery.data ?? []).map((model) => ({
            ...model,
            id: model.id.startsWith('google/')
              ? model.id
              : `google/${model.id}`,
          }))
        : (registryQuery.data ?? []),
    [isGoogleVertex, registryQuery.data],
  )
  const modelOptions = useMemo(
    () => mergeModelOptions(props.providerModels, registryModels),
    [props.providerModels, registryModels],
  )
  const modelsDisabled = isLobeHub
    ? !lobeHubConnected
    : !decisionEnabled && piProviderId === null && modelOptions.length === 0
  const modelMatch = useMemo(
    () =>
      provider
        ? matchRegistryModel(registryModels, provider.defaultModel)
        : undefined,
    [registryModels, provider],
  )
  const showCustomTokenFields = Boolean(
    provider &&
    !isLobeHub &&
    !decisionEnabled &&
    provider.defaultModel.trim() &&
    !modelMatch,
  )

  const refreshModels = async () => {
    if (!provider) return
    setFetching(true)
    try {
      const response = await getModelList({
        apiKey: provider.apiKey || undefined,
        endpoint: provider.endpoint || undefined,
        modelListUrl: provider.modelListUrl || undefined,
        providerId: provider.id,
        type: provider.type,
      })
      const fetchedModels = response.models ?? []
      queryClient.setQueryData<Record<string, AIProviderModel[]>>(
        props.modelCacheKey,
        (current) => ({ ...current, [provider.id]: fetchedModels }),
      )
      if (response.error)
        toast.warning(
          t('settings.ai.toast.modelListError', { message: response.error }),
        )
      else if (fetchedModels.length === 0)
        toast.info(t('settings.ai.toast.modelListEmpty'))
      else
        toast.success(
          t('settings.ai.toast.modelListUpdated', {
            count: fetchedModels.length,
          }),
        )
    } catch (error) {
      toast.error(
        getErrorMessage(error, t('settings.ai.error.fetchModelsFailed')),
      )
    } finally {
      setFetching(false)
    }
  }

  const testProvider = async () => {
    if (!provider) return
    if (!provider.defaultModel.trim()) {
      toast.warning(t('settings.ai.toast.needDefaultModel'))
      return
    }
    setTesting(true)
    try {
      await testConfig({
        apiKey: provider.apiKey || undefined,
        appendV1: provider.appendV1,
        endpoint: provider.endpoint || undefined,
        model: provider.defaultModel,
        providerId: provider.id,
        type: provider.type,
      })
      toast.success(t('settings.ai.toast.testSuccess'))
    } catch (error) {
      toast.error(getErrorMessage(error, t('settings.ai.error.testFailed')))
    } finally {
      setTesting(false)
    }
  }

  return (
    <Drawer
      footer={
        provider && (textEnabled || decisionEnabled) ? (
          <Flexbox gap={8} horizontal justify="flex-end">
            <Button
              disabled={isLobeHub && !lobeHubConnected}
              loading={fetching}
              onClick={() => void refreshModels()}
              htmlType="button"
              type="text"
            >
              {t('settings.ai.action.fetchModels')}
            </Button>
            <Button
              disabled={isLobeHub && !lobeHubConnected}
              loading={testing}
              onClick={() => void testProvider()}
              htmlType="button"
              type="text"
            >
              {t('settings.ai.action.testConnection')}
            </Button>
          </Flexbox>
        ) : null
      }
      onClose={props.onClose}
      open={Boolean(provider)}
      title={
        provider ? (
          <Flexbox align="center" gap={8} horizontal>
            <AIProviderAvatar provider={provider} />
            <span>{formatAIProviderLabel(provider)}</span>
          </Flexbox>
        ) : (
          ''
        )
      }
    >
      {provider ? (
        <Flexbox gap={24}>
          <p className={stylex.props(styles.note).className}>
            {settingsCopy(locale, 'stagedInDrawer')}
          </p>
          <Flexbox align="center" gap={12} horizontal justify="space-between">
            <Checkbox
              checked={provider.enabled}
              onChange={(enabled) => props.onChange({ enabled })}
            >
              {t('settings.oauth.switch.enabled')}
            </Checkbox>
            {isLobeHub || decisionEnabled ? (
              <Tag>
                {t(
                  decisionEnabled
                    ? 'settings.ai.capability.decision'
                    : 'settings.ai.capability.text',
                )}
              </Tag>
            ) : null}
          </Flexbox>
          {!isLobeHub && !decisionEnabled ? (
            <Flexbox gap={12}>
              <span {...stylex.props(styles.label)}>
                {t('settings.ai.field.capabilities')}
              </span>
              <Checkbox
                checked={provider.capabilities?.text ?? true}
                onChange={(text) =>
                  props.onChange({
                    capabilities: {
                      text,
                      image: provider.capabilities?.image ?? false,
                      speech: provider.capabilities?.speech ?? false,
                    },
                  })
                }
              >
                {t('settings.ai.capability.text')}
              </Checkbox>
              <Checkbox
                checked={provider.capabilities?.image ?? false}
                onChange={(image) =>
                  props.onChange({
                    capabilities: {
                      text: provider.capabilities?.text ?? true,
                      image,
                      speech: provider.capabilities?.speech ?? false,
                    },
                  })
                }
              >
                {t('settings.ai.capability.image')}
              </Checkbox>
              <Checkbox
                checked={provider.capabilities?.speech ?? false}
                onChange={(speech) =>
                  props.onChange({
                    capabilities: {
                      text: provider.capabilities?.text ?? true,
                      image: provider.capabilities?.image ?? false,
                      speech,
                    },
                  })
                }
              >
                {t('settings.ai.capability.speech')}
              </Checkbox>
            </Flexbox>
          ) : null}
          <FieldShell label={t('settings.ai.field.providerType')}>
            <SelectField<AIProviderType>
              aria-label={t('settings.ai.field.providerType')}
              onValueChange={(type) =>
                props.onChange({
                  defaultModel: getDefaultAIModel(type),
                  type,
                  capabilities: {
                    text: type !== 'typesafe',
                    decision: type === 'typesafe',
                    image: false,
                    speech: false,
                  },
                  ...(type === 'lobehub'
                    ? {
                        apiKey: '',
                        endpoint: '',
                        modelListUrl: '',
                        voiceListUrl: '',
                        appendV1: false,
                      }
                    : {}),
                  ...(type === 'typesafe'
                    ? { endpoint: 'https://api.typesafe.ai/v1' }
                    : {}),
                })
              }
              options={aiProviderTypeOptions.map((option) => ({
                label: t(option.labelKey),
                value: option.value,
              }))}
              value={provider.type}
            />
          </FieldShell>
          <FieldShell label={t('settings.ai.field.displayName')}>
            <TextInput
              onChange={(name) => props.onChange({ name })}
              placeholder={getAIProviderNamePlaceholder(t, provider.type)}
              value={provider.name}
            />
          </FieldShell>
          {isLobeHub ? (
            <LobeHubConnection
              onConnected={refreshModels}
              onDisconnected={() =>
                queryClient.setQueryData<Record<string, AIProviderModel[]>>(
                  props.modelCacheKey,
                  (current) => ({ ...current, [provider.id]: [] }),
                )
              }
              onStatusChange={setLobeHubConnected}
            />
          ) : (
            <FieldShell label={t('settings.ai.field.apiKey')}>
              <InputPassword
                autoComplete="new-password"
                onChange={(event) =>
                  props.onChange({ apiKey: event.target.value })
                }
                placeholder={getAIProviderKeyPlaceholder(provider.type)}
                value={provider.apiKey}
              />
            </FieldShell>
          )}
          {matchedPreset?.apiKeyUrl || matchedPreset?.websiteUrl ? (
            <div {...stylex.props(styles.links)}>
              {matchedPreset.apiKeyUrl ? (
                <a
                  {...stylex.props(styles.link)}
                  href={matchedPreset.apiKeyUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t('settings.ai.preset.getApiKey')}
                  <ExternalLink
                    aria-hidden="true"
                    {...stylex.props(styles.linkIcon)}
                  />
                </a>
              ) : null}
              {matchedPreset.websiteUrl ? (
                <a
                  {...stylex.props(styles.link, styles.secondaryLink)}
                  href={matchedPreset.websiteUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t('settings.ai.preset.website')}
                  <ExternalLink
                    aria-hidden="true"
                    {...stylex.props(styles.linkIcon)}
                  />
                </a>
              ) : null}
            </div>
          ) : null}
          {isGoogleVertex ? (
            <FieldShell label={t('settings.ai.field.projectId')}>
              <TextInput
                onChange={(projectId) => {
                  const preset = aiProviderPresets.find(
                    (item) => item.id === 'googleVertex',
                  )
                  props.onChange({
                    projectId,
                    endpoint:
                      interpolatePresetTemplate(preset?.endpoint, {
                        projectId,
                      }) ?? provider.endpoint,
                  })
                }}
                placeholder={t('settings.ai.preset.modal.projectIdPlaceholder')}
                spellCheck={false}
                value={provider.projectId ?? ''}
              />
            </FieldShell>
          ) : null}
          {showEndpoint ? (
            <FieldShell label={t('settings.ai.field.endpoint')}>
              <TextInput
                onChange={(endpoint) => props.onChange({ endpoint })}
                placeholder={
                  provider.type === 'openai-compatible' || isGoogleVertex
                    ? t('settings.ai.placeholder.endpointCompatible')
                    : t('settings.ai.placeholder.endpointDefault')
                }
                value={provider.endpoint ?? ''}
              />
            </FieldShell>
          ) : null}
          {textEnabled &&
          provider.type !== 'anthropic' &&
          !isGoogleVertex &&
          !isLobeHub ? (
            <>
              <FieldShell label={t('settings.ai.field.modelListUrl')}>
                <TextInput
                  onChange={(modelListUrl) => props.onChange({ modelListUrl })}
                  placeholder={t('settings.ai.placeholder.modelListUrl')}
                  value={provider.modelListUrl ?? ''}
                />
              </FieldShell>
              <Checkbox
                checked={provider.appendV1 ?? true}
                onChange={(appendV1) => props.onChange({ appendV1 })}
              >
                {t('settings.ai.field.appendV1')}
              </Checkbox>
            </>
          ) : null}
          {provider.capabilities?.speech && !isGoogleVertex && !isLobeHub ? (
            <FieldShell label={t('settings.ai.field.voiceListUrl')}>
              <TextInput
                onChange={(voiceListUrl) => props.onChange({ voiceListUrl })}
                placeholder={t('settings.ai.placeholder.voiceListUrl')}
                value={provider.voiceListUrl ?? ''}
              />
            </FieldShell>
          ) : null}
          {textEnabled || decisionEnabled ? (
            <>
              <FieldShell label={t('settings.ai.field.defaultModel')}>
                <ModelCombobox
                  disabled={modelsDisabled}
                  loading={registryQuery.isFetching}
                  models={modelOptions}
                  onChange={(defaultModel) => props.onChange({ defaultModel })}
                  placeholder={getAIProviderModelPlaceholder(t, provider.type)}
                  value={provider.defaultModel}
                />
              </FieldShell>
              {showCustomTokenFields ? (
                <>
                  <FieldShell label={t('settings.ai.field.contextWindow')}>
                    <TextInput
                      inputMode="numeric"
                      onChange={(value) =>
                        props.onChange({
                          contextWindow: value.trim()
                            ? Number(value)
                            : undefined,
                        })
                      }
                      type="number"
                      value={
                        provider.contextWindow == null
                          ? ''
                          : String(provider.contextWindow)
                      }
                    />
                  </FieldShell>
                  <FieldShell label={t('settings.ai.field.maxTokens')}>
                    <TextInput
                      inputMode="numeric"
                      onChange={(value) =>
                        props.onChange({
                          maxTokens: value.trim() ? Number(value) : undefined,
                        })
                      }
                      type="number"
                      value={
                        provider.maxTokens == null
                          ? ''
                          : String(provider.maxTokens)
                      }
                    />
                  </FieldShell>
                </>
              ) : null}
            </>
          ) : null}
        </Flexbox>
      ) : null}
    </Drawer>
  )
}

function ModelCombobox(props: {
  disabled?: boolean
  loading?: boolean
  models: AIProviderModel[]
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  const { t } = useI18n()
  const modelById = useMemo(
    () => new Map(props.models.map((model) => [model.id, model])),
    [props.models],
  )
  const filterModel = useCallback(
    (itemValue: unknown, query: string) => {
      if (typeof itemValue !== 'string') return false
      const normalizedQuery = query.trim().toLocaleLowerCase()
      const model = modelById.get(itemValue)
      return [itemValue, model?.name].some((value) =>
        value?.toLocaleLowerCase().includes(normalizedQuery),
      )
    },
    [modelById],
  )

  const options = useMemo(
    () =>
      props.models.map((model) => ({
        label: (
          <AIModelOptionLabel
            id={model.id}
            name={model.name}
            pricing={formatAIModelPricing(model.pricing, t)}
          />
        ),
        value: model.id,
      })),
    [props.models, t],
  )

  return (
    <AutoComplete
      disabled={props.disabled}
      prefix={props.value ? <AIModelAvatar model={props.value} /> : undefined}
      filter={(item, query) =>
        filterModel(
          item && typeof item === 'object' && 'value' in item
            ? String(item.value)
            : '',
          query,
        )
      }
      value={props.value}
      onChange={props.onChange}
      options={options}
      placeholder={props.placeholder}
      suffix={props.loading ? <Spin size="small" /> : undefined}
    />
  )
}
