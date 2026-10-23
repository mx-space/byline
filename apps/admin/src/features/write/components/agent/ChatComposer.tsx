import type { AgentStore, AgentStoreStatus } from '@haklex/rich-agent-core'
import { agentStoreSelectors } from '@haklex/rich-agent-core'
import { createStaticStyles } from '@lobehub/ui'
import { ArrowUp, Square, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type { ProviderModelsResponse } from '~/api/ai'
import { useI18n } from '~/i18n'
import { cn } from '~/utils/cn'

import { ModelSelector } from './ModelSelector'
import type { SelectedAgentModel } from './types'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u5c524c77: css`
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    border-top-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
  `,
  u372da0ea: css`
    margin-inline: 0.5rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    border-radius: 0.25rem;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.625rem;
    padding-block: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u68a8c6d0: css`
    display: inline-flex;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    color: ${cssVar.colorTextTertiary};
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  uef2d6f74: css`
    width: 0.75rem;
    height: 0.75rem;
  `,
  ua71b422a: css`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding-inline: 0.75rem;
    padding-block: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u283e42fb: css`
    position: relative;
    display: flex;
    width: 0.375rem;
    height: 0.375rem;
    flex-shrink: 0;
  `,
  u7f47b1f4: css`
    position: absolute;
    display: inline-flex;
    width: 100%;
    height: 100%;
    animation: byline-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
    border-radius: 999px;
    background-color: ${cssVar.colorSuccess};
    opacity: 0.75;
  `,
  u8b55ff52: css`
    position: relative;
    display: inline-flex;
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 999px;
    background-color: ${cssVar.colorSuccess};
  `,
  u1e764368: css`
    outline: none;
    min-height: 5rem;
    width: 100%;
    resize: none;
    background-color: transparent;
    padding-inline: 0.75rem;
    padding-bottom: 0.25rem;
    padding-top: 0.625rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    line-height: 1.625;
    color: ${cssVar.colorText};
    &::placeholder {
      color: ${cssVar.colorTextTertiary};
    }
  `,
  u45e76de4: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-inline: 0.5rem;
    padding-bottom: 0.5rem;
  `,
  u6cfc7e6a: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  u59d40084: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u1ee5d488: css`
    &:focus-visible {
      outline: none;
    }
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background-color: ${cssVar.colorText};
    color: ${cssVar.colorBgLayout};
    transition: opacity 0.15s ease;
    &:hover {
      opacity: 0.9;
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorText} 20%, transparent);
    }
  `,
  u6b3d5699: css`
    display: inline-flex;
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
  `,
  u5e6da983: css`
    background-color: ${cssVar.colorText};
    color: ${cssVar.colorBgLayout};
    &:hover {
      opacity: 0.9;
    }
  `,
  u679a8946: css`
    &:disabled {
      pointer-events: none;
    }
    &:disabled {
      background-color: ${cssVar.colorFillSecondary};
    }
    &:disabled {
      color: ${cssVar.colorTextTertiary};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
}))

interface ChatComposerProps {
  store: AgentStore
  agentReady: boolean
  value: string
  onChange: (value: string) => void
  providerGroups: ProviderModelsResponse[]
  isLoadingModels: boolean
  selectedModel: SelectedAgentModel | null
  onSelectModel: (model: SelectedAgentModel) => void
  onSend: (message: string) => void
  onAbort: () => void
}

const STATUS_LABEL_KEYS = {
  thinking: 'write.agent.status.thinking',
  writing: 'write.agent.status.writing',
  calling_tool: 'write.agent.status.callingTool',
} as const

export function ChatComposer({
  store,
  agentReady,
  value,
  onChange,
  providerGroups,
  isLoadingModels,
  selectedModel,
  onSelectModel,
  onSend,
  onAbort,
}: ChatComposerProps) {
  const { t } = useI18n()
  const status = useStore(store, agentStoreSelectors.status)
  const pinnedSelection = useStore(store, agentStoreSelectors.pinnedSelection)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  const isRunning = status !== 'idle' && status !== 'done'
  const canSend =
    !isRunning && agentReady && Boolean(selectedModel) && Boolean(value.trim())

  useEffect(() => {
    if (!value) {
      const ta = textareaRef.current
      if (ta) ta.style.height = 'auto'
    }
  }, [value])

  function grow(ta: HTMLTextAreaElement) {
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`
  }

  function handleSend() {
    if (!canSend) return
    onSend(value.trim())
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={lobeStyles.u5c524c77}>
      {pinnedSelection && (
        <div className={lobeStyles.u372da0ea}>
          <span className={lobeStyles.u67bab313}>
            {pinnedSelection.type === 'text'
              ? `"${
                  pinnedSelection.text.length > 60
                    ? `${pinnedSelection.text.slice(0, 60)}…`
                    : pinnedSelection.text
                }"`
              : t('write.agent.selection.blocks', {
                  count: pinnedSelection.blockIds.length,
                })}
          </span>
          <button
            type="button"
            aria-label={t('write.agent.selection.dismiss')}
            className={lobeStyles.u68a8c6d0}
            onClick={() => store.getState().clearPinnedSelection()}
          >
            <X aria-hidden="true" className={lobeStyles.uef2d6f74} />
          </button>
        </div>
      )}

      {isRunning && (
        <div className={lobeStyles.ua71b422a}>
          <span className={lobeStyles.u283e42fb}>
            <span className={lobeStyles.u7f47b1f4} />
            <span className={lobeStyles.u8b55ff52} />
          </span>
          <span>{t(resolveStatusKey(status))}</span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        placeholder={t('write.agent.input.placeholder')}
        className={lobeStyles.u1e764368}
        onChange={(e) => {
          onChange(e.target.value)
          grow(e.target)
        }}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
      />

      <div className={lobeStyles.u45e76de4}>
        <div className={lobeStyles.u6cfc7e6a}>
          <ModelSelector
            providerGroups={providerGroups}
            selectedModel={selectedModel}
            isLoading={isLoadingModels}
            onSelect={onSelectModel}
          />
          {!isRunning && (
            <span className={lobeStyles.u59d40084}>
              {t('write.agent.input.hintSend')}
            </span>
          )}
        </div>

        {isRunning ? (
          <button
            type="button"
            aria-label={t('write.agent.aborting')}
            className={lobeStyles.u1ee5d488}
            onClick={onAbort}
          >
            <Square
              aria-hidden="true"
              className={lobeStyles.uef2d6f74}
              fill="currentColor"
            />
          </button>
        ) : (
          <button
            type="button"
            aria-label={t('write.agent.button.send')}
            disabled={!canSend}
            className={cn(
              lobeStyles.u6b3d5699,
              lobeStyles.u5e6da983,
              lobeStyles.u679a8946,
            )}
            onClick={handleSend}
          >
            <ArrowUp
              aria-hidden="true"
              className={lobeStyles.uf7b5fa97}
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>
    </div>
  )
}

function resolveStatusKey(status: AgentStoreStatus) {
  if (
    status === 'thinking' ||
    status === 'writing' ||
    status === 'calling_tool'
  )
    return STATUS_LABEL_KEYS[status]
  return 'write.agent.status.processing'
}
