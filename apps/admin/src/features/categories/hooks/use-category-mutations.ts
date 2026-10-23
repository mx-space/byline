import { confirmModal, toast } from '@lobehub/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { CategoryEntity } from '~/data/resources/category'
import { removeCategory } from '~/data/resources/category.mutations'
import { adminQueryKeys } from '~/query/keys'

import { categoriesQueryKey } from '../constants'
import { useCategoryCopy } from '../copy'
import { isCategoryHasPostsError } from '../utils/errors'

export function useInvalidateCategories() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: categoriesQueryKey })
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.posts.root })
  }, [queryClient])
}

export function useCategoryMutations() {
  const invalidateCategories = useInvalidateCategories()

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeCategory(id),
    onSuccess: async () => {
      await invalidateCategories()
    },
  })

  return {
    deleteMutation,
    invalidateCategories,
  }
}

export function useConfirmDeleteCategory() {
  const { text } = useCategoryCopy()
  const { deleteMutation } = useCategoryMutations()

  return (
    category: Pick<CategoryEntity, 'count' | 'id' | 'name'>,
    options: { isLast: boolean; onDeleted?: () => void },
  ) => {
    const count = category.count ?? 0
    if (count > 0) {
      toast.error(text('deleteBlocked', { count }))
      return
    }
    confirmModal({
      cancelText: text('cancel'),
      content: options.isLast
        ? `${text('deleteBody')} ${text('deleteLast')}`
        : text('deleteBody'),
      okButtonProps: { danger: true },
      okText: text('delete'),
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(category.id)
          toast.success(
            options.isLast ? text('deletedWithDefault') : text('deleted'),
          )
          options.onDeleted?.()
        } catch (error) {
          toast.error(
            isCategoryHasPostsError(error)
              ? text('deleteHasPosts', { name: category.name })
              : text('deleteFailed', { name: category.name }),
          )
        }
      },
      title: text('deleteTitle', { name: category.name }),
    })
  }
}
