import {
  AutoComplete,
  Checkbox,
  createStaticStyles,
  Flexbox,
  InputPassword,
  toast,
} from '@lobehub/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Loader2, Settings } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { getModelList, getRegistryModels, testConfig } from '~/api/ai'
import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { Button } from '~/ui/primitives/button'
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

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  draftNote: css`
    color: ${cssVar.colorTextSecondary};
    font-size: 14px;
    line-height: 22px;
  `,
  u0bb529bd: css`
    width: 1rem;
    height: 1rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite; /* lobe-design-ignore LOBE-MOTION-DURATION: a status spinner needs a full turn */
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  ube28d39b: css`
    width: min(90vw, 32rem);
  `,
  uec979b4f: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1.25rem;
    }
    overflow-y: auto;
    padding: 1rem;
  `,
  u8e0c3efc: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
    border-radius: 14px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  u9b5df76b: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorText};
  `,
  ufa2251b6: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u5c1f5c15: css`
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  u64721834: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: ${cssVar.colorPrimary};
    &:hover {
      text-decoration: underline;
    }
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  u343fbed5: css`
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: ${cssVar.colorTextSecondary};
    &:hover {
      color: ${cssVar.colorText};
    }
    &:hover {
      text-decoration: underline;
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  uff4d2db0: css`
    max-height: 18rem;
  `,
  ueb6a3cef: css`
    padding: 0.25rem;
  `,
  ube1287d2: css`
    display: flex;
    min-width: 0px;
    align-items: center;
    gap: 0.75rem;
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u10c992af: css`
    margin-left: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  ub2ddbe74: css`
    flex-shrink: 0;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
  `,
}))

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
  const provider = props.provider
  const decisionEnabled = provider?.type === 'typesafe'
  const textEnabled = provider?.capabilities?.text ?? true
  const matchedPreset = provider ? findAIProviderPreset(provider) : undefined
  const isGoogleVertex = provider?.type === 'google-vertex'

  const showEndpoint = Boolean(provider)
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
  const modelsDisabled =
    !decisionEnabled && piProviderId === null && modelOptions.length === 0
  const modelMatch = useMemo(
    () =>
      provider
        ? matchRegistryModel(registryModels, provider.defaultModel)
        : undefined,
    [registryModels, provider],
  )
  const showCustomTokenFields = Boolean(
    provider && !decisionEnabled && provider.defaultModel.trim() && !modelMatch,
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
              disabled={fetching}
              onClick={() => void refreshModels()}
              type="button"
              variant="subtle"
            >
              {fetching ? (
                <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
              ) : null}
              {t('settings.ai.action.fetchModels')}
            </Button>
            <Button
              disabled={testing}
              onClick={() => void testProvider()}
              type="button"
              variant="subtle"
            >
              {testing ? (
                <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
              ) : null}
              {t('settings.ai.action.testConnection')}
            </Button>
          </Flexbox>
        ) : null
      }
      icon={Settings}
      onClose={props.onClose}
      open={Boolean(provider)}
      title={provider ? formatAIProviderLabel(provider) : ''}
      widthClassName={lobeStyles.ube28d39b}
    >
      {provider ? (
        <div className={lobeStyles.uec979b4f}>
          <p className={lobeStyles.draftNote}>
            {settingsCopy(locale, 'stagedInDrawer')}
          </p>
          <Checkbox
            checked={provider.enabled}
            onChange={(enabled) => props.onChange({ enabled })}
          >
            {t('settings.oauth.switch.enabled')}
          </Checkbox>
          <div className={lobeStyles.u8e0c3efc}>
            {decisionEnabled ? (
              <p className={lobeStyles.u9b5df76b}>
                {t('settings.ai.capability.decision')}
              </p>
            ) : (
              <>
                <div className={lobeStyles.ufa2251b6}>
                  {t('settings.ai.field.capabilities')}
                </div>
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
              </>
            )}
          </div>
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
          <TextInput
            label={t('settings.ai.field.displayName')}
            onChange={(name) => props.onChange({ name })}
            placeholder={getAIProviderNamePlaceholder(t, provider.type)}
            value={provider.name}
          />
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
          {matchedPreset?.apiKeyUrl || matchedPreset?.websiteUrl ? (
            <div className={lobeStyles.u5c1f5c15}>
              {matchedPreset.apiKeyUrl ? (
                <a
                  className={lobeStyles.u64721834}
                  href={matchedPreset.apiKeyUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t('settings.ai.preset.getApiKey')}
                  <ExternalLink
                    aria-hidden="true"
                    className={lobeStyles.uef2d6f74}
                  />
                </a>
              ) : null}
              {matchedPreset.websiteUrl ? (
                <a
                  className={lobeStyles.u343fbed5}
                  href={matchedPreset.websiteUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t('settings.ai.preset.website')}
                  <ExternalLink
                    aria-hidden="true"
                    className={lobeStyles.uef2d6f74}
                  />
                </a>
              ) : null}
            </div>
          ) : null}
          {isGoogleVertex ? (
            <TextInput
              label={t('settings.ai.field.projectId')}
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
          ) : null}
          {showEndpoint ? (
            <TextInput
              label={t('settings.ai.field.endpoint')}
              onChange={(endpoint) => props.onChange({ endpoint })}
              placeholder={
                provider.type === 'openai-compatible' || isGoogleVertex
                  ? t('settings.ai.placeholder.endpointCompatible')
                  : t('settings.ai.placeholder.endpointDefault')
              }
              value={provider.endpoint ?? ''}
            />
          ) : null}
          {textEnabled && provider.type !== 'anthropic' && !isGoogleVertex ? (
            <>
              <TextInput
                label={t('settings.ai.field.modelListUrl')}
                onChange={(modelListUrl) => props.onChange({ modelListUrl })}
                placeholder={t('settings.ai.placeholder.modelListUrl')}
                value={provider.modelListUrl ?? ''}
              />
              <Checkbox
                checked={provider.appendV1 ?? true}
                onChange={(appendV1) => props.onChange({ appendV1 })}
              >
                {t('settings.ai.field.appendV1')}
              </Checkbox>
            </>
          ) : null}
          {provider.capabilities?.speech && !isGoogleVertex ? (
            <TextInput
              label={t('settings.ai.field.voiceListUrl')}
              onChange={(voiceListUrl) => props.onChange({ voiceListUrl })}
              placeholder={t('settings.ai.placeholder.voiceListUrl')}
              value={provider.voiceListUrl ?? ''}
            />
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
                  <TextInput
                    inputMode="numeric"
                    label={t('settings.ai.field.contextWindow')}
                    onChange={(value) =>
                      props.onChange({
                        contextWindow: value.trim() ? Number(value) : undefined,
                      })
                    }
                    type="number"
                    value={
                      provider.contextWindow == null
                        ? ''
                        : String(provider.contextWindow)
                    }
                  />
                  <TextInput
                    inputMode="numeric"
                    label={t('settings.ai.field.maxTokens')}
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
                </>
              ) : null}
            </>
          ) : null}
        </div>
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
      props.models.map((model) => {
        const name = model.name || model.id
        const pricing = formatAIModelPricing(model.pricing, t)
        return {
          label: (
            <span className={lobeStyles.ube1287d2}>
              <span className={lobeStyles.u67bab313}>
                <span>{name}</span>
                {name !== model.id ? (
                  <span className={lobeStyles.u10c992af}>{model.id}</span>
                ) : null}
              </span>
              {pricing ? (
                <span className={lobeStyles.ub2ddbe74}>{pricing}</span>
              ) : null}
            </span>
          ),
          value: model.id,
        }
      }),
    [props.models, t],
  )

  return (
    <AutoComplete
      disabled={props.disabled}
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
      suffix={
        props.loading ? (
          <Loader2 aria-hidden="true" className={lobeStyles.u0bb529bd} />
        ) : undefined
      }
    />
  )
}
