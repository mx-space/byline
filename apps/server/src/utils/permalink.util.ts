export const DEFAULT_POST_PERMALINK = '/posts/{category}/{slug}'

export const POST_PERMALINK_TOKENS = ['slug', 'category', 'id'] as const

type PostPermalinkToken = (typeof POST_PERMALINK_TOKENS)[number]

export interface PermalinkPost {
  id: unknown
  slug: string
  category?: { slug?: string | null } | null
}

const TOKEN_PATTERN = /\{(\w+)\}/g

export const permalinkTokensOf = (template: string) =>
  Array.from(template.matchAll(TOKEN_PATTERN), (match) => match[1])

export const isPostPermalinkToken = (
  token: string,
): token is PostPermalinkToken =>
  (POST_PERMALINK_TOKENS as readonly string[]).includes(token)

export const renderPostPermalink = (template: string, post: PermalinkPost) => {
  const values: Record<PostPermalinkToken, string> = {
    slug: post.slug,
    category: post.category?.slug ?? '',
    id: String(post.id),
  }
  const path = template.replaceAll(TOKEN_PATTERN, (match, token: string) =>
    isPostPermalinkToken(token) ? encodeURIComponent(values[token]) : match,
  )
  return `/${path}`.replaceAll(/\/{2,}/g, '/')
}

export const joinWebUrl = (webUrl: string | null | undefined, path: string) =>
  `${(webUrl ?? '').replace(/\/+$/, '')}${path}`
