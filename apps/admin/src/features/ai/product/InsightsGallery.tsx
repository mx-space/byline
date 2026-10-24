import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import type { AIInsights } from '~/api/ai'
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

function insightsEditPath(postId: string, insightsId: string) {
  const params = new URLSearchParams({ id: postId, insightsId })
  return `/posts/edit?${params.toString()}`
}

export function InsightsGallery(props: {
  items: AIInsights[]
  matrix?: ReactNode
  postId: string
  staleIds: ReadonlySet<string>
  tasks: ActiveGeneration[]
  title: string
}) {
  const copy = useAiCopy()
  const { format } = useI18n()
  const navigate = useNavigate()
  const ctx = useArticleGroupedRouteContext<AIInsights>()
  const actions = useArtefactActions(ctx.config, ctx.invalidate)
  useScrollToItem('insights', props.items, props.postId)

  return (
    <GalleryShell
      matrix={props.matrix}
      anchors={props.items.map((item) => ({
        done: Boolean(item.content.trim()) && !props.staleIds.has(item.id),
        id: `insights-${item.id}`,
        label: item.lang,
      }))}
      busy={actions.busy}
      emptyBody={copy('insightsEmptyBody')}
      emptyTitle={copy('insightsEmptyTitle')}
      generateLabel={copy('generateInsights')}
      hasItems={props.items.length > 0}
      kind={copy('kindInsights')}
      onGenerate={() => void actions.generate(props.postId)}
      tasks={props.tasks}
      title={props.title}
    >
      {props.items.map((item) => {
        const retry = ctx.config
          .extraItemActions?.(item)
          ?.find(
            (action) =>
              action.id === 'regenerate' || action.id === 'retranslate',
          )
        return (
          <GalleryEntry
            actions={
              <GalleryItemActions
                busy={actions.busy}
                deleteLabel={copy('deleteInsights')}
                editLabel={copy('editInsights')}
                extra={ctx.config.extraItemActions?.(item) ?? []}
                onEdit={() => navigate(insightsEditPath(props.postId, item.id))}
                onRegenerate={() => void actions.regenerate(item, props.postId)}
                onRemove={() => actions.remove(item)}
                onRun={(action) => actions.run(action, item)}
                regenerateLabel={retry?.label ?? copy('regenerate')}
              />
            }
            id={`insights-${item.id}`}
            key={item.id}
            meta={
              <>
                <span>{item.lang}</span>
                {item.isTranslation && item.sourceLang ? (
                  <span>
                    {copy('translatedFrom', { lang: item.sourceLang })}
                  </span>
                ) : null}
                <StatusTags stale={props.staleIds.has(item.id)} />
                <span>{format.relativeTime(item.createdAt)}</span>
              </>
            }
          >
            <div className={galleryStyles.insights}>{item.content}</div>
          </GalleryEntry>
        )
      })}
    </GalleryShell>
  )
}
