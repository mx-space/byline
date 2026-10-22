import { z } from 'zod'

import {
  zCoerceInt,
  zEntityId,
  zLang,
  zOptionalBoolean,
  zPinDate,
  zPrefer,
} from '~/common/zod'
import { createPagerSchema } from '~/shared/dto/pager.dto'

import {
  PostAuthorIdsSchema,
  PostSeoSchema,
  PostSourceLangSchema,
} from './post-write.schema'

export const PartialPostSchema = z.object({
  categoryId: zEntityId.optional(),
  pinAt: zPinDate,
  authors: PostAuthorIdsSchema.refine((ids) => ids.length > 0, {
    error: 'A post needs at least one author',
  }).optional(),
  sourceLang: PostSourceLangSchema.optional(),
  image: z
    .preprocess((val) => (val === '' ? null : val), z.url().nullable())
    .optional(),
  seo: PostSeoSchema.nullable().optional(),
})

export type PartialPostDto = z.infer<typeof PartialPostSchema>

const zDecodedSlug = z.preprocess((val) => {
  if (typeof val === 'string') {
    return decodeURI(val)
  }
  return val
}, z.string())

export const CategoryAndSlugSchema = z.object({
  category: z.string(),
  slug: zDecodedSlug,
})

export type CategoryAndSlugDto = z.infer<typeof CategoryAndSlugSchema>

export const PostSlugSchema = z.object({
  slug: zDecodedSlug,
})

export type PostSlugDto = z.infer<typeof PostSlugSchema>

export const PostDetailQuerySchema = z.object({
  lang: zLang,
  prefer: zPrefer,
})

export type PostDetailQueryDto = z.infer<typeof PostDetailQuerySchema>

export const PostPagerSchema = createPagerSchema([
  'createdAt',
  'modifiedAt',
  'pinAt',
]).extend({
  truncate: zCoerceInt.optional(),
  authorId: zEntityId.optional(),
  categoryIds: z
    .preprocess(
      (val) => (typeof val === 'string' ? val.split(',') : val),
      z.array(zEntityId),
    )
    .optional(),
  excludeAiWritten: zOptionalBoolean,
  lang: zLang,
})

export type PostPagerDto = z.infer<typeof PostPagerSchema>

export const SetPostPublishStatusSchema = z.object({
  isPublished: z.boolean(),
})

export type SetPostPublishStatusDto = z.infer<typeof SetPostPublishStatusSchema>
