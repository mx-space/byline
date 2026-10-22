import { z } from 'zod'

import { zAllowedUrl } from '~/common/zod'
import { normalizeLanguageCode } from '~/utils/lang.util'

const zNullableTrimmed = (max: number) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().trim().max(max).nullable(),
  )

const zNullableUrl = z.preprocess(
  (val) => (val === '' ? null : val),
  zAllowedUrl.nullable(),
)

export const PostSeoSchema = z
  .object({
    title: zNullableTrimmed(300).optional(),
    description: zNullableTrimmed(1000).optional(),
    image: zNullableUrl.optional(),
  })
  .strip()

export const PostAuthorIdsSchema = z
  .array(
    z.preprocess(
      (val) =>
        val && typeof val === 'object' && 'id' in val
          ? (val as { id: unknown }).id
          : val,
      z.string().regex(/^\d+$/, 'Author id must be a user id'),
    ),
  )
  .max(32)
  .transform((ids) => [...new Set(ids)])

export const PostSourceLangSchema = z.preprocess(
  (val) => (val === '' ? null : val),
  z
    .string()
    .trim()
    .regex(/^[a-z]{2,3}(?:[_-][\da-z]{2,8})*$/i, 'Invalid language code')
    .transform((lang) => normalizeLanguageCode(lang) ?? lang)
    .nullable(),
)

export const PostExtrasSchema = z.object({
  authors: PostAuthorIdsSchema.optional(),
  sourceLang: PostSourceLangSchema.optional(),
  image: zNullableUrl.optional(),
  seo: PostSeoSchema.nullable().optional(),
})

export type PostExtras = z.infer<typeof PostExtrasSchema>
