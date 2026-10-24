import type {
  ChatBubble,
  ReviewBatch,
  ToolCallGroupItem,
} from '@haklex/rich-agent-core'
import { Streamdown } from '@lobehub/streamdown'
import { createStaticStyles } from '@lobehub/ui'
import { Check, X } from 'lucide-react'
import remarkGfm from 'remark-gfm'

import { useI18n } from '~/i18n'
import { streamCodeComponents } from '~/ui/markdown/stream-code'
import { Button } from '~/ui/primitives/button'

import { ThinkingBlock } from './ThinkingBlock'
import { ToolCallGroupView } from './ToolCallView'
import type { UserChatBubble } from './types'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ub75f6e07: css`
    display: flex;
    justify-content: flex-end;
  `,
  u384b6fda: css`
    max-width: 82%;
    border-radius: 10px;
    background-color: ${cssVar.colorPrimaryBg};
    padding-inline: 0.625rem;
    padding-block: 0.375rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    line-height: 1.625;
    color: ${cssVar.colorText};
  `,
  u7f668516: css`
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-left-width: 2px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-left: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf72c99b1: css`
    white-space: pre-wrap;
    overflow-wrap: break-word;
  `,
  u823a1374: css`
    max-width: none;
    font-size: 0.75rem;
    line-height: 1.125rem;
    line-height: 1.625;
    color: ${cssVar.colorText};
  `,
  u59d40084: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u7a31703b: css`
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u54c45895: css`
    width: 0.75rem;
    height: 0.75rem;
    color: ${cssVar.colorSuccess};
  `,
  uc5577458: css`
    width: 0.75rem;
    height: 0.75rem;
    color: ${cssVar.colorError};
  `,
  u2cd2ff7a: css`
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.5rem;
  `,
  u15bc8269: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u846e6b39: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ud483f0e3: css`
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  `,
  uee129b1d: css`
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  ud2fca7f2: css`
    margin-top: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextTertiary};
  `,
  u73859681: css`
    border-left-width: 2px;
    border-style: solid;
    border-color: ${cssVar.colorError};
    padding-left: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.625;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorError} 60%, transparent);
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
}))

const remarkPlugins = [remarkGfm]

interface AgentMessageItemProps {
  actionsLocked: boolean
  bubble: ChatBubble
  getBatch: (batchId: string) => ReviewBatch | undefined
  onAcceptBatch: (batchId: string) => void
  onRejectBatch: (batchId: string) => void
  onReapplyBatch: (batchId: string) => void
  onReapplyToolGroup: (items: ToolCallGroupItem[]) => void
}

export function AgentMessageItem(props: AgentMessageItemProps) {
  const { t } = useI18n()
  const { bubble } = props

  switch (bubble.type) {
    case 'user': {
      const selection = (bubble as UserChatBubble).selection
      return (
        <div className={lobeStyles.ub75f6e07}>
          <div className={lobeStyles.u384b6fda}>
            {selection && (
              <div className={lobeStyles.u7f668516}>
                {selection.type === 'text'
                  ? `"${selection.text}"`
                  : t('write.agent.selection.blocks', {
                      count: selection.blockIds.length,
                    })}
              </div>
            )}
            <div className={lobeStyles.uf72c99b1}>{bubble.content}</div>
          </div>
        </div>
      )
    }

    case 'assistant': {
      return (
        <div className={lobeStyles.u823a1374}>
          <Streamdown
            components={streamCodeComponents}
            content={bubble.content}
            granularity="char"
            remarkPlugins={remarkPlugins}
          />
        </div>
      )
    }

    case 'thinking': {
      return <ThinkingBlock bubble={bubble} />
    }

    case 'tool_call': {
      return (
        <div className={lobeStyles.u59d40084}>
          {t('write.agent.bubble.callingTool', { toolName: bubble.toolName })}
        </div>
      )
    }

    case 'tool_result': {
      return (
        <div className={lobeStyles.u7a31703b}>
          {bubble.success ? (
            <Check aria-hidden="true" className={lobeStyles.u54c45895} />
          ) : (
            <X aria-hidden="true" className={lobeStyles.uc5577458} />
          )}
          {bubble.summary}
        </div>
      )
    }

    case 'tool_call_group': {
      return (
        <ToolCallGroupView
          items={bubble.items}
          onReapply={props.onReapplyToolGroup}
          reapplyDisabled={props.actionsLocked}
        />
      )
    }

    case 'diff_review': {
      const batch = props.getBatch(bubble.batchId)
      if (!batch) return null

      const pending = batch.entries.filter(
        (entry) => entry.status === 'pending',
      ).length
      const accepted = batch.entries.filter(
        (entry) => entry.status === 'accepted',
      ).length
      const rejected = batch.entries.filter(
        (entry) => entry.status === 'rejected',
      ).length

      return (
        <div className={lobeStyles.u2cd2ff7a}>
          <div className={lobeStyles.u15bc8269}>
            {t('write.agent.review.title')}
          </div>
          <div className={lobeStyles.u846e6b39}>
            {t('write.agent.review.summary', { pending, accepted, rejected })}
          </div>
          <div className={lobeStyles.ud483f0e3}>
            <Button
              className={lobeStyles.uee129b1d}
              disabled={pending === 0 || props.actionsLocked}
              onClick={() => props.onAcceptBatch(batch.id)}
              type="button"
            >
              {t('write.agent.button.accept')}
            </Button>
            <Button
              className={lobeStyles.uee129b1d}
              disabled={pending === 0 || props.actionsLocked}
              onClick={() => props.onRejectBatch(batch.id)}
              type="button"
              variant="subtle"
            >
              {t('write.agent.button.reject')}
            </Button>
            <Button
              className={lobeStyles.uee129b1d}
              disabled={props.actionsLocked}
              onClick={() => props.onReapplyBatch(batch.id)}
              type="button"
              variant="subtle"
            >
              {t('write.agent.button.reapply')}
            </Button>
          </div>
          {props.actionsLocked ? (
            <div className={lobeStyles.ud2fca7f2}>
              {t('write.agent.review.lockedHint')}
            </div>
          ) : null}
        </div>
      )
    }

    case 'diff_summary': {
      return (
        <div className={lobeStyles.u59d40084}>
          {t('write.agent.bubble.diffSummary', {
            accepted: bubble.accepted,
            rejected: bubble.rejected,
            pending: bubble.pending,
          })}
        </div>
      )
    }

    case 'error': {
      return <div className={lobeStyles.u73859681}>{bubble.message}</div>
    }

    default: {
      return null
    }
  }
}
