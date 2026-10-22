import { z } from 'zod'

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const ArticleTranslationSchema = z
  .object({
    isTranslated: z.boolean(),
    sourceLang: z.string().nullable().optional(),
    targetLang: z.string().nullable().optional(),
    translatedAt: z.date().optional(),
    model: z.string().optional(),
    availableTranslations: z.array(z.string()).optional(),
  })
  .strict()

export const EntryTranslationSchema = z
  .object({
    article: ArticleTranslationSchema.optional(),
  })
  .strict()

export const GlossaryMetaSchema = z
  .object({
    tags: z
      .array(z.object({ source: z.string(), translated: z.string() }))
      .optional(),
  })
  .strict()

export const RelatedRefSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    slug: z.string().optional(),
    nid: z.number().optional(),
    type: z.string().optional(),
  })
  .loose()

export const InsightsMetaSchema = z
  .object({ hasInLocale: z.boolean() })
  .strict()

export const TtsMetaSchema = z
  .object({
    available: z.boolean(),
    lang: z.string().optional(),
    blockCount: z.number().optional(),
    stale: z.boolean().optional(),
    updatedAt: z.date().nullish(),
  })
  .strict()

export const SummaryMetaSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    lang: z.string(),
    createdAt: z.date(),
  })
  .strict()

export const BaseResponseMetaSchema = z.object({
  pagination: PaginationSchema.optional(),
  view: z.string().optional(),
  translation: z
    .union([
      EntryTranslationSchema,
      z.record(z.string(), EntryTranslationSchema),
    ])
    .optional(),
  glossary: GlossaryMetaSchema.optional(),
})

export const PostResponseMetaSchema = BaseResponseMetaSchema.extend({
  insights: InsightsMetaSchema.optional(),
  articles: z.record(z.string(), RelatedRefSchema).optional(),
  summary: SummaryMetaSchema.optional(),
  tts: TtsMetaSchema.optional(),
})

export const ResponseMetaSchema = PostResponseMetaSchema

export type Pagination = z.infer<typeof PaginationSchema>
export type ArticleTranslation = z.infer<typeof ArticleTranslationSchema>
export type EntryTranslation = z.infer<typeof EntryTranslationSchema>
export type GlossaryMeta = z.infer<typeof GlossaryMetaSchema>
export type RelatedRef = z.infer<typeof RelatedRefSchema>
export type ArticleRefMap = Record<string, RelatedRef>
export type InsightsMeta = z.infer<typeof InsightsMetaSchema>
export type TtsMeta = z.infer<typeof TtsMetaSchema>
export type SummaryMeta = z.infer<typeof SummaryMetaSchema>
export type BaseResponseMeta = z.infer<typeof BaseResponseMetaSchema>
export type PostResponseMeta = z.infer<typeof PostResponseMetaSchema>
export type ResponseMeta = z.infer<typeof ResponseMetaSchema>
