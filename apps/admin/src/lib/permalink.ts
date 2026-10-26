export const DEFAULT_POST_PERMALINK = '/posts/{category}/{slug}'

export interface PermalinkValues {
  category?: string | null
  id?: string | null
  slug: string
}

const TOKEN_PATTERN = /\{(slug|category|id)\}/g

export function renderPostPermalink(
  template: string,
  values: PermalinkValues,
  options: { encode?: boolean } = {},
) {
  const { encode = true } = options
  const path = template.replaceAll(TOKEN_PATTERN, (match, token: string) => {
    const value = values[token as keyof PermalinkValues]
    if (token === 'id' && !value) return match
    return encode ? encodeURIComponent(value ?? '') : (value ?? '')
  })
  return `/${path}`.replaceAll(/\/{2,}/g, '/')
}

export function joinWebUrl(webUrl: string, path: string) {
  return `${webUrl.replace(/\/+$/, '')}${path}`
}
