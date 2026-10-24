import type { AITask } from '~/api/tasks'
import { AITaskStatus, AITaskType } from '~/api/tasks'

export type RetryConfirmKey =
  | 'retryGeneric'
  | 'retryPartialTranslation'
  | 'retryPartialTranslationLocked'
  | 'retryTranslation'
  | 'retryTranslationLocked'
  | 'retryTts'

const translationTypes = new Set<AITaskType>([
  AITaskType.Translation,
  AITaskType.TranslationBatch,
  AITaskType.TranslationAll,
])

export function retryConfirmKey(task: AITask): RetryConfirmKey {
  if (task.type === AITaskType.Tts) return 'retryTts'
  if (!translationTypes.has(task.type)) return 'retryGeneric'
  const includesLocked = task.payload.regenerateLocked === true
  if (
    task.type === AITaskType.Translation &&
    task.status === AITaskStatus.PartialFailed
  ) {
    return includesLocked
      ? 'retryPartialTranslationLocked'
      : 'retryPartialTranslation'
  }
  return includesLocked ? 'retryTranslationLocked' : 'retryTranslation'
}
