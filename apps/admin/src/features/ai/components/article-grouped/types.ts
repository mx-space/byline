import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { ArticleInfo, PaginationInfo } from '~/api/ai'

export type AiProduct = 'insights' | 'summary' | 'translation' | 'tts'

export interface ArticleGroup<TItem> {
  article: ArticleInfo
  items: TItem[]
}

export interface ItemAction<TItem> {
  destructive?: boolean
  icon?: LucideIcon
  id: string
  label: string
  run: (item: TItem) => Promise<unknown>
}

export interface GroupedPage<TItem> {
  data: ArticleGroup<TItem>[]
  pagination: PaginationInfo
}

export interface ItemsByRefResult<TItem> {
  article: { document: { title: string }; type: ArticleInfo['type'] } | null
  items: TItem[]
}

export interface ItemStatus {
  color?: string
  hint?: string
  label: string
}

export interface PageAction {
  icon: LucideIcon
  label: string
  run: (ctx: { invalidate: () => Promise<void> }) => Promise<void>
}

export interface ArticleGroupedConfig<TItem> {
  deleteItem: (id: string) => Promise<unknown>
  extraItemActions?: (item: TItem) => ItemAction<TItem>[]
  generate: {
    defaultLangsOptionKey?:
      'summaryTargetLanguages' | 'translationTargetLanguages'
    promptForLang?: boolean
    runTask: (input: {
      force?: boolean
      langs?: string[]
      refId: string
      regenerateLocked?: boolean
    }) => Promise<{ created: boolean; taskId: string }>
    taskTypeForQueue: 'Insights' | 'Summary' | 'Translation' | 'Tts'
  }
  getCreatedAt: (item: TItem) => string
  getGroupedPage: (params: {
    page: number
    search?: string
    size: number
  }) => Promise<GroupedPage<TItem>>
  getId: (item: TItem) => string
  getItemsByRef: (refId: string) => Promise<ItemsByRefResult<TItem>>
  getLang: (item: TItem) => string
  /** One line shown under the post title in the list. */
  getPreview: (item: TItem) => string
  /** Overrides the default "generated" status, e.g. locked or incomplete. */
  getStatus?: (item: TItem) => ItemStatus | null
  groupedQueryKey: string
  pageAction?: PageAction
  product: AiProduct
  updateItem: (id: string, next: TItem) => Promise<unknown>
}

export interface ProductBodyProps<TItem> {
  editing: boolean
  item: TItem
  onCancel: () => void
  onSubmit: (next: TItem) => Promise<void>
  submitting: boolean
  playback?: ReactNode
}
