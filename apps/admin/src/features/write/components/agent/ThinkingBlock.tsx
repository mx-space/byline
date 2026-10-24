import type { ChatBubble } from '@haklex/rich-agent-core'
import { createStaticStyles, Highlighter } from '@lobehub/ui'
import { ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { cn } from '~/utils/cn'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  u84a297f5: css`
    display: flex;
    width: 100%;
    min-width: 0px;
    align-items: center;
    gap: 0.375rem;
    padding-block: 0.125rem;
    text-align: left;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-color 0.15s ease;
    &:hover {
      color: ${cssVar.colorTextSecondary};
    }
    :where(.dark, .dark *) &:hover {
      color: ${cssVar.colorFillSecondary};
    }
  `,
  u65ba79c0: css`
    width: 0.75rem;
    height: 0.75rem;
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
  `,
  u534f8e4e: css`
    width: 0.75rem;
    height: 0.75rem;
    flex-shrink: 0;
    transition: transform 0.15s ease;
  `,
  u90665ca6: css`
    font-style: italic;
  `,
}))

type ThinkingBubble = Extract<ChatBubble, { type: 'thinking' }>

interface ThinkingBlockProps {
  bubble: ThinkingBubble
}

export function ThinkingBlock({ bubble }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false)
  const isStreaming = Boolean(bubble.isStreaming)
  const label = isStreaming ? 'Thinking…' : 'Thought'
  const text = bubble.rawText ?? bubble.content

  return (
    <div className={lobeStyles.u7e0b7cdf}>
      <button
        className={lobeStyles.u84a297f5}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {isStreaming ? (
          <Loader2 aria-hidden="true" className={lobeStyles.u65ba79c0} />
        ) : (
          <ChevronRight
            aria-hidden="true"
            className={cn(lobeStyles.u534f8e4e, open && 'rotate-90')}
          />
        )}
        <span className={lobeStyles.u90665ca6}>{label}</span>
      </button>

      {open && text ? (
        <Highlighter
          language="markdown"
          showLanguage={false}
          style={{ maxHeight: '16rem', overflow: 'auto' }}
          variant="filled"
          wrap
        >
          {text}
        </Highlighter>
      ) : null}
    </div>
  )
}
