import {
  ActionIcon,
  Alert,
  createStaticStyles,
  DropdownMenu,
  Empty,
  Markdown,
  Tag,
  Text,
} from '@lobehub/ui'
import { Ellipsis, Lock, RefreshCw, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import type { AITranslation } from '~/api/ai'
import type { ActiveGeneration } from '~/api/ai-overview'
import { useI18n } from '~/i18n'
import { Page } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useArticleGroupedRouteContext } from '../components/article-grouped/article-grouped-route-context'
import type { ItemAction } from '../components/article-grouped/types'
import {
  PRIMARY_ACTION_IDS,
  useArtefactActions,
} from '../components/article-grouped/use-artefact-actions'
import { useAiCopy } from '../copy'
import { GalleryFrame, useScrollToItem } from './gallery'

const styles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  `,
  copy: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
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
  label: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
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
  missing: css`
    margin: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  seo: css`
    margin: 0;
    font-size: ${cssVar.fontSizeSM};
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextTertiary};
  `,
  subtitle: css`
    margin: 0;
    font-size: ${cssVar.fontSizeLG};
    line-height: ${cssVar.lineHeightLG};
    color: ${cssVar.colorTextSecondary};
  `,
  summary: css`
    margin: 0;
    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeightLG};
    color: ${cssVar.colorText};
  `,
  tags: css`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  `,
  title: css`
    margin: 0;
    font-size: ${cssVar.fontSizeHeading2};
    font-weight: 700;
    line-height: ${cssVar.lineHeightHeading2};
    color: ${cssVar.colorText};
  `,
}))

function isLive(status: string) {
  return status === 'pending' || status === 'running'
}

function translationEditPath(postId: string, translationId: string) {
  const params = new URLSearchParams({ id: postId, translationId })
  return `/posts/edit?${params.toString()}`
}

export function TranslationGallery(props: {
  items: AITranslation[]
  matrix?: ReactNode
  postId: string
  staleIds: ReadonlySet<string>
  tasks: ActiveGeneration[]
  title: string
}) {
  const copy = useAiCopy()
  const { format } = useI18n()
  const navigate = useNavigate()
  const ctx = useArticleGroupedRouteContext<AITranslation>()
  useScrollToItem('translation', props.items, props.postId)
  const actions = useArtefactActions(ctx.config, ctx.invalidate)
  const lockedLangs = props.items
    .filter((item) => item.isLocked)
    .map((item) => item.lang)
  const liveTasks = props.tasks.filter((task) => isLive(task.status))
  const failedTasks = props.tasks.filter(
    (task) => !isLive(task.status) && task.error,
  )

  const generate = () => void actions.generate(props.postId, lockedLangs)

  return (
    <Page
      actions={
        props.items.length ? (
          <Button
            loading={actions.busy}
            onClick={generate}
            size="large"
            type="primary"
          >
            {copy('generateTranslation')}
          </Button>
        ) : undefined
      }
      title={
        <Text ellipsis={{ tooltipWhenOverflow: true }}>{props.title}</Text>
      }
      width="wide"
    >
      {props.matrix}
      <GalleryFrame
        anchors={props.items.map((item) => ({
          done: Boolean(item.text.trim()) && !props.staleIds.has(item.id),
          id: `translation-${item.id}`,
          label: item.lang,
        }))}
      >
        {liveTasks.map((task) => (
          <Alert
            description={task.progressMessage || undefined}
            key={task.taskId}
            title={copy('generatingLine', {
              kind: copy('kindTranslation'),
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
        {props.items.length ? (
          props.items.map((item) => (
            <TranslationEntry
              busy={actions.busy}
              item={item}
              key={item.id}
              lockPending={actions.extraPending}
              onEdit={() =>
                navigate(translationEditPath(props.postId, item.id))
              }
              onRun={(action) => actions.run(action, item)}
              onRegenerate={() =>
                void actions.regenerate(item, props.postId, lockedLangs)
              }
              onRemove={() => actions.remove(item)}
              stale={props.staleIds.has(item.id)}
              when={format.relativeTime(item.createdAt)}
            />
          ))
        ) : (
          <Empty
            action={
              <Button loading={actions.busy} onClick={generate} type="primary">
                {copy('generateTranslation')}
              </Button>
            }
            description={copy('translationEmptyBody')}
            title={copy('translationEmptyTitle')}
          />
        )}
      </GalleryFrame>
    </Page>
  )
}

function TranslationEntry(props: {
  busy: boolean
  item: AITranslation
  lockPending: boolean
  onEdit: () => void
  onRegenerate: () => void
  onRemove: () => void
  onRun: (action: ItemAction<AITranslation>) => void
  stale: boolean
  when: string
}) {
  const copy = useAiCopy()
  const ctx = useArticleGroupedRouteContext<AITranslation>()
  const extra = ctx.config.extraItemActions?.(props.item) ?? []
  const lock = extra.find((action) => action.id === 'toggle-lock')
  const more = extra.filter((action) => !PRIMARY_ACTION_IDS.includes(action.id))
  const item = props.item
  const text = item.text.trim()
  const summary = item.summary?.trim() ?? ''
  const subtitle = item.subtitle?.trim() ?? ''
  const seo = [item.seo?.title, item.seo?.description]
    .filter(Boolean)
    .join(' · ')
  const title = item.title.trim() || copy('untitled')

  return (
    <section
      aria-labelledby={`translation-title-${item.id}`}
      className={styles.entry}
      id={`translation-${item.id}`}
    >
      <header className={styles.head}>
        <div className={styles.meta}>
          <span>
            {copy('translationPair', { from: item.sourceLang, to: item.lang })}
          </span>
          {item.isLocked ? <Tag color="gold">{copy('locked')}</Tag> : null}
          {props.stale ? <Tag color="warning">{copy('stale')}</Tag> : null}
          <span>{props.when}</span>
        </div>
        <div className={styles.actions}>
          <Button onClick={props.onEdit}>{copy('editTranslation')}</Button>
          <Button
            icon={RefreshCw}
            loading={props.busy}
            onClick={props.onRegenerate}
          >
            {copy('regenerate')}
          </Button>
          {lock ? (
            <ActionIcon
              aria-label={lock.label}
              disabled={props.lockPending}
              icon={lock.icon ?? Lock}
              onClick={() => props.onRun(lock)}
              title={lock.label}
            />
          ) : null}
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
                label: copy('deleteTranslation'),
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
        </div>
      </header>
      <div className={styles.copy}>
        <h2 className={styles.title} id={`translation-title-${item.id}`}>
          {title}
        </h2>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {summary ? (
          <>
            <p className={styles.label}>{copy('fieldSummary')}</p>
            <p className={styles.summary}>{summary}</p>
          </>
        ) : null}
        {item.tags?.length ? (
          <div className={styles.tags}>
            {item.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        ) : null}
        {seo ? (
          <p className={styles.seo}>
            {copy('fieldSeo')} · {seo}
          </p>
        ) : null}
      </div>
      {text ? (
        <Markdown enableImageGallery={false} variant="default">
          {text}
        </Markdown>
      ) : (
        <p className={styles.missing}>{copy('translationNoBody')}</p>
      )}
    </section>
  )
}
