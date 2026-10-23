import type { AgentStore, ToolCallGroupItem } from '@haklex/rich-agent-core'
import { agentStoreSelectors } from '@haklex/rich-agent-core'
import { createStaticStyles } from '@lobehub/ui'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useStore } from 'zustand'

import { useI18n } from '~/i18n'
import { Scroll } from '~/ui/primitives/scroll'

import { getAgentBubbleKey } from './agent-operations'
import { DynamicComponentCard } from './DynamicComponentCard'
import { AgentMessageItem } from './messages'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
  ueb6e8b88: css`
    padding: 0.75rem;
  `,
  ue023fdc0: css`
    display: flex;
    height: 7rem;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf9dfa057: css`
    width: 0.875rem;
    height: 0.875rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  u0f0df7aa: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6ed543e2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
  `,
  u6f7e013d: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.5rem;
    }
  `,
}))

interface MessageListProps {
  store: AgentStore
  isHydrating: boolean
  onAcceptBatch: (batchId: string) => void
  onRejectBatch: (batchId: string) => void
  onReapplyBatch: (batchId: string) => void
  onReapplyToolGroup: (items: ToolCallGroupItem[]) => void
  onPublishDynamic: (item: ToolCallGroupItem) => Promise<void>
}

export function MessageList(props: MessageListProps) {
  const { t } = useI18n()
  const { store } = props

  const bubbles = useStore(store, agentStoreSelectors.bubbles)
  const reviewState = useStore(store, agentStoreSelectors.reviewState)
  const status = useStore(store, agentStoreSelectors.status)

  const viewportRef = useRef<HTMLDivElement>(null)

  const actionsLocked = status !== 'idle' && status !== 'done'

  // The stream seeds the diff_review card at the first op, before the reply
  // finishes. Move each card to the end of its own turn (delimited by the
  // next user bubble) so multi-turn sessions keep cards next to their turn.
  const orderedBubbles: { bubble: (typeof bubbles)[number]; index: number }[] =
    []
  let deferredReviews: typeof orderedBubbles = []
  for (const [index, bubble] of bubbles.entries()) {
    if (bubble.type === 'user') {
      orderedBubbles.push(...deferredReviews)
      deferredReviews = []
    }
    if (bubble.type === 'diff_review') deferredReviews.push({ bubble, index })
    else orderedBubbles.push({ bubble, index })
  }
  orderedBubbles.push(...deferredReviews)

  const getBatch = (id: string) =>
    reviewState?.batches.find((batch) => batch.id === id)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [bubbles])

  return (
    <Scroll
      className={lobeStyles.u2b5fa9a9}
      innerClassName={lobeStyles.ueb6e8b88}
      ref={viewportRef}
    >
      {props.isHydrating ? (
        <div className={lobeStyles.ue023fdc0}>
          <Loader2 aria-hidden="true" className={lobeStyles.uf9dfa057} />
          {t('write.agent.hydrating')}
        </div>
      ) : bubbles.length === 0 ? (
        <p className={lobeStyles.u0f0df7aa}>{t('write.agent.empty')}</p>
      ) : (
        <div className={lobeStyles.u6ed543e2}>
          {orderedBubbles.map(({ bubble, index }) => (
            <div
              key={getAgentBubbleKey(bubble, index)}
              className={lobeStyles.u6f7e013d}
            >
              <AgentMessageItem
                actionsLocked={actionsLocked}
                bubble={bubble}
                getBatch={getBatch}
                onAcceptBatch={props.onAcceptBatch}
                onRejectBatch={props.onRejectBatch}
                onReapplyBatch={props.onReapplyBatch}
                onReapplyToolGroup={props.onReapplyToolGroup}
              />
              {bubble.type === 'tool_call_group'
                ? bubble.items.map((item) => (
                    <DynamicComponentCard
                      key={item.id}
                      item={item}
                      disabled={actionsLocked || props.isHydrating}
                      onPublish={props.onPublishDynamic}
                    />
                  ))
                : null}
            </div>
          ))}
        </div>
      )}
    </Scroll>
  )
}
