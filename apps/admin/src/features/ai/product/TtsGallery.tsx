import type { ReactNode } from 'react'

import type { AITtsRow } from '~/api/ai'
import type { ActiveGeneration } from '~/api/ai-overview'
import { useI18n } from '~/i18n'

import { useArticleGroupedRouteContext } from '../components/article-grouped/article-grouped-route-context'
import { useArtefactActions } from '../components/article-grouped/use-artefact-actions'
import { useAiCopy } from '../copy'
import { isTtsNarrationIncomplete } from '../utils/ai'
import {
  GalleryEntry,
  GalleryItemActions,
  GalleryShell,
  StatusTags,
  useScrollToItem,
} from './gallery'
import { TtsListenBody } from './TtsListenBody'

export function TtsGallery(props: {
  items: AITtsRow[]
  matrix?: ReactNode
  postId: string
  staleIds: ReadonlySet<string>
  tasks: ActiveGeneration[]
  title: string
}) {
  const copy = useAiCopy()
  const { format } = useI18n()
  const ctx = useArticleGroupedRouteContext<AITtsRow>()
  const actions = useArtefactActions(ctx.config, ctx.invalidate)
  useScrollToItem('tts', props.items, props.postId)

  return (
    <GalleryShell
      matrix={props.matrix}
      anchors={props.items.map((item) => ({
        done: !isTtsNarrationIncomplete(item) && !props.staleIds.has(item.id),
        id: `tts-${item.id}`,
        label: item.lang,
      }))}
      busy={actions.busy}
      emptyBody={copy('ttsEmptyBody')}
      emptyTitle={copy('ttsEmptyTitle')}
      generateLabel={copy('generateTts')}
      hasItems={props.items.length > 0}
      kind={copy('kindTts')}
      onGenerate={() => void actions.generate(props.postId)}
      tasks={props.tasks}
      title={props.title}
    >
      {props.items.map((item) => (
        <GalleryEntry
          actions={
            <GalleryItemActions
              busy={actions.busy}
              deleteLabel={copy('deleteTts')}
              extra={ctx.config.extraItemActions?.(item) ?? []}
              onRegenerate={() => void actions.regenerate(item, props.postId)}
              onRemove={() => actions.remove(item)}
              onRun={(action) => actions.run(action, item)}
              regenerateLabel={copy('retryTts')}
            />
          }
          id={`tts-${item.id}`}
          key={item.id}
          meta={
            <>
              <span>{item.lang}</span>
              <StatusTags
                incomplete={isTtsNarrationIncomplete(item)}
                stale={props.staleIds.has(item.id)}
              />
              {item.updatedAt ? (
                <span>{format.relativeTime(item.updatedAt)}</span>
              ) : null}
            </>
          }
        >
          <TtsListenBody item={item} playPrimary={false} />
        </GalleryEntry>
      ))}
    </GalleryShell>
  )
}
