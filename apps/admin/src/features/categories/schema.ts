import { z } from 'zod'

export interface CategoryFormValues {
  name: string
  slug: string
}

export function categoryFormSchema(messages: { name: string; slug: string }) {
  return z.object({
    name: z.string().trim().min(1, messages.name),
    slug: z.string().trim().min(1, messages.slug),
  })
}
