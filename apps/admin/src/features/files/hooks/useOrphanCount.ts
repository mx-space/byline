import { useQuery } from '@tanstack/react-query'

import { getOrphanFileCount } from '~/api/files'

import { orphanCountQueryKey } from '../constants'

export function useOrphanCount() {
  const query = useQuery({
    queryFn: getOrphanFileCount,
    queryKey: orphanCountQueryKey,
    staleTime: 30_000,
  })
  return query.data?.count
}
