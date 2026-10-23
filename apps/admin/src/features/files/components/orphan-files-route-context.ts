import { createContext, useContext } from 'react'

import type { OrphanFile } from '~/api/files'

export interface OrphanFilesRouteContextValue {
  deleteDisabled: boolean
  listStatus: 'error' | 'pending' | 'success'
  listUpdatedAt: number
  onBack: () => void
  onDelete: (item: OrphanFile) => void
  onRetry: () => void
}

export const OrphanFilesRouteContext =
  createContext<OrphanFilesRouteContextValue | null>(null)

export function useOrphanFilesRouteContext(): OrphanFilesRouteContextValue {
  const ctx = useContext(OrphanFilesRouteContext)
  if (!ctx) {
    throw new Error(
      'useOrphanFilesRouteContext must be used inside <OrphanFilesRouteContext.Provider>',
    )
  }
  return ctx
}
