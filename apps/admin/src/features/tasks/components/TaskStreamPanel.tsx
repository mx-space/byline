import { createStaticStyles, Highlighter } from '@lobehub/ui'
import { useEffect, useRef, useState } from 'react'

import type { AITask } from '~/api/tasks'
import { AITaskStatus, AITaskType } from '~/api/tasks'
import type { TaskUpdateStreamFrame } from '~/socket/types'

import { useTaskCopy } from '../copy'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ub6777c6d: css`
    margin-bottom: 1.5rem;
  `,
  u5dc4f024: css`
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  u8aaf185e: css`
    color: ${cssVar.colorText};
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    margin: 0;
  `,
  u5129356e: css`
    margin-bottom: 0.75rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uf8abe825: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-style: dashed;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 1rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6ed543e2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.75rem;
    }
  `,
  u6c029e81: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
  `,
  uc17e784d: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u3fe0b3fb: css`
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  u265c43f4: css`
    color: ${cssVar.colorInfo};
  `,
  uff4d2db0: css`
    max-height: 18rem;
    overflow: auto;
  `,
  uedeca61f: css`
    & > :not([hidden]) ~ :not([hidden]) {
      border-top-width: 1px;
      border-top-style: solid;
    }
    border-color: ${cssVar.colorBorderSecondary};
  `,
  u7e341e62: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 0.25rem;
    }
    padding: 0.75rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorText};
    transition: opacity 0.15s ease;
    transition-duration: 200ms;
  `,
  ucd6c15f2: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
}))

interface LexicalSegment {
  partial: unknown
  receivedAt: number
}

interface LangStreamState {
  chunks: string[]
  done: boolean
  segments: Map<string, LexicalSegment>
  updatedAt: number
}

type StreamsState = Map<string, LangStreamState>

const DEFAULT_LANG_KEY = '__default__'

interface StreamEventDetail {
  groupId?: string
  stream?: TaskUpdateStreamFrame
  taskId: string
}

const STREAMABLE_TYPES: ReadonlySet<AITaskType> = new Set([
  AITaskType.Translation,
  AITaskType.TranslationBatch,
  AITaskType.Summary,
  AITaskType.Insights,
])

export function shouldMountTaskStreamPanel(task: AITask): boolean {
  if (task.status !== AITaskStatus.Running) return false
  if (!STREAMABLE_TYPES.has(task.type)) return false
  if (task.type === AITaskType.TranslationBatch) {
    return (task.subTaskStats?.running ?? 0) > 0
  }
  return true
}

export function TaskStreamPanel(props: { taskId: string }) {
  const copy = useTaskCopy()
  const { taskId } = props
  const [streams, setStreams] = useState<StreamsState>(() => new Map())

  useEffect(() => {
    // Reset on taskId change — prevents cross-task leak when navigating.
    setStreams(new Map())

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<StreamEventDetail>).detail
      if (!detail || detail.taskId !== taskId) return
      const frame = detail.stream
      if (!frame) return

      setStreams((prev) => upsertStream(prev, frame))
    }

    window.addEventListener('mx-admin:ai-task-stream', handler)
    return () => {
      window.removeEventListener('mx-admin:ai-task-stream', handler)
    }
  }, [taskId])

  const entries = Array.from(streams.entries())

  return (
    <section className={lobeStyles.ub6777c6d}>
      <div className={lobeStyles.u5dc4f024}>
        <h3 className={lobeStyles.u8aaf185e}>{copy('streamTitle')}</h3>
      </div>
      <p className={lobeStyles.u5129356e}>{copy('streamHint')}</p>

      {entries.length === 0 ? (
        <div className={lobeStyles.uf8abe825}>{copy('streamWaiting')}</div>
      ) : (
        <div className={lobeStyles.u6ed543e2}>
          {entries.map(([lang, state]) => (
            <LangCard key={lang} lang={lang} state={state} />
          ))}
        </div>
      )}
    </section>
  )
}

function LangCard(props: { lang: string; state: LangStreamState }) {
  const copy = useTaskCopy()
  const { lang, state } = props
  const segments = Array.from(state.segments.entries())
  const isLexical = segments.length > 0
  const langLabel =
    lang === DEFAULT_LANG_KEY
      ? copy('streamTitle')
      : copy('streamLang', { lang })

  return (
    <div className={lobeStyles.u6c029e81}>
      <div className={lobeStyles.uc17e784d}>
        <span>{langLabel}</span>
        {state.done ? (
          <span className={lobeStyles.u3fe0b3fb}>{copy('streamDone')}</span>
        ) : (
          <span className={lobeStyles.u265c43f4}>{copy('streamLive')}</span>
        )}
      </div>
      {isLexical ? (
        <LexicalSegments segments={segments} />
      ) : (
        <MarkdownStream chunks={state.chunks} />
      )}
    </div>
  )
}

function MarkdownStream(props: { chunks: string[] }) {
  const { chunks } = props
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const stickyRef = useRef(true)
  const text = chunks.join('')

  // Track whether the user is at the bottom — freeze auto-scroll when not.
  useEffect(() => {
    const node = scrollViewportRef.current
    if (!node) return
    const handleScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight
      stickyRef.current = distance < 16
    }
    node.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      node.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!stickyRef.current) return
    const node = scrollViewportRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [text])

  return (
    <div className={lobeStyles.uff4d2db0} ref={scrollViewportRef}>
      <Highlighter language="markdown" variant="borderless" wrap>
        {text}
      </Highlighter>
    </div>
  )
}

function LexicalSegments(props: { segments: Array<[string, LexicalSegment]> }) {
  const copy = useTaskCopy()
  return (
    <div className={lobeStyles.uff4d2db0}>
      <ul className={lobeStyles.uedeca61f}>
        {props.segments.map(([segmentId, segment]) => (
          <li key={segmentId} className={lobeStyles.u7e341e62}>
            <div className={lobeStyles.ucd6c15f2}>
              {copy('streamSegment', { segmentId })}
            </div>
            <Highlighter language="json" variant="borderless" wrap>
              {safeStringify(segment.partial)}
            </Highlighter>
          </li>
        ))}
      </ul>
    </div>
  )
}

function upsertStream(
  prev: StreamsState,
  frame: TaskUpdateStreamFrame,
): StreamsState {
  const langKey = frame.lang ?? DEFAULT_LANG_KEY
  const next = new Map(prev)
  const existing = next.get(langKey)
  const base: LangStreamState = existing
    ? {
        chunks: existing.chunks,
        done: existing.done,
        segments: new Map(existing.segments),
        updatedAt: existing.updatedAt,
      }
    : {
        chunks: [],
        done: false,
        segments: new Map(),
        updatedAt: 0,
      }

  if (frame.segmentId) {
    base.segments.set(frame.segmentId, {
      partial: frame.partial,
      receivedAt: Date.now(),
    })
  } else if (typeof frame.chunk === 'string' && frame.chunk.length > 0) {
    base.chunks = [...base.chunks, frame.chunk]
  } else if (frame.partial !== undefined) {
    // Partial without segmentId (e.g. summary/insights structured) — render as
    // a synthetic single-segment update.
    base.segments.set('_partial', {
      partial: frame.partial,
      receivedAt: Date.now(),
    })
  }

  base.done = base.done || Boolean(frame.done)
  base.updatedAt = Date.now()
  next.set(langKey, base)
  return next
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
