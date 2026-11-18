export const SEO_TITLE_LIMIT = 60
export const SEO_DESCRIPTION_LIMIT = 145

export interface PostSeoTextInput {
  seo?: {
    description?: string | null
    title?: string | null
  } | null
  summary?: string | null
  title?: string | null
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const resolvePostSeoText = ({
  seo,
  summary,
  title,
}: PostSeoTextInput) => ({
  description: text(seo?.description) || text(summary),
  title: text(seo?.title) || text(title),
})
