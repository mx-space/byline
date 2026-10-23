import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { getUsers } from '~/api/users'
import { adminQueryKeys } from '~/query/keys'

import { useDraftCopy } from '../copy'

export function useDraftAuthors() {
  const { copy } = useDraftCopy()
  const usersQuery = useQuery({
    queryFn: () => getUsers({ page: 1, size: 100, status: 'all' }),
    queryKey: adminQueryKeys.users.list({ search: '', status: 'all' }),
    staleTime: 60_000,
  })

  const byId = useMemo(() => {
    const map = new Map<string, string>()
    for (const user of usersQuery.data?.data ?? []) {
      if (user.displayName.trim()) map.set(user.id, user.displayName.trim())
    }
    return map
  }, [usersQuery.data])

  return useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return copy('emptyValue')
      return ids
        .map((id) => byId.get(id) || copy('emptyValue'))
        .join(copy('authorJoin'))
    },
    [byId, copy],
  )
}
