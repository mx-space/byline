import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react'

import { AITaskStatus, AITaskType } from '~/api/tasks'
import type { TranslationKey } from '~/i18n/types'
import { adminQueryKeys } from '~/query/keys'

export const tasksQueryKey = adminQueryKeys.tasks.tasksRoot

export const CONTENT_PUBLISH_TASK_TYPE = 'content:publish'

export const pageSize = 20

export const liveSubscribeIntervalMs = 30_000
export const fallbackPollingIntervalMs = 5_000

export const taskTypeLabelKeys: Record<AITaskType, TranslationKey> = {
  [AITaskType.Summary]: 'tasks.taskType.summary',
  [AITaskType.Translation]: 'tasks.taskType.translation',
  [AITaskType.TranslationBatch]: 'tasks.taskType.translationBatch',
  [AITaskType.TranslationAll]: 'tasks.taskType.translationAll',
  [AITaskType.SlugBackfill]: 'tasks.taskType.slugBackfill',
  [AITaskType.Insights]: 'tasks.taskType.insights',
  [AITaskType.InsightsTranslation]: 'tasks.taskType.insightsTranslation',
  [AITaskType.ImageGeneration]: 'tasks.taskType.imageGeneration',
  [AITaskType.Tts]: 'tasks.taskType.tts',
}

export const extraTaskTypeLabelKeys: Record<string, TranslationKey> = {
  'ai:summary:translation': 'tasks.taskType.summaryTranslation',
  'cron:clean-temp-directory': 'tasks.taskType.cleanTempDirectory',
  'cron:delete-expired-jwt': 'tasks.taskType.deleteExpiredJwt',
}

export const taskStatusLabelKeys: Record<AITaskStatus, TranslationKey> = {
  [AITaskStatus.Pending]: 'tasks.taskStatus.pending',
  [AITaskStatus.Running]: 'tasks.taskStatus.running',
  [AITaskStatus.Completed]: 'tasks.taskStatus.completed',
  [AITaskStatus.PartialFailed]: 'tasks.taskStatus.partialFailed',
  [AITaskStatus.Failed]: 'tasks.taskStatus.failed',
  [AITaskStatus.Cancelled]: 'tasks.taskStatus.cancelled',
}

export const statusIcon: Record<AITaskStatus, LucideIcon> = {
  [AITaskStatus.Pending]: Clock,
  [AITaskStatus.Running]: Loader2,
  [AITaskStatus.Completed]: CheckCircle2,
  [AITaskStatus.PartialFailed]: AlertTriangle,
  [AITaskStatus.Failed]: AlertCircle,
  [AITaskStatus.Cancelled]: XCircle,
}

export type TaskStatusCategory = 'active' | 'cancelled' | 'completed' | 'failed'

export const statusCategoryStatuses: Record<
  TaskStatusCategory,
  AITaskStatus[]
> = {
  active: [AITaskStatus.Pending, AITaskStatus.Running],
  cancelled: [AITaskStatus.Cancelled],
  completed: [AITaskStatus.Completed],
  failed: [AITaskStatus.Failed, AITaskStatus.PartialFailed],
}

export const statusCategoryOptionKeys: Array<{
  labelKey: TranslationKey
  value: TaskStatusCategory | ''
}> = [
  { labelKey: 'tasks.filter.allStatus', value: '' },
  { labelKey: 'tasks.statusCategory.active', value: 'active' },
  { labelKey: 'tasks.statusCategory.failed', value: 'failed' },
  { labelKey: 'tasks.statusCategory.completed', value: 'completed' },
  { labelKey: 'tasks.statusCategory.cancelled', value: 'cancelled' },
]

export const statusSegmentValues = [
  '',
  'active',
  'failed',
  'completed',
] as const

export const filterableTaskTypes: string[] = [
  CONTENT_PUBLISH_TASK_TYPE,
  AITaskType.Translation,
  AITaskType.TranslationBatch,
  AITaskType.TranslationAll,
  AITaskType.Summary,
  AITaskType.Insights,
  AITaskType.InsightsTranslation,
  AITaskType.Tts,
  AITaskType.ImageGeneration,
  AITaskType.SlugBackfill,
]
