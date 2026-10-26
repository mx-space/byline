import type { AuthorProfile } from '~/api/users'

import type { Image, Pager } from './base'

export interface PostResponse {
  data: PostModel[]
  pagination: Pager
}

export interface PostSeo {
  description?: string | null
  image?: string | null
  title?: string | null
}

export interface PostModel {
  authors?: AuthorProfile[]
  image?: string | null
  seo?: PostSeo | null
  sourceLang?: string | null
  tags: string[]
  id: string
  text: string
  title: string
  slug: string
  url?: string
  categoryId: string
  images: Image[]
  modifiedAt: string | null
  createdAt: string
  category: Category
  contentFormat?: 'lexical'
  content?: string
  summary?: string | null
  pinAt?: string | null
  pinOrder?: number | null
  meta?: any
  isPublished?: boolean
  publicAt?: string | null
}

export interface Category {
  type: number
  id: string
  name: string
  slug: string
}
