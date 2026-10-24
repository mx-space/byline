import type { PostSeo } from '~/database/schema'
import type { EntityId } from '~/shared/id/entity-id'

import type { PublicUserProfile } from '../user/user.types'

export type { PostSeo }

export interface PostCategorySummary {
  id: EntityId
  name: string
  slug: string
  type: number
}

export interface PostRow {
  id: EntityId
  title: string
  slug: string
  text: string
  content: string | null
  contentFormat: 'lexical'
  summary: string | null
  images: unknown[] | null
  meta: Record<string, unknown> | null
  tags: string[]
  modifiedAt: Date | null
  categoryId: EntityId
  category?: PostCategorySummary
  isPublished: boolean
  publicAt?: Date | null
  sourceLang: string | null
  image: string | null
  seo: PostSeo | null
  pinAt: Date | null
  pinOrder: number | null
  createdAt: Date
  authors?: PublicUserProfile[]
}

export interface PostCreateInput {
  title: string
  slug: string
  contentFormat: 'lexical'
  createdAt?: Date
  text?: string | null
  content?: string | null
  summary?: string | null
  images?: unknown[] | null
  meta?: Record<string, unknown> | null
  tags?: string[]
  categoryId: EntityId | string
  isPublished?: boolean
  publicAt?: Date | null
  sourceLang?: string | null
  image?: string | null
  seo?: PostSeo | null
  pinAt?: Date | null
  pinOrder?: number | null
  authorIds: string[]
}

export type PostPatchInput = Partial<
  Omit<PostCreateInput, 'categoryId' | 'authorIds'>
> & {
  categoryId?: EntityId | string
  modifiedAt?: Date | null
  authorIds?: string[]
}

export interface PostListParams {
  page?: number
  size?: number
  categoryId?: EntityId | string
  categoryIds?: Array<EntityId | string>
  authorId?: string
  tag?: string
  publishedOnly?: boolean
  scheduledOnly?: boolean
  year?: number
  excludeAiWritten?: boolean
  keyword?: string
  metaOnly?: boolean
  sortBy?: keyof PostRow
  sortOrder?: 1 | -1
  truncateText?: number
}

export interface PostTagCount {
  [key: string]: unknown
  name: string
  count: number
}

export interface PostListByCategoryOptions {
  includeCategory?: boolean
  limit?: number
  publishedOnly?: boolean
  metaOnly?: boolean
}

export type PostModel = PostRow & {
  authorIds?: string[]
}

export const POST_PROTECTED_KEYS = ['id', 'createdAt'] as const
