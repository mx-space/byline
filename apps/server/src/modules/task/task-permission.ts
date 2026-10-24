import {
  UserPermission,
  type UserPermissionFlag,
} from '~/constants/permission.constant'
import { AITaskType } from '~/modules/ai/ai-task/ai-task.types'
import { CONTENT_PUBLISH_TASK } from '~/modules/publish/publish.types'

const TRANSLATION_TASKS = new Set<string>([
  AITaskType.Translation,
  AITaskType.TranslationBatch,
  AITaskType.TranslationAll,
])

const WRITING_TASKS = new Set<string>([
  AITaskType.Summary,
  AITaskType.SummaryTranslation,
  AITaskType.Insights,
  AITaskType.InsightsTranslation,
  AITaskType.ImageGeneration,
  AITaskType.Tts,
])

export function permissionForTaskType(type: string): UserPermissionFlag {
  if (type === CONTENT_PUBLISH_TASK) return UserPermission.PublishPost
  if (TRANSLATION_TASKS.has(type)) return UserPermission.EditTranslation
  if (WRITING_TASKS.has(type)) return UserPermission.EditPost
  return UserPermission.ManageSettings
}
