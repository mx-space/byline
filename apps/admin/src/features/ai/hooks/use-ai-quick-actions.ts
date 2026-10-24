import type { ContextMenuItem } from '@lobehub/ui'
import {
  AudioLines,
  FileText,
  Languages,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  createInsightsTask,
  createSummaryTask,
  createTranslationTask,
  createTtsTask,
  getTranslationsByRef,
} from '~/api/ai'
import type { CreateTaskResponse } from '~/api/tasks'

import { presentGeneratePrompt } from '../components/article-grouped/GeneratePromptModal'
import { useAiCopy } from '../copy'
import { useAiDefaultLangs } from './use-ai-default-langs'
import { useAiGenerateTask } from './use-ai-generate-task'

export function useAiQuickActionsBuilder() {
  const copy = useAiCopy()
  const navigate = useNavigate()

  const mutation = useAiGenerateTask()
  const summaryDefaultLangs = useAiDefaultLangs('summaryTargetLanguages')
  const translationDefaultLangs = useAiDefaultLangs(
    'translationTargetLanguages',
  )

  const runWithGeneratePrompt = async (
    title: string,
    taskFn: (
      langs: string[] | undefined,
      force: boolean,
      overwriteLocked: boolean,
    ) => Promise<CreateTaskResponse>,
    options?: {
      defaultLangs?: string[]
      lockedLangs?: string[]
      promptForLang?: boolean
      replacesUnlocked?: boolean
    },
  ) => {
    const result = await presentGeneratePrompt({
      defaultLangs: options?.defaultLangs,
      lockedLangs: options?.lockedLangs,
      promptForLang: options?.promptForLang ?? true,
      replacesUnlocked: options?.replacesUnlocked,
      title,
    })
    if (!result) return
    mutation.mutate(() =>
      taskFn(
        result.langs.length ? result.langs : undefined,
        result.force,
        result.overwriteLocked,
      ),
    )
  }

  return (refId: string): ContextMenuItem[] => [
    {
      icon: LayoutDashboard,
      key: 'ai-overview',
      label: copy('menuOverview'),
      onClick: () => navigate(`/ai/overview/${refId}`),
    },
    { key: 'ai-overview-sep', type: 'divider' },
    {
      icon: FileText,
      key: 'ai-summary',
      label: copy('generateSummary'),
      onClick: () =>
        void runWithGeneratePrompt(
          copy('generateSummary'),
          (langs, force) =>
            createSummaryTask({ force, refId, targetLanguages: langs }),
          { defaultLangs: summaryDefaultLangs },
        ),
    },
    {
      icon: Sparkles,
      key: 'ai-insights',
      label: copy('generateInsights'),
      onClick: () =>
        void runWithGeneratePrompt(
          copy('generateInsights'),
          (_langs, force) => createInsightsTask({ force, refId }),
          { promptForLang: false },
        ),
    },
    {
      icon: Languages,
      key: 'ai-translation',
      label: copy('generateTranslation'),
      onClick: () =>
        void (async () => {
          const existing = await getTranslationsByRef(refId).catch(() => null)
          const lockedLangs = (existing?.translations ?? [])
            .filter((item) => item.isLocked)
            .map((item) => item.lang)
          await runWithGeneratePrompt(
            copy('generateTranslation'),
            (langs, force, overwriteLocked) =>
              createTranslationTask({
                force,
                refId,
                ...(overwriteLocked ? { regenerateLocked: true } : {}),
                targetLanguages: langs,
              }),
            {
              defaultLangs: translationDefaultLangs,
              lockedLangs,
              replacesUnlocked: true,
            },
          )
        })(),
    },
    {
      icon: AudioLines,
      key: 'ai-tts',
      label: copy('generateTts'),
      onClick: () =>
        void runWithGeneratePrompt(copy('generateTts'), (langs, force) =>
          createTtsTask({ force, langs, refId }),
        ),
    },
  ]
}

export function useAiQuickActions(refId: string) {
  return useAiQuickActionsBuilder()(refId)
}
