import { z } from 'zod'

const DraftCardSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    refType: z.string(),
    version: z.number(),
    createdAt: z.date().or(z.string()),
  })
  .loose()

const DraftDetailSchema = z.object({}).loose()

export const DraftViews = {
  card: DraftCardSchema,
  detail: DraftDetailSchema,
} as const

export type DraftView = keyof typeof DraftViews
