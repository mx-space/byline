import { z } from 'zod'

const DynamicCatalogEntrySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    url: z.string(),
    initialHeight: z.number(),
    propsSchema: z.record(z.string(), z.unknown()),
    parentUrl: z.string().optional(),
    previousUrls: z.array(z.string()),
  })
  .strip()

const DynamicCatalogSchema = z.object({
  version: z.number(),
  components: z.array(DynamicCatalogEntrySchema),
})

export const DynamicComponentViews = {
  entry: DynamicCatalogEntrySchema,
  catalog: DynamicCatalogSchema,
} as const
