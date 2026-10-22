import { z } from 'zod'

import { zEntityId } from '~/common/zod'

export const GetTranslationQuerySchema = z.object({
  lang: z.string(),
})

export type GetTranslationQueryDto = z.infer<typeof GetTranslationQuerySchema>

export const GetTranslationStreamQuerySchema = z.object({
  lang: z.string(),
})

export type GetTranslationStreamQueryDto = z.infer<
  typeof GetTranslationStreamQuerySchema
>

export const UpdateTranslationSchema = z.object({
  title: z.string().optional(),
  text: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: z
    .string()
    .nullish()
    .transform((content) => content ?? undefined),
  isLocked: z.boolean().optional(),
})

export type UpdateTranslationDto = z.infer<typeof UpdateTranslationSchema>

export const GetTranslationsGroupedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
})

export type GetTranslationsGroupedQueryDto = z.infer<
  typeof GetTranslationsGroupedQuerySchema
>

export const ManualTranslationParamsSchema = z.object({
  id: zEntityId,
  lang: z.string().trim().min(2).max(35),
})

export type ManualTranslationParamsDto = z.infer<
  typeof ManualTranslationParamsSchema
>

export const WriteManualTranslationSchema = z
  .object({
    title: z.string().trim().min(1),
    content: z.string().min(1),
    text: z.string().optional(),
    subtitle: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    sourceLang: z.string().trim().min(2).max(35).optional(),
  })
  .refine(
    (value) => {
      try {
        return typeof JSON.parse(value.content)?.root === 'object'
      } catch {
        return false
      }
    },
    { error: 'content must be Lexical editor state JSON', path: ['content'] },
  )

export type WriteManualTranslationDto = z.infer<
  typeof WriteManualTranslationSchema
>
