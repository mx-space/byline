import { AutoComplete, createStaticStyles, cx } from '@lobehub/ui'
import { useCallback, useMemo } from 'react'

import { useI18n } from '~/i18n'
import { SelectField } from '~/ui/primitives/select'

import type {
  AIModelAssignment,
  AIProviderCapability,
  AIProviderConfig,
  AIProviderModel,
  AIReasoningEffort,
} from '../../types/settings'
import { formatAIModelPricing } from '../../utils/aiModelPricing'
import { formatAIProviderLabel } from '../../utils/settings'
import {
  AIModelAvatar,
  AIModelOptionLabel,
  AIProviderOptionLabel,
} from './ai-brand'

const styles = createStaticStyles(({ css, responsive }) => ({
  controls: css`
    display: grid;
    grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
    gap: 8px;
    align-items: center;

    ${responsive.md} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  controlsWithReasoning: css`
    grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) minmax(0, 8.5rem);

    ${responsive.md} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
}))

const REASONING_EFFORTS: AIReasoningEffort[] = ['none', 'low', 'medium', 'high']

export function AIModelAssignmentField(props: {
  capability?: AIProviderCapability
  /** Names the controls for assistive tech; the visible label belongs to the row. */
  label: string
  modelPlaceholder?: string
  models: Record<string, AIProviderModel[]>
  onChange: (value: AIModelAssignment | null) => void
  providers: AIProviderConfig[]
  value?: AIModelAssignment | null
}) {
  const { t } = useI18n()
  const providerId = props.value?.providerId ?? ''
  const modelValue = props.value?.model ?? ''
  const providerModels = providerId ? (props.models[providerId] ?? []) : []
  const capability = props.capability ?? 'text'
  const showReasoning = capability === 'text'
  const providers = props.providers.filter((provider) =>
    capability === 'text'
      ? (provider.capabilities?.text ?? true)
      : Boolean(provider.capabilities?.[capability]),
  )
  const modelOptions = useMemo(
    () =>
      providerModels.map((model) => ({
        label: (
          <AIModelOptionLabel
            id={model.id}
            name={model.name}
            pricing={formatAIModelPricing(model.pricing, t)}
          />
        ),
        value: model.id,
      })),
    [providerModels, t],
  )
  const modelById = useMemo(
    () => new Map(providerModels.map((model) => [model.id, model])),
    [providerModels],
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
  const reasoningEffort = props.value?.reasoningEffort ?? 'none'

  const patch = (next: Partial<AIModelAssignment>) => {
    const providerIdNext =
      next.providerId !== undefined ? next.providerId : providerId
    if (!providerIdNext) {
      props.onChange(null)
      return
    }
    props.onChange({
      providerId: providerIdNext,
      model: 'model' in next ? next.model : props.value?.model,
      reasoningEffort:
        'reasoningEffort' in next
          ? next.reasoningEffort
          : props.value?.reasoningEffort,
    })
  }

  return (
    <div
      className={cx(
        styles.controls,
        showReasoning && styles.controlsWithReasoning,
      )}
    >
      <SelectField<string>
        aria-label={t('settings.ai.assignment.providerAriaLabel', {
          label: props.label,
        })}
        onValueChange={(nextProviderId) =>
          nextProviderId
            ? patch({
                providerId: nextProviderId,
                model: undefined,
              })
            : props.onChange(null)
        }
        options={[
          { label: t('settings.ai.assignment.providerNone'), value: '' },
          ...providers.map((provider) => ({
            label: (
              <AIProviderOptionLabel provider={provider}>
                {formatAIProviderLabel(provider)}
              </AIProviderOptionLabel>
            ),
            value: provider.id,
          })),
        ]}
        value={providerId}
      />
      <AutoComplete
        disabled={!providerId}
        prefix={modelValue ? <AIModelAvatar model={modelValue} /> : undefined}
        filter={(item, query) =>
          filterModel(
            item && typeof item === 'object' && 'value' in item
              ? String(item.value)
              : '',
            query,
          )
        }
        value={modelValue}
        onChange={(next) => patch({ model: next })}
        options={modelOptions}
        placeholder={
          props.modelPlaceholder ?? t('settings.ai.assignment.modelPlaceholder')
        }
      />
      {showReasoning ? (
        <SelectField<AIReasoningEffort>
          aria-label={t('settings.ai.assignment.reasoningAriaLabel', {
            label: props.label,
          })}
          disabled={!providerId}
          onValueChange={(next) =>
            patch({
              reasoningEffort: next === 'none' ? undefined : next,
            })
          }
          options={REASONING_EFFORTS.map((value) => ({
            label: t(`settings.ai.assignment.reasoning.${value}`),
            value,
          }))}
          value={reasoningEffort}
        />
      ) : null}
    </div>
  )
}
