import type { LucideIcon } from 'lucide-react'
import { FileIcon, ImageIcon, Smile, User } from 'lucide-react'

import type { FileType } from '~/api/files'
import type { TranslationKey } from '~/i18n/types'
import { adminQueryKeys } from '~/query/keys'

export const filesQueryKey = adminQueryKeys.files.root

export interface FileTypeOption {
  acceptImage: boolean
  icon: LucideIcon
  labelKey: TranslationKey
  value: FileType
}

export const fileTypeOptions: FileTypeOption[] = [
  {
    acceptImage: true,
    icon: Smile,
    labelKey: 'files.fileType.icon',
    value: 'icon',
  },
  {
    acceptImage: true,
    icon: User,
    labelKey: 'files.fileType.avatar',
    value: 'avatar',
  },
  {
    acceptImage: true,
    icon: ImageIcon,
    labelKey: 'files.fileType.image',
    value: 'image',
  },
  {
    acceptImage: false,
    icon: FileIcon,
    labelKey: 'files.fileType.file',
    value: 'file',
  },
]

export const FILES_PAGE_SIZE = 24
