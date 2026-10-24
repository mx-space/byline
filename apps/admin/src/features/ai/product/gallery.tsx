import {
  ActionIcon,
  Alert,
  createStaticStyles,
  DropdownMenu,
  Empty,
  Icon,
  Tag,
  Text,
} from '@lobehub/ui'
import { Surface } from '@lobehub/ui/dashboard'
import { CircleCheck, Ellipsis, RefreshCw, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

import type { ActiveGeneration } from '~/api/ai-overview'
import { ARTICLE_MAX_WIDTH, Page } from '~/ui/page'
import { Button } from '~/ui/site-button'

import type { ItemAction } from '../components/article-grouped/types'
import { PRIMARY_ACTION_IDS } from '../components/article-grouped/use-artefact-actions'
import { useAiCopy } from '../copy'

export const galleryStyles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  `,
  body: css`
    margin: 0;
    font-size: ${cssVar.fontSizeLG};
    line-height: 1.7;
    color: ${cssVar.colorText};
    white-space: pre-wrap;
  `,
  entry: css`
    display: flex;
    flex-direction: column;
    gap: 16px;

    padding-block: 28px;
    scroll-margin-top: 24px;

    & + & {
      border-block-start: 1px solid ${cssVar.colorBorderSecondary};
    }
  `,
  head: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
  `,
  insights: css`
    margin: 0;
    font-size: ${cssVar.fontSize};
    line-height: 1.8;
    color: ${cssVar.colorText};
    white-space: pre-wrap;
  `,
  meta: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    color: ${cssVar.colorTextTertiary};
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
  `,
  anchor: css`
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    width: 100%;
    padding-block: 4px;
    padding-inline: 0;
    border: 0;

    font-size: ${cssVar.fontSizeSM};
    font-weight: 400;
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
    text-align: start;

    background: transparent;

    &:hover {
      color: ${cssVar.colorText};
    }

    &[aria-current='location'] {
      font-weight: 600;
      color: ${cssVar.colorText};
    }
  `,
  columns: css`
    display: grid;
    grid-template-columns: minmax(0, ${ARTICLE_MAX_WIDTH});
    align-items: start;

    @container (min-width: 880px) {
      grid-template-columns: minmax(0, ${ARTICLE_MAX_WIDTH}) minmax(176px, 1fr);
      column-gap: 48px;
    }
  `,
  done: css`
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;

    width: 16px;
    color: ${cssVar.colorSuccess};
  `,
  frame: css`
    container-type: inline-size;
  `,
  rail: css`
    display: none;

    @container (min-width: 880px) {
      position: sticky;
      top: 24px;
      justify-self: end;

      display: block;

      width: 176px;
      max-width: 100%;
      max-height: calc(100dvh - 160px);
      overflow: auto;
    }
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,
}))

export function isLiveTask(status: string) {
  return status === 'pending' || status === 'running'
}

export function useScrollToItem(
  prefix: string,
  items: readonly unknown[],
  postId: string,
) {
  const [searchParams] = useSearchParams()
  const focusId = searchParams.get('item')
  const landedPost = useRef<string | null>(null)
  const entryItem = useRef<string | null>(null)
  const scrolled = useRef<string | null>(null)

  useEffect(() => {
    const root = galleryScroller()
    if (landedPost.current !== postId) {
      landedPost.current = postId
      entryItem.current = focusId
      scrolled.current = null
      if (root) root.scrollTop = 0
      return
    }
    if (
      !focusId ||
      focusId === entryItem.current ||
      scrolled.current === focusId
    ) {
      return
    }
    const node = document.getElementById(`${prefix}-${focusId}`)
    if (!node) return
    scrolled.current = focusId
    node.scrollIntoView({ block: 'start' })
  }, [focusId, items, postId, prefix])
}

export function GalleryFrame(props: {
  anchors: GalleryAnchor[]
  children: ReactNode
}) {
  return (
    <div className={galleryStyles.frame} data-gallery-frame="">
      <div className={galleryStyles.columns}>
        <div className={galleryStyles.stack}>{props.children}</div>
        <GalleryAnchors items={props.anchors} />
      </div>
    </div>
  )
}

export function GalleryShell(props: {
  anchors: GalleryAnchor[]
  busy: boolean
  children: ReactNode
  emptyBody: string
  emptyTitle: string
  generateLabel: string
  hasItems: boolean
  kind: string
  matrix?: ReactNode
  onGenerate: () => void
  tasks: ActiveGeneration[]
  title: string
}) {
  const copy = useAiCopy()
  const liveTasks = props.tasks.filter((task) => isLiveTask(task.status))
  const failedTasks = props.tasks.filter(
    (task) => !isLiveTask(task.status) && task.error,
  )

  return (
    <Page
      actions={
        props.hasItems ? (
          <Button
            loading={props.busy}
            onClick={props.onGenerate}
            size="large"
            type="primary"
          >
            {props.generateLabel}
          </Button>
        ) : undefined
      }
      title={
        <Text ellipsis={{ tooltipWhenOverflow: true }}>{props.title}</Text>
      }
      width="wide"
    >
      {props.matrix}
      <GalleryFrame anchors={props.hasItems ? props.anchors : []}>
        {liveTasks.map((task) => (
          <Alert
            description={task.progressMessage || undefined}
            key={task.taskId}
            title={copy('generatingLine', {
              kind: props.kind,
              langs: task.langs.length ? ` · ${task.langs.join('、')}` : '',
            })}
            type="info"
          />
        ))}
        {failedTasks.map((task) => (
          <Alert
            description={task.error || undefined}
            key={task.taskId}
            title={copy('failed')}
            type="error"
          />
        ))}
        {props.hasItems ? (
          props.children
        ) : (
          <Empty
            action={
              <Button
                loading={props.busy}
                onClick={props.onGenerate}
                type="primary"
              >
                {props.generateLabel}
              </Button>
            }
            description={props.emptyBody}
            title={props.emptyTitle}
          />
        )}
      </GalleryFrame>
    </Page>
  )
}

export interface GalleryAnchor {
  done?: boolean
  id: string
  label: string
}

function GalleryAnchors(props: { items: GalleryAnchor[] }) {
  const copy = useAiCopy()
  const titleId = useId()
  const [active, setActive] = useState(props.items[0]?.id ?? '')
  const signature = props.items.map((item) => item.id).join('\n')

  useEffect(() => {
    const ids = signature.split('\n').filter(Boolean)
    const first = ids[0]
    if (!first) return
    const node = document.getElementById(first)
    const root = node ? scrollParent(node) : null
    if (!root) return

    const update = () => {
      const edge = root.getBoundingClientRect().top + 48
      let current = ids[0] ?? ''
      for (const id of ids) {
        const section = document.getElementById(id)
        if (!section) continue
        if (section.getBoundingClientRect().top <= edge) current = id
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    update()
    root.addEventListener('scroll', update, { passive: true })
    return () => root.removeEventListener('scroll', update)
  }, [signature])

  if (props.items.length < 2) return null

  return (
    <nav aria-labelledby={titleId} className={galleryStyles.rail}>
      <Surface title={<span id={titleId}>{copy('anchorNav')}</span>}>
        {props.items.map((item) => (
          <button
            aria-current={item.id === active ? 'location' : undefined}
            className={galleryStyles.anchor}
            key={item.id}
            onClick={() => {
              setActive(item.id)
              document
                .getElementById(item.id)
                ?.scrollIntoView({ block: 'start' })
            }}
            type="button"
          >
            <span>{item.label}</span>
            <span
              className={galleryStyles.done}
              title={item.done ? copy('langDone') : undefined}
            >
              {item.done ? <Icon icon={CircleCheck} size="small" /> : null}
            </span>
          </button>
        ))}
      </Surface>
    </nav>
  )
}

function galleryScroller() {
  const frame = document.querySelector<HTMLElement>('[data-gallery-frame]')
  return frame ? scrollParent(frame) : null
}

function scrollParent(node: HTMLElement) {
  let current = node.parentElement
  while (current) {
    const overflow = getComputedStyle(current).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return current
    current = current.parentElement
  }
  return null
}

export function GalleryEntry(props: {
  actions: ReactNode
  children: ReactNode
  id: string
  meta: ReactNode
}) {
  return (
    <section className={galleryStyles.entry} id={props.id}>
      <header className={galleryStyles.head}>
        <div className={galleryStyles.meta}>{props.meta}</div>
        <div className={galleryStyles.actions}>{props.actions}</div>
      </header>
      {props.children}
    </section>
  )
}

export function GalleryItemActions<TItem>(props: {
  busy: boolean
  deleteLabel: string
  editLabel?: string
  extra: ItemAction<TItem>[]
  onEdit?: () => void
  onRegenerate: () => void
  onRemove: () => void
  onRun: (action: ItemAction<TItem>) => void
  regenerateLabel: string
}) {
  const copy = useAiCopy()
  const resume = props.extra.find((action) => action.id === 'resume')
  const more = props.extra.filter(
    (action) => !(PRIMARY_ACTION_IDS as readonly string[]).includes(action.id),
  )

  return (
    <>
      {props.editLabel && props.onEdit ? (
        <Button onClick={props.onEdit}>{props.editLabel}</Button>
      ) : null}
      {resume ? (
        <Button onClick={() => props.onRun(resume)}>{resume.label}</Button>
      ) : null}
      <Button
        icon={RefreshCw}
        loading={props.busy}
        onClick={props.onRegenerate}
      >
        {props.regenerateLabel}
      </Button>
      <DropdownMenu
        items={() => [
          ...more.map((action) => ({
            icon: action.icon,
            key: action.id,
            label: action.label,
            onClick: () => props.onRun(action),
          })),
          ...(more.length
            ? [{ key: 'divider', type: 'divider' as const }]
            : []),
          {
            danger: true,
            icon: Trash2,
            key: 'delete',
            label: props.deleteLabel,
            onClick: props.onRemove,
          },
        ]}
      >
        <ActionIcon
          aria-label={copy('more')}
          icon={Ellipsis}
          title={copy('more')}
        />
      </DropdownMenu>
    </>
  )
}

export function StatusTags(props: { incomplete?: boolean; stale?: boolean }) {
  const copy = useAiCopy()
  return (
    <>
      {props.incomplete ? (
        <Tag color="warning">{copy('incomplete')}</Tag>
      ) : null}
      {props.stale ? <Tag color="warning">{copy('stale')}</Tag> : null}
    </>
  )
}
