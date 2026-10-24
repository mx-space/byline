import type { FileType } from '~/api/files'
import { adminQueryKeys } from '~/query/keys'

import type { FileCopyKey } from './copy'

export const filesQueryKey = adminQueryKeys.files.root

export const orphanCountQueryKey = [
  ...filesQueryKey,
  'orphans',
  'count',
] as const

export const FILES_PAGE_SIZE = 20

export const FILES_TABLE_PAGE_SIZE = 20

export const FILES_VIEW_STORAGE_KEY = 'byline:files:view'

export const ORPHAN_CLEANUP_MAX_AGE_MINUTES = 60

export type FilesView = 'grid' | 'list'

export interface FileTypeOption {
  acceptImage: boolean
  copyKey: FileCopyKey
  value: FileType
}

export const fileTypeOptions: FileTypeOption[] = [
  { acceptImage: true, copyKey: 'typeImage', value: 'image' },
  { acceptImage: false, copyKey: 'typeFile', value: 'file' },
  { acceptImage: true, copyKey: 'typeIcon', value: 'icon' },
  { acceptImage: true, copyKey: 'typeAvatar', value: 'avatar' },
]
