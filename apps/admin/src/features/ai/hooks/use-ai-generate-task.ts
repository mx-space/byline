import { toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'

import type { CreateTaskResponse } from '~/api/tasks'

import { useAiCopy } from '../copy'
import { getErrorMessage } from '../utils/ai'

export function useAiGenerateTask() {
  const copy = useAiCopy()

  return useMutation({
    mutationFn: async (fn: () => Promise<CreateTaskResponse>) => fn(),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('taskFailed'))),
    onSuccess: (result) => {
      toast.success(result.created ? copy('taskCreated') : copy('taskExists'))
    },
  })
}
