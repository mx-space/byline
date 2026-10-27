import { confirmModal, toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'

import { useI18n } from '~/i18n'
import { confirmDialog } from '~/ui/feedback/confirm'

import { useAiCopy } from '../../copy'
import { useAiDefaultLangs } from '../../hooks/use-ai-default-langs'
import { confirmTranslationRewrite } from '../../product/confirm-rewrite'
import { getErrorMessage } from '../../utils/ai'
import { presentGeneratePrompt } from './GeneratePromptModal'
import type { ArticleGroupedConfig, ItemAction } from './types'

export const GENERATE_LABEL = {
  insights: 'generateInsights',
  summary: 'generateSummary',
  translation: 'generateTranslation',
  tts: 'generateTts',
} as const

const DELETE_TITLE = {
  insights: 'deleteInsightsTitle',
  summary: 'deleteSummaryTitle',
  translation: 'deleteTranslationTitle',
  tts: 'deleteTtsTitle',
} as const

const DELETE_BODY = {
  insights: 'deleteInsightsBody',
  summary: 'deleteSummaryBody',
  translation: 'deleteTranslationBody',
  tts: 'deleteTtsBody',
} as const

const DELETE_ACTION = {
  insights: 'deleteInsights',
  summary: 'deleteSummary',
  translation: 'deleteTranslation',
  tts: 'deleteTts',
} as const

const RETRY_ACTION_IDS = ['regenerate', 'retranslate']

export const PRIMARY_ACTION_IDS = [
  'toggle-lock',
  'regenerate',
  'retranslate',
  'resume',
]

export function isLockedItem(item: unknown): boolean {
  return Boolean(
    item &&
    typeof item === 'object' &&
    'isLocked' in item &&
    (item as { isLocked?: boolean }).isLocked,
  )
}

export async function resolveRetryInput(
  item: unknown,
  lang: string,
  refId: string,
  confirmOverwrite: () => Promise<boolean>,
) {
  const input = { force: true, langs: [lang], refId }
  if (!isLockedItem(item)) return input
  if (!(await confirmOverwrite())) return null
  return { ...input, regenerateLocked: true }
}

export function useArtefactActions<TItem>(
  config: ArticleGroupedConfig<TItem>,
  invalidate: () => Promise<void>,
) {
  const copy = useAiCopy()
  const { locale } = useI18n()
  const defaultLangs = useAiDefaultLangs(config.generate.defaultLangsOptionKey)
  const product = config.product

  const taskMutation = useMutation({
    mutationFn: config.generate.runTask,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('taskFailed'))),
    onSuccess: async (result) => {
      toast.success(result.created ? copy('taskCreated') : copy('taskExists'))
      await invalidate()
    },
  })

  const extraMutation = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('taskFailed'))),
    onSuccess: async () => {
      await invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: config.deleteItem,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('deleteFailed'))),
    onSuccess: async () => {
      toast.success(copy('deleted'))
      await invalidate()
    },
  })

  const generate = async (refId: string, lockedLangs: string[] = []) => {
    const result = await presentGeneratePrompt({
      defaultLangs,
      lockedLangs: product === 'translation' ? lockedLangs : undefined,
      promptForLang: Boolean(config.generate.promptForLang),
      replacesUnlocked: product === 'translation',
      title: copy(GENERATE_LABEL[product]),
    })
    if (!result) return
    let langs = result.langs.length ? result.langs : undefined
    const regenerateLocked = result.overwriteLocked
    if (
      product === 'translation' &&
      result.force &&
      !regenerateLocked &&
      langs
    ) {
      const remaining = langs.filter((lang) => !lockedLangs.includes(lang))
      if (!remaining.length) {
        toast.info(copy('skippedLocked'))
        return
      }
      langs = remaining
    }
    await taskMutation.mutateAsync({
      force: result.force,
      langs,
      refId,
      regenerateLocked,
    })
  }

  const regenerate = async (
    item: TItem,
    refId: string,
    lockedLangs: string[] = [],
  ) => {
    const lang = config.getLang(item)
    if (product === 'translation') {
      const confirmed = await confirmTranslationRewrite({
        locale,
        lockedLangs,
        targetLangs: [lang],
      })
      if (confirmed.cancelled) {
        if (confirmed.skippedLocked) toast.info(copy('skippedLocked'))
        return
      }
      await taskMutation.mutateAsync({
        force: true,
        langs: confirmed.langs,
        refId,
        regenerateLocked: confirmed.regenerateLocked,
      })
      return
    }
    const retry = config
      .extraItemActions?.(item)
      .find((action) => RETRY_ACTION_IDS.includes(action.id))
    if (retry) {
      extraMutation.mutate(() => retry.run(item))
      return
    }
    const input = await resolveRetryInput(item, lang, refId, () =>
      confirmDialog({
        cancelText: copy('cancel'),
        confirmText: copy('overwriteLocked'),
        description: copy('overwriteLockedSummaryBody', { lang }),
        destructive: true,
        title: copy('overwriteLockedSummaryTitle'),
      }),
    )
    if (!input) return
    await taskMutation.mutateAsync(input)
  }

  const run = (action: ItemAction<TItem>, item: TItem) =>
    extraMutation.mutate(() => action.run(item))

  const remove = (item: TItem, onDeleted?: () => void) => {
    confirmModal({
      cancelText: copy('cancel'),
      content: copy(DELETE_BODY[product]),
      okButtonProps: { danger: true },
      okText: copy(DELETE_ACTION[product]),
      onOk: async () => {
        await deleteMutation.mutateAsync(config.getId(item))
        onDeleted?.()
      },
      title: copy(DELETE_TITLE[product]),
    })
  }

  return {
    busy: taskMutation.isPending || extraMutation.isPending,
    deleting: deleteMutation.isPending,
    extraPending: extraMutation.isPending,
    generate,
    regenerate,
    remove,
    run,
  }
}
