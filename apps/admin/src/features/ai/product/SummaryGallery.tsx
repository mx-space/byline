import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import type { AISummary } from '~/api/ai'
import type { ActiveGeneration } from '~/api/ai-overview'
import { useI18n } from '~/i18n'

import { useArticleGroupedRouteContext } from '../components/article-grouped/article-grouped-route-context'
import { useArtefactActions } from '../components/article-grouped/use-artefact-actions'
import { useAiCopy } from '../copy'
import {
  GalleryEntry,
  GalleryItemActions,
  GalleryShell,
  galleryStyles,
  StatusTags,
  useScrollToItem,
} from './gallery'

function summaryEditPath(postId: string, summaryId: string) {
  const params = new URLSearchParams({ id: postId, summaryId })
  return `/posts/edit?${params.toString()}`
}

export function SummaryGallery(props: {
  items: AISummary[]
  matrix?: ReactNode
  postId: string
  staleIds: ReadonlySet<string>
  tasks: ActiveGeneration[]
  title: string
}) {
  const copy = useAiCopy()
  const { format } = useI18n()
  const navigate = useNavigate()
  const ctx = useArticleGroupedRouteContext<AISummary>()
  const actions = useArtefactActions(ctx.config, ctx.invalidate)
  useScrollToItem('summary', props.items, props.postId)

  return (
    <GalleryShell
      matrix={props.matrix}
      anchors={props.items.map((item) => ({
        done: Boolean(item.summary.trim()) && !props.staleIds.has(item.id),
        id: `summary-${item.id}`,
        label: item.lang,
      }))}
      busy={actions.busy}
      emptyBody={copy('summaryEmptyBody')}
      emptyTitle={copy('summaryEmptyTitle')}
      generateLabel={copy('generateSummary')}
      hasItems={props.items.length > 0}
      kind={copy('kindSummary')}
      onGenerate={() => void actions.generate(props.postId)}
      tasks={props.tasks}
      title={props.title}
    >
      {props.items.map((item) => (
        <GalleryEntry
          actions={
            <GalleryItemActions
              busy={actions.busy}
              deleteLabel={copy('deleteSummary')}
              editLabel={copy('editSummary')}
              extra={ctx.config.extraItemActions?.(item) ?? []}
              onEdit={() => navigate(summaryEditPath(props.postId, item.id))}
              onRegenerate={() => void actions.regenerate(item, props.postId)}
              onRemove={() => actions.remove(item)}
              onRun={(action) => actions.run(action, item)}
              regenerateLabel={copy('regenerate')}
            />
          }
          id={`summary-${item.id}`}
          key={item.id}
          meta={
            <>
              <span>{item.lang}</span>
              <StatusTags stale={props.staleIds.has(item.id)} />
              <span>{format.relativeTime(item.createdAt)}</span>
            </>
          }
        >
          <p className={galleryStyles.body}>{item.summary}</p>
        </GalleryEntry>
      ))}
    </GalleryShell>
  )
}
