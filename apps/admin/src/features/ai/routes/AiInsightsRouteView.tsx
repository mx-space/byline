import { Languages, Plus } from 'lucide-react'
import { useMemo } from 'react'

import type { AIInsights } from '~/api/ai'
import {
  createInsightsTask,
  createInsightsTranslationTask,
  deleteInsights,
  getInsightsByRef,
  getInsightsGrouped,
  updateInsights,
} from '~/api/ai'

import { ArticleGroupedRouteView } from '../components/article-grouped/ArticleGroupedRouteView'
import { presentGeneratePrompt } from '../components/article-grouped/GeneratePromptModal'
import type { ArticleGroupedConfig } from '../components/article-grouped/types'
import { useAiCopy } from '../copy'
import { firstLine } from '../utils/ai'

export function AiInsightsRouteView() {
  const copy = useAiCopy()

  const config = useMemo<ArticleGroupedConfig<AIInsights>>(
    () => ({
      deleteItem: deleteInsights,
      extraItemActions: (item) => [
        {
          icon: Languages,
          id: 'translate',
          label: copy('translateInsights'),
          run: async (target) => {
            const result = await presentGeneratePrompt({
              promptForLang: true,
              title: copy('translateInsights'),
            })
            if (!result?.langs.length) return
            await Promise.all(
              result.langs
                .filter((lang) => lang !== target.lang)
                .map((lang) =>
                  createInsightsTranslationTask({
                    force: result.force,
                    refId: target.refId,
                    targetLang: lang,
                  }),
                ),
            )
          },
        },
        item.isTranslation
          ? {
              icon: Languages,
              id: 'retranslate',
              label: copy('retryInsightsTranslation'),
              run: (target) =>
                createInsightsTranslationTask({
                  refId: target.refId,
                  targetLang: target.lang,
                }),
            }
          : {
              icon: Plus,
              id: 'regenerate',
              label: copy('retryInsights'),
              run: (target) =>
                createInsightsTask({ force: true, refId: target.refId }),
            },
      ],
      generate: {
        promptForLang: false,
        runTask: ({ refId, force }) => createInsightsTask({ force, refId }),
        taskTypeForQueue: 'Insights',
      },
      getCreatedAt: (item) => item.createdAt,
      getGroupedPage: async (params) => {
        const response = await getInsightsGrouped(params)
        return {
          data: response.data.map((group) => ({
            article: group.article,
            items: group.insights,
          })),
          pagination: response.pagination,
        }
      },
      getId: (item) => item.id,
      getItemsByRef: async (refId) => {
        const response = await getInsightsByRef(refId)
        return { article: response.article, items: response.insights }
      },
      getLang: (item) => item.lang,
      getPreview: (item) => firstLine(item.content),
      getStatus: (item) =>
        item.isTranslation && item.sourceLang
          ? { label: copy('translatedFrom', { lang: item.sourceLang }) }
          : null,
      groupedQueryKey: 'insights',
      product: 'insights',
      updateItem: (id, next) => updateInsights(id, { content: next.content }),
    }),
    [copy],
  )

  return <ArticleGroupedRouteView<AIInsights> config={config} />
}
