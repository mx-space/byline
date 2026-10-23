import { Play, RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import type { AITtsRow } from '~/api/ai'
import {
  createTtsTask,
  deleteTts,
  getTtsByRefId,
  getTtsGrouped,
} from '~/api/ai'

import { ArticleGroupedRouteView } from '../components/article-grouped/ArticleGroupedRouteView'
import type {
  ArticleGroupedConfig,
  ItemAction,
} from '../components/article-grouped/types'
import { useAiCopy } from '../copy'
import {
  buildTtsRegeneratePayload,
  buildTtsResumePayload,
  isTtsNarrationIncomplete,
} from '../utils/ai'

export function AiTtsRouteView() {
  const copy = useAiCopy()

  const config = useMemo<ArticleGroupedConfig<AITtsRow>>(
    () => ({
      deleteItem: deleteTts,
      extraItemActions: (item) => [
        ...(isTtsNarrationIncomplete(item)
          ? [
              {
                icon: Play,
                id: 'resume',
                label: copy('resumeTts'),
                run: (row) => createTtsTask(buildTtsResumePayload(row)),
              } satisfies ItemAction<AITtsRow>,
            ]
          : []),
        {
          icon: RefreshCw,
          id: 'regenerate',
          label: copy('retryTts'),
          run: () => createTtsTask(buildTtsRegeneratePayload(item)),
        },
      ],
      generate: {
        promptForLang: true,
        runTask: ({ refId, langs, force }) =>
          createTtsTask({
            force,
            langs: langs?.length ? langs : undefined,
            refId,
          }),
        taskTypeForQueue: 'Tts',
      },
      getCreatedAt: (item) => item.updatedAt ?? '',
      getGroupedPage: async (params) => {
        const response = await getTtsGrouped(params)
        return {
          data: response.data.map((group) => ({
            article: group.article,
            items: group.narrations,
          })),
          pagination: response.pagination,
        }
      },
      getId: (item) => item.id,
      getItemsByRef: async (refId) => {
        const response = await getTtsByRefId(refId)
        return { article: response.article, items: response.rows }
      },
      getLang: (item) => item.lang,
      getPreview: (item) =>
        copy('voiceMeta', {
          model: item.model,
          speed: item.speed,
          voice: item.voice,
        }),
      getStatus: (item) =>
        isTtsNarrationIncomplete(item)
          ? { color: 'warning', label: copy('incomplete') }
          : null,
      groupedQueryKey: 'tts',
      product: 'tts',
      updateItem: () => Promise.resolve(),
    }),
    [copy],
  )

  return <ArticleGroupedRouteView<AITtsRow> config={config} />
}
