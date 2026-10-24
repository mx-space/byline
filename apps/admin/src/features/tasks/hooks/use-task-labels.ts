import type { AITask } from '~/api/tasks'
import { AITaskStatus } from '~/api/tasks'
import { useI18n } from '~/i18n'

import { taskStatusLabelKeys } from '../constants'
import { useTaskCopy } from '../copy'
import { isPublishTask } from '../utils/task-subject'
import { getEffectiveStatus, getTaskTypeLabel } from '../utils/tasks'

export const taskStatusColor: Record<AITaskStatus, string | undefined> = {
  [AITaskStatus.Pending]: undefined,
  [AITaskStatus.Running]: 'processing',
  [AITaskStatus.Completed]: 'success',
  [AITaskStatus.PartialFailed]: 'warning',
  [AITaskStatus.Failed]: 'error',
  [AITaskStatus.Cancelled]: undefined,
}

export function useTaskLabels() {
  const { t } = useI18n()
  const copy = useTaskCopy()
  return {
    status: (task: AITask) => {
      const status = getEffectiveStatus(task)
      const key = taskStatusLabelKeys[status]
      return {
        color: taskStatusColor[status],
        label: key ? t(key) : status,
        status,
      }
    },
    type: (type: string) =>
      isPublishTask({ type: type as AITask['type'] })
        ? copy('typePublish')
        : getTaskTypeLabel(type as AITask['type'], t),
  }
}
