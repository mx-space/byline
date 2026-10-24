import {
  ActionIcon,
  confirmModal,
  DropdownMenu,
  Empty,
  Flexbox,
  InputNumber,
  Select,
  Switch,
  Tag,
  toast,
} from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { getModelsByCapability } from '~/api/ai'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import { Button } from '~/ui/site-button'

import {
  type AIProviderPreset,
  type AIProviderPresetCategory,
  createProviderFromPreset,
  groupAIProviderPresets,
} from '../../config/aiProviderPresets'
import { settingsAiCopy, settingsCopy } from '../../copy'
import type {
  AIConfig,
  AIModelAssignment,
  AIProviderCapability,
  AIProviderConfig,
  AIProviderModel,
} from '../../types/settings'
import { formatAIProviderLabel } from '../../utils/settings'
import { SettingRow, SettingsGroup } from '../SettingsPrimitives'
import { AIModelAssignmentField } from './AIModelAssignmentField'
import { AIProviderDrawer } from './AIProviderDrawer'
import { presentAIProviderPresetModal } from './AIProviderPresetModal'
import { AITextListField } from './AITextListField'
import { TtsVoiceField } from './TtsVoiceField'

const MODEL_STALE_MS = 24 * 60 * 60 * 1000

const PRESET_CATEGORY_LABEL_KEYS: Record<
  AIProviderPresetCategory,
  TranslationKey
> = {
  aggregator: 'settings.ai.preset.category.aggregator',
  cn_official: 'settings.ai.preset.category.cnOfficial',
  custom: 'settings.ai.preset.category.custom',
  official: 'settings.ai.preset.category.official',
}

const PRESET_NAME_KEYS: Partial<Record<string, TranslationKey>> = {
  anthropic: 'settings.ai.preset.name.anthropic',
  custom: 'settings.ai.preset.name.custom',
  deepseek: 'settings.ai.preset.name.deepseek',
  google: 'settings.ai.preset.name.google',
  googleVertex: 'settings.ai.preset.name.googleVertex',
  moonshot: 'settings.ai.preset.name.moonshot',
  openai: 'settings.ai.preset.name.openai',
  openrouter: 'settings.ai.preset.name.openrouter',
  siliconflow: 'settings.ai.preset.name.siliconflow',
  xai: 'settings.ai.preset.name.xai',
}

const ASPECT_RATIOS = ['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16']

async function getProviderModels(capability: AIProviderCapability) {
  const response = await getModelsByCapability(capability)
  const entries: Array<[string, AIProviderModel[]]> = response.map(
    (provider) => [provider.providerId, provider.models ?? []],
  )
  return Object.fromEntries(entries) as Record<string, AIProviderModel[]>
}

function useCapabilityModels(
  capability: AIProviderCapability,
  modelCacheKey: readonly unknown[],
  enabled: boolean,
) {
  const query = useQuery({
    enabled,
    queryFn: () => getProviderModels(capability),
    queryKey:
      capability === 'text' ? modelCacheKey : [...modelCacheKey, capability],
    staleTime: MODEL_STALE_MS,
  })
  return query.data ?? {}
}

export function AIConfigEditor(props: {
  modelCacheKey: readonly unknown[]
  onChange: (value: AIConfig) => void
  value: AIConfig
}) {
  const { locale, t } = useI18n()
  const ai = (key: Parameters<typeof settingsAiCopy>[1]) =>
    settingsAiCopy(locale, key)
  const [editingId, setEditingId] = useState<string | null>(null)
  const config = props.value
  const providers = config.providers ?? []
  const hasEnabled = (capability: AIProviderCapability) =>
    providers.some(
      (provider) =>
        provider.enabled &&
        (capability === 'text'
          ? (provider.capabilities?.text ?? true)
          : Boolean(provider.capabilities?.[capability])),
    )

  const textModels = useCapabilityModels(
    'text',
    props.modelCacheKey,
    hasEnabled('text'),
  )
  const speechModels = useCapabilityModels(
    'speech',
    props.modelCacheKey,
    hasEnabled('speech'),
  )
  const imageModels = useCapabilityModels(
    'image',
    props.modelCacheKey,
    hasEnabled('image'),
  )
  const decisionModels = useCapabilityModels(
    'decision',
    props.modelCacheKey,
    hasEnabled('decision'),
  )

  const update = (patch: Partial<AIConfig>) =>
    props.onChange({ ...config, ...patch })

  const updateProvider = (id: string, patch: Partial<AIProviderConfig>) =>
    update({
      providers: providers.map((provider) =>
        provider.id === id ? { ...provider, ...patch } : provider,
      ),
    })

  const updateImage = (patch: NonNullable<AIConfig['imageGeneration']>) =>
    update({ imageGeneration: { ...config.imageGeneration, ...patch } })

  const updateTts = (patch: NonNullable<AIConfig['tts']>) =>
    update({ tts: { ...config.tts, ...patch } })

  const addProviderFromPreset = async (preset: AIProviderPreset) => {
    const values = preset.templateFields?.length
      ? await presentAIProviderPresetModal(preset)
      : {}
    if (values === undefined) return
    const provider = createProviderFromPreset(preset, values)
    update({ providers: [...providers, provider] })
    setEditingId(provider.id)
  }

  const deleteProvider = (id: string) => {
    const references = [
      config.decisionModel,
      config.summaryModel,
      config.writerModel,
      config.translationModel,
      config.translationReviewModel,
      config.fieldTranslationModel,
      config.insightsModel,
      config.insightsTranslationModel,
      config.imageGeneration?.model,
      config.tts?.model,
    ]
    if (references.some((assignment) => assignment?.providerId === id)) {
      toast.warning(t('settings.ai.error.providerInUse'))
      return
    }
    const provider = providers.find((item) => item.id === id)
    confirmModal({
      cancelText: settingsCopy(locale, 'leaveCancel'),
      content: settingsCopy(locale, 'removeProviderBody'),
      okButtonProps: { danger: true },
      okText: settingsCopy(locale, 'removeProviderConfirm'),
      onOk: () =>
        update({ providers: providers.filter((item) => item.id !== id) }),
      title: settingsCopy(locale, 'removeProviderTitle', {
        name: provider ? formatAIProviderLabel(provider) : id,
      }),
    })
  }

  const capabilityLabels = (provider: AIProviderConfig) =>
    [
      provider.capabilities?.decision
        ? t('settings.ai.capability.decision')
        : null,
      (provider.capabilities?.text ?? true)
        ? t('settings.ai.capability.text')
        : null,
      provider.capabilities?.image ? t('settings.ai.capability.image') : null,
      provider.capabilities?.speech ? t('settings.ai.capability.speech') : null,
    ]
      .filter(Boolean)
      .join(' · ') || ai('providerCapabilityNone')

  const modelRow = (input: {
    capability?: AIProviderCapability
    desc: string
    divider?: boolean
    label: string
    models: Record<string, AIProviderModel[]>
    onChange: (value: AIModelAssignment | null) => void
    placeholder?: string
    value?: AIModelAssignment | null
  }) => (
    <SettingRow
      desc={input.desc}
      divider={input.divider ?? true}
      label={input.label}
      wide
    >
      <AIModelAssignmentField
        capability={input.capability}
        label={input.label}
        modelPlaceholder={input.placeholder}
        models={input.models}
        onChange={input.onChange}
        providers={providers}
        value={input.value}
      />
    </SettingRow>
  )

  const toggleRow = (input: {
    checked: boolean
    desc: string
    divider?: boolean
    label: string
    onChange: (checked: boolean) => void
  }) => (
    <SettingRow
      desc={input.desc}
      divider={input.divider}
      label={input.label}
      width="auto"
    >
      <Switch
        aria-label={input.label}
        checked={input.checked}
        onChange={input.onChange}
      />
    </SettingRow>
  )

  const languagesRow = (input: {
    desc: string
    onChange: (value: string[]) => void
    value?: string[]
  }) => (
    <SettingRow desc={input.desc} divider label={ai('targetLanguages')} wide>
      <AITextListField
        label={ai('targetLanguages')}
        onChange={input.onChange}
        value={input.value ?? []}
      />
    </SettingRow>
  )

  const numberRow = (input: {
    desc: string
    label: string
    max: number
    min: number
    onChange: (value: number) => void
    step?: number
    value: number
    fallback: number
  }) => (
    <SettingRow desc={input.desc} divider label={input.label} width={160}>
      <InputNumber
        aria-label={input.label}
        max={input.max}
        min={input.min}
        onChange={(next) =>
          input.onChange(typeof next === 'number' ? next : input.fallback)
        }
        step={input.step}
        style={{ width: '100%' }}
        value={input.value}
      />
    </SettingRow>
  )

  const selectRow = <V extends string>(input: {
    desc: string
    label: string
    onChange: (value: V) => void
    options: Array<{ label: ReactNode; value: V }>
    value: V
  }) => (
    <SettingRow desc={input.desc} divider label={input.label} width={160}>
      <Select
        aria-label={input.label}
        onChange={(next) => {
          if (typeof next === 'string') input.onChange(next as V)
        }}
        options={input.options}
        style={{ width: '100%' }}
        value={input.value}
      />
    </SettingRow>
  )

  const presetItems = groupAIProviderPresets().map((group) => ({
    children: group.presets.map((preset) => {
      const nameKey = PRESET_NAME_KEYS[preset.id]
      return {
        desc: preset.endpoint || undefined,
        key: preset.id,
        label: nameKey ? t(nameKey) : preset.name,
        onClick: () => void addProviderFromPreset(preset),
      }
    }),
    key: group.category,
    label: t(PRESET_CATEGORY_LABEL_KEYS[group.category]),
    type: 'group' as const,
  }))

  const editingProvider =
    providers.find((provider) => provider.id === editingId) ?? null
  const image = config.imageGeneration
  const tts = config.tts

  return (
    <>
      <SettingsGroup
        desc={ai('providersDesc')}
        extra={
          <DropdownMenu items={presetItems} placement="bottomRight">
            <Button icon={Plus} size="small">
              {t('settings.ai.action.addProvider')}
            </Button>
          </DropdownMenu>
        }
        title={ai('providersTitle')}
      >
        {providers.length === 0 ? (
          <Empty
            description={ai('providersEmpty')}
            icon={Settings2}
            title={t('settings.ai.empty.providers')}
          />
        ) : (
          providers.map((provider, index) => (
            <SettingRow
              desc={capabilityLabels(provider)}
              divider={index > 0}
              key={provider.id}
              label={
                <Flexbox align="center" as="span" gap={8} horizontal>
                  <span>{formatAIProviderLabel(provider)}</span>
                  {provider.enabled ? null : (
                    <Tag size="small">{ai('providerDisabled')}</Tag>
                  )}
                </Flexbox>
              }
              width="auto"
            >
              <Flexbox align="center" gap={4} horizontal>
                <Switch
                  aria-label={t('settings.oauth.switch.enabled')}
                  checked={provider.enabled}
                  onChange={(enabled) =>
                    updateProvider(provider.id, { enabled })
                  }
                />
                <ActionIcon
                  icon={Pencil}
                  onClick={() => setEditingId(provider.id)}
                  title={t('settings.ai.provider.editAction')}
                />
                <ActionIcon
                  icon={Trash2}
                  onClick={() => deleteProvider(provider.id)}
                  title={t('common.delete')}
                />
              </Flexbox>
            </SettingRow>
          ))
        )}
      </SettingsGroup>

      <SettingsGroup
        desc={ai('translationDesc')}
        extra={
          <Switch
            aria-label={t('settings.ai.switch.enableTranslation')}
            checked={Boolean(config.enableTranslation)}
            onChange={(enableTranslation) => update({ enableTranslation })}
          />
        }
        title={ai('translationTitle')}
      >
        {config.enableTranslation ? (
          <>
            {languagesRow({
              desc: ai('translationLanguagesDesc'),
              onChange: (translationTargetLanguages) =>
                update({ translationTargetLanguages }),
              value: config.translationTargetLanguages,
            })}
            {modelRow({
              desc: ai('translationModelDesc'),
              label: ai('translationModelLabel'),
              models: textModels,
              onChange: (translationModel) => update({ translationModel }),
              value: config.translationModel,
            })}
            {modelRow({
              desc: ai('fieldTranslationDesc'),
              label: ai('fieldTranslationLabel'),
              models: textModels,
              onChange: (fieldTranslationModel) =>
                update({ fieldTranslationModel }),
              value: config.fieldTranslationModel,
            })}
            {toggleRow({
              checked: Boolean(config.enableTranslationReview),
              desc: ai('translationReviewDesc'),
              divider: true,
              label: t('settings.ai.switch.enableTranslationReview'),
              onChange: (enableTranslationReview) =>
                update({ enableTranslationReview }),
            })}
            {config.enableTranslationReview
              ? modelRow({
                  desc: ai('translationReviewModelDesc'),
                  label: ai('translationReviewModelLabel'),
                  models: textModels,
                  onChange: (translationReviewModel) =>
                    update({ translationReviewModel }),
                  value: config.translationReviewModel,
                })
              : null}
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        desc={ai('summaryDesc')}
        extra={
          <Switch
            aria-label={t('settings.ai.switch.enableSummary')}
            checked={Boolean(config.enableSummary)}
            onChange={(enableSummary) => update({ enableSummary })}
          />
        }
        title={ai('summaryTitle')}
      >
        {config.enableSummary ? (
          <>
            {modelRow({
              desc: ai('summaryModelDesc'),
              label: ai('summaryModelLabel'),
              models: textModels,
              onChange: (summaryModel) => update({ summaryModel }),
              value: config.summaryModel,
            })}
            {languagesRow({
              desc: ai('summaryLanguagesDesc'),
              onChange: (summaryTargetLanguages) =>
                update({ summaryTargetLanguages }),
              value: config.summaryTargetLanguages,
            })}
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        desc={ai('insightsDesc')}
        extra={
          <Switch
            aria-label={t('settings.ai.switch.enableInsights')}
            checked={Boolean(config.enableInsights)}
            onChange={(enableInsights) => update({ enableInsights })}
          />
        }
        title={ai('insightsTitle')}
      >
        {config.enableInsights ? (
          <>
            {modelRow({
              desc: ai('insightsModelDesc'),
              label: ai('insightsModelLabel'),
              models: textModels,
              onChange: (insightsModel) => update({ insightsModel }),
              value: config.insightsModel,
            })}
            {toggleRow({
              checked: Boolean(config.enableAutoTranslateInsights),
              desc: ai('autoTranslateInsightsDesc'),
              divider: true,
              label: t('settings.ai.switch.enableAutoTranslateInsights'),
              onChange: (enableAutoTranslateInsights) =>
                update({ enableAutoTranslateInsights }),
            })}
            {config.enableAutoTranslateInsights ? (
              <>
                {languagesRow({
                  desc: ai('insightsLanguagesDesc'),
                  onChange: (insightsTargetLanguages) =>
                    update({ insightsTargetLanguages }),
                  value: config.insightsTargetLanguages,
                })}
                {modelRow({
                  desc: ai('insightsTranslationDesc'),
                  label: ai('insightsTranslationLabel'),
                  models: textModels,
                  onChange: (insightsTranslationModel) =>
                    update({ insightsTranslationModel }),
                  value: config.insightsTranslationModel,
                })}
              </>
            ) : null}
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        desc={ai('imageEnableDesc')}
        extra={
          <Switch
            aria-label={t('settings.ai.switch.enableImageGeneration')}
            checked={Boolean(image?.enable)}
            onChange={(enable) => updateImage({ enable })}
          />
        }
        title={ai('imageTitle')}
      >
        {image?.enable ? (
          <>
            {modelRow({
              capability: 'image',
              desc: ai('imageModelDesc'),
              label: ai('imageModelLabel'),
              models: imageModels,
              onChange: (model) => updateImage({ model }),
              placeholder: t('settings.ai.assignment.mediaModelPlaceholder'),
              value: image.model,
            })}
            {selectRow({
              desc: ai('imageAspectDesc'),
              label: t('settings.ai.field.defaultAspectRatio'),
              onChange: (defaultAspectRatio) =>
                updateImage({ defaultAspectRatio }),
              options: ASPECT_RATIOS.map((value) => ({ label: value, value })),
              value: image.defaultAspectRatio ?? '16:9',
            })}
            {selectRow<'high' | 'low' | 'standard'>({
              desc: ai('imageQualityDesc'),
              label: t('settings.ai.field.defaultQuality'),
              onChange: (defaultQuality) => updateImage({ defaultQuality }),
              options: [
                { label: t('settings.ai.option.qualityLow'), value: 'low' },
                {
                  label: t('settings.ai.option.qualityStandard'),
                  value: 'standard',
                },
                { label: t('settings.ai.option.qualityHigh'), value: 'high' },
              ],
              value: image.defaultQuality ?? 'standard',
            })}
            {selectRow<'jpeg' | 'png' | 'webp'>({
              desc: ai('imageFormatDesc'),
              label: t('settings.ai.field.defaultFormat'),
              onChange: (defaultFormat) => updateImage({ defaultFormat }),
              options: (['png', 'jpeg', 'webp'] as const).map((value) => ({
                label: value.toUpperCase(),
                value,
              })),
              value: image.defaultFormat ?? 'png',
            })}
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup
        desc={ai('ttsEnableDesc')}
        extra={
          <Switch
            aria-label={t('settings.ai.switch.enableTts')}
            checked={Boolean(tts?.enable)}
            onChange={(enable) => updateTts({ enable })}
          />
        }
        title={ai('ttsTitle')}
      >
        {tts?.enable ? (
          <>
            {modelRow({
              capability: 'speech',
              desc: ai('ttsModelDesc'),
              label: ai('ttsModelLabel'),
              models: speechModels,
              onChange: (model) => updateTts({ model }),
              placeholder: t('settings.ai.assignment.mediaModelPlaceholder'),
              value: tts.model,
            })}
            <SettingRow
              desc={ai('ttsVoiceDesc')}
              divider
              label={t('settings.ai.field.voice')}
            >
              <TtsVoiceField
                model={tts.model?.model}
                onChange={(voice) => updateTts({ voice })}
                providerId={tts.model?.providerId}
                value={tts.voice ?? ''}
              />
            </SettingRow>
            {numberRow({
              desc: ai('ttsSpeedDesc'),
              fallback: 1,
              label: t('settings.ai.field.speed'),
              max: 4,
              min: 0.25,
              onChange: (speed) => updateTts({ speed }),
              step: 0.25,
              value: tts.speed ?? 1,
            })}
            {numberRow({
              desc: ai('ttsChunkDesc'),
              fallback: 1800,
              label: t('settings.ai.field.maxCharsPerChunk'),
              max: 4000,
              min: 200,
              onChange: (maxCharsPerChunk) => updateTts({ maxCharsPerChunk }),
              value: tts.maxCharsPerChunk ?? 1800,
            })}
            {numberRow({
              desc: ai('ttsConcurrencyDesc'),
              fallback: 3,
              label: t('settings.ai.field.concurrency'),
              max: 8,
              min: 1,
              onChange: (concurrency) => updateTts({ concurrency }),
              value: tts.concurrency ?? 3,
            })}
            {numberRow({
              desc: ai('ttsRunDesc'),
              fallback: 120_000,
              label: t('settings.ai.field.maxCharsPerRun'),
              max: 1_000_000,
              min: 1000,
              onChange: (maxCharsPerRun) => updateTts({ maxCharsPerRun }),
              value: tts.maxCharsPerRun ?? 120_000,
            })}
          </>
        ) : null}
      </SettingsGroup>

      <SettingsGroup desc={ai('modelsDesc')} title={ai('modelsTitle')}>
        {modelRow({
          desc: ai('writerDesc'),
          divider: false,
          label: ai('writerLabel'),
          models: textModels,
          onChange: (writerModel) => update({ writerModel }),
          value: config.writerModel,
        })}
        {modelRow({
          capability: 'decision',
          desc: ai('decisionDesc'),
          label: ai('decisionLabel'),
          models: decisionModels,
          onChange: (decisionModel) => update({ decisionModel }),
          value: config.decisionModel,
        })}
      </SettingsGroup>

      <AIProviderDrawer
        modelCacheKey={
          editingProvider?.capabilities?.decision
            ? [...props.modelCacheKey, 'decision']
            : props.modelCacheKey
        }
        onChange={(patch) =>
          editingId ? updateProvider(editingId, patch) : undefined
        }
        onClose={() => setEditingId(null)}
        provider={editingProvider}
        providerModels={
          editingProvider
            ? ((editingProvider.capabilities?.decision
                ? decisionModels
                : textModels)[editingProvider.id] ?? [])
            : []
        }
      />
    </>
  )
}
