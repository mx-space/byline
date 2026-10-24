import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { getCategories } from '~/api/categories'
import { adminQueryKeys } from '~/query/keys'

export function useCategoryNames() {
  const categoriesQuery = useQuery({
    queryFn: () => getCategories({ type: 'Category' }),
    queryKey: [...adminQueryKeys.categories.root, 'drafts-lookup'],
    staleTime: 60_000,
  })

  const byId = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [categoriesQuery.data],
  )

  return useCallback((id: string) => byId.get(id) ?? id, [byId])
}
