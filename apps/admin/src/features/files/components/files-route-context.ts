import { createContext, useContext } from 'react'

import type { FileItem, FileType } from '~/api/files'

export interface FilesRouteContextValue {
  deleteDisabled: boolean
  fileType: FileType
  listStatus: 'error' | 'pending' | 'success'
  onBack: () => void
  onDelete: (item: FileItem) => void
  onRetry: () => void
  typeLabel: string
}

export const FilesRouteContext = createContext<FilesRouteContextValue | null>(
  null,
)

export function useFilesRouteContext(): FilesRouteContextValue {
  const ctx = useContext(FilesRouteContext)
  if (!ctx) {
    throw new Error(
      'useFilesRouteContext must be used inside <FilesRouteContext.Provider>',
    )
  }
  return ctx
}
