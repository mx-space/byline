import { confirmModal, toast } from '@lobehub/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createTtsTask } from '~/api/ai'
import type { AITask } from '~/api/tasks'
import {
  AITaskStatus,
  AITaskType,
  cancelTask,
  deleteTask,
  deleteTasks,
  retryTask,
} from '~/api/tasks'

import { tasksQueryKey } from '../constants'
import { useTaskCopy } from '../copy'
import { retryConfirmKey } from '../utils/task-actions'
import { getEffectiveStatus, getErrorMessage } from '../utils/tasks'

export function canRetryTask(task: AITask) {
  return (
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed ||
    task.status === AITaskStatus.Cancelled
  )
}

export function canCancelTask(task: AITask) {
  const status = getEffectiveStatus(task)
  return status === AITaskStatus.Pending || status === AITaskStatus.Running
}

export function canDeleteTask(task: AITask) {
  return (
    task.status !== AITaskStatus.Pending && task.status !== AITaskStatus.Running
  )
}

export function canContinueTts(task: AITask) {
  return (
    canRetryTask(task) &&
    task.type === AITaskType.Tts &&
    Boolean(task.payload.refId)
  )
}

const swallow = () => {}

export function useTaskActions(
  options: { onDeleted?: (task: AITask) => void } = {},
) {
  const copy = useTaskCopy()
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: tasksQueryKey })

  const retry = useMutation({
    mutationFn: (task: AITask) => retryTask(task.id),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('toastRetryFailed'))),
    onSuccess: async (result) => {
      toast.success(
        result.created ? copy('toastRetryCreated') : copy('toastExists'),
      )
      await invalidate()
    },
  })

  const continueTts = useMutation({
    mutationFn: (task: AITask) => {
      const refId = task.payload.refId as string | undefined
      if (!refId) throw new Error(copy('toastContinueMissing'))
      return createTtsTask({
        force: false,
        langs: task.payload.langs as string[] | undefined,
        refId,
      })
    },
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('toastContinueFailed'))),
    onSuccess: async (result) => {
      toast.success(
        result.created ? copy('toastContinueCreated') : copy('toastExists'),
      )
      await invalidate()
    },
  })

  const cancel = useMutation({
    mutationFn: (task: AITask) => cancelTask(task.id),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('toastCancelFailed'))),
    onSuccess: async () => {
      toast.success(copy('toastCancelOk'))
      await invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: (task: AITask) => deleteTask(task.id),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('toastDeleteFailed'))),
    onSuccess: async (_result, task) => {
      toast.success(copy('toastDeleted'))
      options.onDeleted?.(task)
      await invalidate()
    },
  })

  const clearCompleted = useMutation({
    mutationFn: (type: string | undefined) =>
      deleteTasks({ before: Date.now(), status: AITaskStatus.Completed, type }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('toastClearFailed'))),
    onSuccess: async (result) => {
      toast.success(copy('toastCleared', { count: result.deleted }))
      await invalidate()
    },
  })

  return {
    cancel: (task: AITask) =>
      confirmModal({
        cancelText: copy('dismiss'),
        content: copy('cancelBody'),
        okText: copy('cancelTask'),
        onOk: () => cancel.mutateAsync(task).then(swallow, swallow),
        title: copy('cancelTitle'),
      }),
    canceling: cancel.isPending,
    clearCompleted: (type: string | undefined, typeLabel: string | undefined) =>
      confirmModal({
        cancelText: copy('dismiss'),
        content: typeLabel
          ? copy('clearBodyType', { type: typeLabel })
          : copy('clearBodyAll'),
        okButtonProps: { danger: true },
        okText: copy('clearCompleted'),
        onOk: () => clearCompleted.mutateAsync(type).then(swallow, swallow),
        title: copy('clearTitle'),
      }),
    clearing: clearCompleted.isPending,
    continueTts: (task: AITask) => continueTts.mutate(task),
    continuing: continueTts.isPending,
    deleting: remove.isPending,
    remove: (task: AITask) =>
      confirmModal({
        cancelText: copy('dismiss'),
        content: copy('deleteBody'),
        okButtonProps: { danger: true },
        okText: copy('deleteTask'),
        onOk: () => remove.mutateAsync(task).then(swallow, swallow),
        title: copy('deleteTitle'),
      }),
    retry: (task: AITask) => {
      const key = retryConfirmKey(task)
      return confirmModal({
        cancelText: copy('dismiss'),
        content: copy(key),
        okButtonProps:
          key.startsWith('retryTranslation') || key.startsWith('retryPartial')
            ? { danger: true }
            : undefined,
        okText: copy('retryTask'),
        onOk: () => retry.mutateAsync(task).then(swallow, swallow),
        title: copy('retryTitle'),
      })
    },
    retrying: retry.isPending,
    retryingId: retry.isPending ? (retry.variables?.id ?? null) : null,
  }
}
