import { z } from 'zod'

export const DYNAMIC_CATALOG_VERSION = 1

const zCatalogUrl = z.string().trim().min(1).max(2048)

export const RegisterDynamicComponentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  url: zCatalogUrl,
  initialHeight: z.coerce.number().int().min(0).max(10_000),
  propsSchema: z.record(z.string(), z.unknown()).default({}),
  parentUrl: z.preprocess(
    (val) => (val === '' ? null : val),
    zCatalogUrl.nullable().optional(),
  ),
})

export type RegisterDynamicComponentDto = z.infer<
  typeof RegisterDynamicComponentSchema
>
