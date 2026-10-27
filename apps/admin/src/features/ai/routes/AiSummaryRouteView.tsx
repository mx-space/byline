import { useMemo } from 'react'

import type { AISummary } from '~/api/ai'
import {
  createSummaryTask,
  deleteSummary,
  getSummariesGrouped,
  getSummaryByRef,
  updateSummary,
} from '~/api/ai'

import { ArticleGroupedRouteView } from '../components/article-grouped/ArticleGroupedRouteView'
import type { ArticleGroupedConfig } from '../components/article-grouped/types'

export function AiSummaryRouteView() {
  const config = useMemo<ArticleGroupedConfig<AISummary>>(
    () => ({
      deleteItem: deleteSummary,
      generate: {
        defaultLangsOptionKey: 'summaryTargetLanguages',
        promptForLang: true,
        runTask: ({ refId, langs, force, regenerateLocked }) =>
          createSummaryTask({
            force,
            refId,
            regenerateLocked,
            targetLanguages: langs?.length ? langs : undefined,
          }),
        taskTypeForQueue: 'Summary',
      },
      getCreatedAt: (item) => item.createdAt,
      getGroupedPage: async (params) => {
        const response = await getSummariesGrouped(params)
        return {
          data: response.data.map((group) => ({
            article: group.article,
            items: group.summaries,
          })),
          pagination: response.pagination,
        }
      },
      getId: (item) => item.id,
      getItemsByRef: async (refId) => {
        const response = await getSummaryByRef(refId)
        return { article: response.article, items: response.summaries }
      },
      getLang: (item) => item.lang,
      getPreview: (item) => item.summary,
      groupedQueryKey: 'summaries',
      product: 'summary',
      updateItem: (id, next) => updateSummary(id, { summary: next.summary }),
    }),
    [],
  )

  return <ArticleGroupedRouteView<AISummary> config={config} />
}
