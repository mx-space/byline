import { createStaticStyles } from '@lobehub/ui'

import type { AITask, AITaskLog, AITasksResponse } from '~/api/tasks'
import { AITaskStatus, AITaskType } from '~/api/tasks'
import type { TranslationKey, TranslationValues } from '~/i18n/types'

import type { TaskStatusCategory } from '../constants'
import { statusCategoryOptionKeys, taskTypeLabelKeys } from '../constants'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u0e55306e: css`
    color: ${cssVar.colorTextTertiary};
  `,
  u340b3124: css`
    color: ${cssVar.colorInfo};
  `,
  uab398374: css`
    color: ${cssVar.colorSuccess};
  `,
  u1dd48761: css`
    color: ${cssVar.colorWarning};
  `,
  ue3f51cc6: css`
    color: ${cssVar.colorError};
  `,
}))

type Translator = (key: TranslationKey, values?: TranslationValues) => string

export function getTaskTypeLabel(type: AITask['type'], t: Translator): string {
  const key = taskTypeLabelKeys[type]
  if (key) return t(key)
  const separatorIndex = type.indexOf(':')
  return separatorIndex > 0 ? type.slice(separatorIndex + 1) : type
}

export function getEffectiveStatus(task: AITask) {
  if (
    isBatchTask(task) &&
    task.status === AITaskStatus.Completed &&
    task.subTaskStats &&
    (task.subTaskStats.pending > 0 || task.subTaskStats.running > 0)
  ) {
    return AITaskStatus.Running
  }

  return task.status
}

export function isBatchTask(task: AITask) {
  return (
    task.type === AITaskType.TranslationBatch ||
    task.type === AITaskType.TranslationAll
  )
}

export function getTaskSummary(task: AITask, t: Translator) {
  const payload = task.payload
  const result = task.result as Record<string, unknown> | undefined
  if (task.type === AITaskType.Summary) {
    return (
      (payload.title as string) ||
      (payload.refId as string) ||
      t('tasks.task.summary.task')
    )
  }
  if (task.type === AITaskType.Translation) {
    return (
      (payload.title as string) ||
      (payload.refId as string) ||
      t('tasks.task.translation.task')
    )
  }
  if (task.type === AITaskType.TranslationBatch) {
    const count = (payload.refIds as string[] | undefined)?.length ?? 0
    return t('tasks.task.translation.articleCount', { count })
  }
  if (task.type === AITaskType.TranslationAll) {
    const count = result?.total as number | undefined
    return count
      ? t('tasks.task.translation.articleCount', { count })
      : t('tasks.task.translation.allArticles')
  }
  if (task.type === AITaskType.SlugBackfill)
    return t('tasks.task.slugBackfill.summary')
  if (task.type === AITaskType.Insights)
    return t('tasks.task.insights.generation')
  if (task.type === AITaskType.InsightsTranslation)
    return t('tasks.task.insights.translation')
  if (task.type === AITaskType.ImageGeneration) {
    const prompt = payload.prompt as string | undefined
    return prompt || t('tasks.task.imageGeneration.task')
  }
  if (task.type === AITaskType.Tts) {
    return (
      (payload.title as string) ||
      (payload.refId as string) ||
      t('tasks.task.tts.task')
    )
  }

  const refId = task.payload.refId
  if (typeof refId === 'string' && refId) return refId
  return task.type
}

export function getTaskProgressLabel(task: AITask) {
  if (task.subTaskStats) {
    const stats = task.subTaskStats
    return `${stats.completed + stats.failed}/${stats.total}`
  }

  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return `${task.completedItems}/${task.totalItems}`
  }

  return null
}

export function getProgress(task: AITask) {
  if (typeof task.progress === 'number') return task.progress
  if (
    typeof task.completedItems === 'number' &&
    typeof task.totalItems === 'number' &&
    task.totalItems > 0
  ) {
    return (task.completedItems / task.totalItems) * 100
  }
  if (task.subTaskStats && task.subTaskStats.total > 0) {
    const completed = task.subTaskStats.completed + task.subTaskStats.failed
    return (completed / task.subTaskStats.total) * 100
  }

  return null
}

export function statusIconClassName(status: AITaskStatus) {
  return {
    [AITaskStatus.Pending]: lobeStyles.u0e55306e,
    [AITaskStatus.Running]: lobeStyles.u340b3124,
    [AITaskStatus.Completed]: lobeStyles.uab398374,
    [AITaskStatus.PartialFailed]: lobeStyles.u1dd48761,
    [AITaskStatus.Failed]: lobeStyles.ue3f51cc6,
    [AITaskStatus.Cancelled]: lobeStyles.u0e55306e,
  }[status]
}

export function readPositivePage(value: null | string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export function readTaskStatusFilter(
  value: null | string,
): TaskStatusCategory | '' {
  return statusCategoryOptionKeys.some((option) => option.value === value)
    ? (value as TaskStatusCategory | '')
    : ''
}

export function readTaskTypeFilter(value: null | string): string {
  return value ?? ''
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function applyTaskPatch(
  prev: AITask,
  patch?: Partial<AITask>,
  log?: AITaskLog,
): AITask {
  if (!patch && !log) return prev

  const next: AITask = { ...prev }
  let changed = false

  if (patch) {
    const fields = [
      'status',
      'progress',
      'progressMessage',
      'tokensGenerated',
      'cost',
      'result',
      'error',
      'completedAt',
      'completedItems',
      'totalItems',
      'startedAt',
      'workerId',
      'retryCount',
      'groupId',
    ] as const
    const patchRecord = patch as Record<string, unknown>
    const nextRecord = next as unknown as Record<string, unknown>
    for (const key of fields) {
      if (key in patchRecord && patchRecord[key] !== undefined) {
        nextRecord[key] = patchRecord[key]
        changed = true
      }
    }
    if (patch.subTaskStats) {
      next.subTaskStats = patch.subTaskStats
      changed = true
    }
  }

  if (log) {
    next.logs = [...(prev.logs ?? []), log]
    changed = true
  }

  return changed ? next : prev
}

function isTasksListResponse(value: unknown): value is AITasksResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as AITasksResponse).data) &&
    typeof (value as AITasksResponse).total === 'number'
  )
}

export function prependTaskToList(
  data: unknown,
  task: AITask,
): AITasksResponse | unknown {
  if (!isTasksListResponse(data)) return data
  if (data.data.some((t) => t.id === task.id)) {
    return upsertTaskInList(data, task.id, task)
  }
  return {
    ...data,
    data: [task, ...data.data],
    total: data.total + 1,
  }
}

export function upsertTaskInList(
  data: unknown,
  id: string,
  patch: Partial<AITask>,
): AITasksResponse | unknown {
  if (!isTasksListResponse(data)) return data
  const idx = data.data.findIndex((t) => t.id === id)
  if (idx < 0) return data
  const prev = data.data[idx]
  const merged = applyTaskPatch(prev, patch)
  if (merged === prev) return data
  const nextData = data.data.slice()
  nextData[idx] = merged
  return { ...data, data: nextData }
}

export function removeTaskFromList(
  data: unknown,
  id: string,
): AITasksResponse | unknown {
  if (!isTasksListResponse(data)) return data
  const idx = data.data.findIndex((t) => t.id === id)
  if (idx < 0) return data
  const nextData = data.data.slice()
  nextData.splice(idx, 1)
  return {
    ...data,
    data: nextData,
    total: Math.max(0, data.total - 1),
  }
}
