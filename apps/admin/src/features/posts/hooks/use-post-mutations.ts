import { toast } from '@lobehub/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import {
  movePostCategory,
  pinPost,
  publishPost,
  removePost,
  removePosts,
} from '~/data/resources/post.mutations'

import { postsQueryKey } from '../constants'
import { usePostCopy } from '../copy'

interface UsePostMutationsOptions {
  onBatchPartial?: (failedIds: string[]) => void
  onBatchSuccess?: () => void
}

export function usePostMutations(options: UsePostMutationsOptions = {}) {
  const copy = usePostCopy()
  const optionsRef = useRef(options)
  optionsRef.current = options
  const queryClient = useQueryClient()

  const invalidatePosts = async () => {
    await queryClient.invalidateQueries({ queryKey: postsQueryKey })
  }

  const publishMutation = useMutation({
    mutationFn: (payload: { id: string; isPublished: boolean }) =>
      publishPost(payload.id, payload.isPublished),
    onError: () => toast.error(copy('publishFailed')),
    onSuccess: invalidatePosts,
  })

  const categoryMutation = useMutation({
    mutationFn: (payload: { categoryId: string; id: string }) =>
      movePostCategory(payload.id, payload.categoryId),
    onError: () => toast.error(copy('categoryFailed')),
    onSuccess: invalidatePosts,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removePost(id),
    onError: () => toast.error(copy('deleteFailed')),
    onSuccess: async () => {
      toast.success(copy('deleted'))
      await invalidatePosts()
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => removePosts(ids),
    onError: () => toast.error(copy('deleteFailed')),
    onSuccess: async (result, ids) => {
      optionsRef.current.onBatchSuccess?.()
      const failedIds = ids.filter((id) => !result.fulfilledKeys.includes(id))
      optionsRef.current.onBatchPartial?.(failedIds)
      if (failedIds.length === 0) {
        toast.success(
          result.successCount === 1
            ? copy('deleted')
            : copy('batchDeleted', { count: result.successCount }),
        )
      }
      await invalidatePosts()
    },
  })

  const pinMutation = useMutation({
    mutationFn: (payload: { id: string; isPinned: boolean }) =>
      pinPost(payload.id, payload.isPinned),
    onError: () => toast.error(copy('pinFailed')),
    onSuccess: invalidatePosts,
  })

  return {
    batchDeleteMutation,
    categoryMutation,
    deleteMutation,
    invalidatePosts,
    pinMutation,
    publishMutation,
  }
}
