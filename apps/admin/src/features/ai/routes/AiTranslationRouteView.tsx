import { toast } from '@lobehub/ui'
import { Languages, Lock, LockOpen } from 'lucide-react'
import { useMemo } from 'react'

import type { AITranslation } from '~/api/ai'
import {
  createTranslationAllTask,
  createTranslationTask,
  deleteTranslation,
  getTranslationsByRef,
  getTranslationsGrouped,
  updateTranslation,
} from '~/api/ai'

import { ArticleGroupedRouteView } from '../components/article-grouped/ArticleGroupedRouteView'
import type { ArticleGroupedConfig } from '../components/article-grouped/types'
import { useAiCopy } from '../copy'
import { getErrorMessage } from '../utils/ai'

export function AiTranslationRouteView() {
  const copy = useAiCopy()

  const config = useMemo<ArticleGroupedConfig<AITranslation>>(
    () => ({
      deleteItem: deleteTranslation,
      extraItemActions: (item) => [
        {
          icon: item.isLocked ? LockOpen : Lock,
          id: 'toggle-lock',
          label: item.isLocked
            ? copy('unlockTranslation')
            : copy('lockTranslation'),
          run: () => updateTranslation(item.id, { isLocked: !item.isLocked }),
        },
        {
          icon: Languages,
          id: 'retranslate',
          label: copy('retryTranslation'),
          run: () =>
            createTranslationTask({
              force: true,
              refId: item.refId,
              regenerateLocked: item.isLocked,
              targetLanguages: [item.lang],
            }),
        },
      ],
      generate: {
        defaultLangsOptionKey: 'translationTargetLanguages',
        promptForLang: true,
        runTask: ({ refId, langs, force, regenerateLocked }) =>
          createTranslationTask({
            force,
            refId,
            ...(regenerateLocked ? { regenerateLocked: true } : {}),
            targetLanguages: langs?.length ? langs : undefined,
          }),
        taskTypeForQueue: 'Translation',
      },
      getCreatedAt: (item) => item.createdAt,
      getGroupedPage: async (params) => {
        const response = await getTranslationsGrouped(params)
        return {
          data: response.data.map((group) => ({
            article: group.article,
            items: group.translations,
          })),
          pagination: response.pagination,
        }
      },
      getId: (item) => item.id,
      getItemsByRef: async (refId) => {
        const response = await getTranslationsByRef(refId)
        return { article: response.article, items: response.translations }
      },
      getLang: (item) => item.lang,
      getPreview: (item) => item.title,
      getStatus: (item) =>
        item.isLocked ? { color: 'gold', label: copy('locked') } : null,
      groupedQueryKey: 'translations',
      pageAction: {
        icon: Languages,
        label: copy('translateAll'),
        run: async ({ invalidate }) => {
          try {
            const result = await createTranslationAllTask({})
            toast.success(
              result.created
                ? copy('translateAllCreated')
                : copy('translateAllExists'),
            )
            await invalidate()
          } catch (error) {
            toast.error(getErrorMessage(error, copy('translateAllFailed')))
          }
        },
      },
      product: 'translation',
      updateItem: (id, next) =>
        updateTranslation(id, {
          content: next.content ?? undefined,
          isLocked: next.isLocked,
          seo: next.seo,
          subtitle: next.subtitle,
          summary: next.summary,
          text: next.text,
          title: next.title,
        }),
    }),
    [copy],
  )

  return <ArticleGroupedRouteView<AITranslation> config={config} />
}
