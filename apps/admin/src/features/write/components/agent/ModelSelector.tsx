import { createStaticStyles, Popover } from '@lobehub/ui'
import { Check, ChevronDown, Search, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import type { ProviderModelsResponse } from '~/api/ai'
import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import {
  filterRecentModelsWithin,
  readRecentModels,
  rememberRecentModel,
  writeRecentModels,
} from './model-recents'
import type { SelectedAgentModel } from './types'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u3c0e9874: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      color: ${cssVar.colorText};
    }
    &:disabled {
      opacity: 0.5;
    }
  `,
  u6c752655: css`
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
  `,
  ueed8aad8: css`
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  ud21bcf04: css`
    display: flex;
    max-height: 20rem;
    width: 18rem;
    flex-direction: column;
  `,
  ub95c9673: css`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.625rem;
    padding-block: 0.5rem;
  `,
  u5174ce5e: css`
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  uee6bd472: css`
    outline: none;
    min-width: 0px;
    flex: 1 1 0%;
    background-color: transparent;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorText};
    &::placeholder {
      color: ${cssVar.colorTextTertiary};
    }
  `,
  ua9dc758b: css`
    min-height: 0px;
    flex: 1 1 0%;
    overflow-y: auto;
    padding-block: 0.25rem;
  `,
  u2b60679d: css`
    padding-inline: 0.5rem;
    padding-block: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: ${cssVar.colorTextTertiary};
  `,
  u8748abb9: css`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 0.5rem;
    padding-block: 0.375rem;
    text-align: left;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  ucfc6e672: css`
    color: ${cssVar.colorText};
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u44c3b3cd: css`
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
    color: ${cssVar.colorPrimary};
  `,
  ub948486c: css`
    padding-inline: 0.5rem;
    padding-block: 1.5rem;
    text-align: center;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
}))

interface ModelSelectorProps {
  providerGroups: ProviderModelsResponse[]
  selectedModel: SelectedAgentModel | null
  isLoading: boolean
  onSelect: (model: SelectedAgentModel) => void
}

interface ModelRow {
  modelId: string
  providerId: string
  providerType: string
  name: string
}

interface ModelGroupView {
  key: string
  label: string
  rows: ModelRow[]
}

function getModelName(
  providerGroups: ProviderModelsResponse[],
  providerId: string,
  modelId: string,
): string {
  const group = providerGroups.find((item) => item.providerId === providerId)
  return group?.models.find((item) => item.id === modelId)?.name ?? modelId
}

export function ModelSelector({
  providerGroups,
  selectedModel,
  isLoading,
  onSelect,
}: ModelSelectorProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<SelectedAgentModel[]>(() =>
    readRecentModels(),
  )
  const inputRef = useRef<HTMLInputElement>(null)

  const triggerLabel = useMemo(() => {
    if (isLoading) return t('write.agent.modelLoading')
    if (!selectedModel) return t('write.agent.model.placeholder')
    return getModelName(
      providerGroups,
      selectedModel.providerId,
      selectedModel.modelId,
    )
  }, [isLoading, selectedModel, providerGroups, t])

  const groups = useMemo<ModelGroupView[]>(() => {
    const normalized = query.trim().toLowerCase()

    const providerViews = providerGroups
      .map((group) => {
        const models = normalized
          ? group.models.filter(
              (model) =>
                model.name.toLowerCase().includes(normalized) ||
                model.id.toLowerCase().includes(normalized),
            )
          : group.models
        if (models.length === 0) return null
        return {
          key: group.providerId,
          label: group.providerName,
          rows: models.map((model) => ({
            modelId: model.id,
            providerId: group.providerId,
            providerType: group.providerType,
            name: model.name,
          })),
        }
      })
      .filter((view): view is ModelGroupView => view !== null)

    if (normalized) return providerViews

    const recentModels = filterRecentModelsWithin(recents, providerGroups)
    if (recentModels.length === 0) return providerViews

    return [
      {
        key: 'recent',
        label: t('write.agent.model.recent'),
        rows: recentModels.map((model) => ({
          modelId: model.modelId,
          providerId: model.providerId,
          providerType: model.providerType,
          name: getModelName(providerGroups, model.providerId, model.modelId),
        })),
      },
      ...providerViews,
    ]
  }, [query, providerGroups, recents, t])

  const isEmpty = !isLoading && providerGroups.length === 0
  const hasResults = groups.some((group) => group.rows.length > 0)

  const handleSelect = (row: ModelRow) => {
    const model: SelectedAgentModel = {
      modelId: row.modelId,
      providerId: row.providerId,
      providerType: row.providerType,
    }
    onSelect(model)
    const next = rememberRecentModel(
      model,
      filterRecentModelsWithin(recents, providerGroups),
    )
    setRecents(next)
    writeRecentModels(next)
    setOpen(false)
    setQuery('')
  }

  const handleOpenChange = (next: boolean) => {
    if (isEmpty) return
    setOpen(next)
    if (!next) setQuery('')
  }

  return (
    <Popover
      className={lobeStyles.ud21bcf04}
      classNames={{ trigger: lobeStyles.u3c0e9874 }}
      content={
        <>
          <div className={lobeStyles.ub95c9673}>
            <Search aria-hidden="true" className={lobeStyles.u5174ce5e} />
            <input
              className={lobeStyles.uee6bd472}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('write.agent.model.search')}
              ref={inputRef}
              value={query}
            />
          </div>
          <div className={lobeStyles.ua9dc758b}>
            {hasResults ? (
              groups.map((group) => (
                <div key={group.key}>
                  <div className={lobeStyles.u2b60679d}>{group.label}</div>
                  {group.rows.map((row) => {
                    const active =
                      selectedModel?.providerId === row.providerId &&
                      selectedModel?.modelId === row.modelId
                    return (
                      <button
                        className={cn(
                          lobeStyles.u8748abb9,
                          active && lobeStyles.ucfc6e672,
                        )}
                        key={`${group.key}:${row.providerId}::${row.modelId}`}
                        onClick={() => handleSelect(row)}
                        type="button"
                      >
                        <span className={lobeStyles.u67bab313}>{row.name}</span>
                        {active ? (
                          <Check
                            aria-hidden="true"
                            className={lobeStyles.u44c3b3cd}
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className={lobeStyles.ub948486c}>
                {t('write.agent.model.empty')}
              </div>
            )}
          </div>
        </>
      }
      disabled={isEmpty}
      onOpenChange={handleOpenChange}
      open={open}
      placement="topLeft"
      popupProps={{ initialFocus: inputRef }}
      trigger="click"
    >
      <Sparkles aria-hidden="true" className={lobeStyles.u6c752655} />
      <span className={lobeStyles.ueed8aad8}>
        {isEmpty ? t('write.agent.modelNoConfig') : triggerLabel}
      </span>
      <ChevronDown aria-hidden="true" className={lobeStyles.u6c752655} />
    </Popover>
  )
}
