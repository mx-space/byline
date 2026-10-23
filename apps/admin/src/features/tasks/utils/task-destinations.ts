import type { AITask } from '~/api/tasks'
import { AITaskType } from '~/api/tasks'

export type ArtifactCopyKey =
  'openInsights' | 'openSummary' | 'openTranslation' | 'openTts'

export interface TaskDestinations {
  articleHref: string | null
  artifactHref: string | null
  artifactKey: ArtifactCopyKey | null
}

function refIdOf(task: AITask): string | null {
  const refId = task.payload.refId
  return typeof refId === 'string' && refId ? refId : null
}

function articlePath(refId: string) {
  return `/posts/edit?id=${encodeURIComponent(refId)}`
}

export function taskDestinations(task: AITask): TaskDestinations {
  const refId = refIdOf(task)
  const articleHref = refId ? articlePath(refId) : null
  const artifact = artifactDestination(task, refId)
  if (!artifact || artifact.href === articleHref) {
    return { articleHref, artifactHref: null, artifactKey: null }
  }
  return {
    articleHref,
    artifactHref: artifact.href,
    artifactKey: artifact.key,
  }
}

function artifactDestination(
  task: AITask,
  refId: string | null,
): { href: string; key: ArtifactCopyKey } | null {
  switch (task.type) {
    case AITaskType.Summary: {
      return {
        href: refId
          ? `/ai/summary/${encodeURIComponent(refId)}`
          : '/ai/summary',
        key: 'openSummary',
      }
    }
    case AITaskType.Translation:
    case AITaskType.TranslationBatch:
    case AITaskType.TranslationAll: {
      return {
        href: refId
          ? `/ai/translation/${encodeURIComponent(refId)}`
          : '/ai/translation',
        key: 'openTranslation',
      }
    }
    case AITaskType.Insights:
    case AITaskType.InsightsTranslation: {
      return {
        href: refId
          ? `/ai/insights/${encodeURIComponent(refId)}`
          : '/ai/insights',
        key: 'openInsights',
      }
    }
    case AITaskType.Tts: {
      return {
        href: refId ? `/ai/tts/${encodeURIComponent(refId)}` : '/ai/tts',
        key: 'openTts',
      }
    }
    default: {
      return null
    }
  }
}
