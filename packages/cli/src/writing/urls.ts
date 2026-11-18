import type { DraftBranch, Post, UrlOptions } from '@mx-space/byline-api-client'

export const DEFAULT_POST_PERMALINK = '/posts/{category}/{slug}'

export interface PermalinkValues {
  category?: string | null
  id?: string | null
  slug: string
}

const TOKEN_PATTERN = /\{(slug|category|id)\}/g

export const renderPostPermalink = (
  template: string,
  values: PermalinkValues,
) => {
  const path = template.replaceAll(TOKEN_PATTERN, (match, token: string) => {
    const value = values[token as keyof PermalinkValues]
    if (token === 'id' && !value) return match
    return encodeURIComponent(value ?? '')
  })
  return `/${path}`.replaceAll(/\/{2,}/g, '/')
}

export const joinWebUrl = (webUrl: string | null | undefined, path: string) =>
  `${(webUrl ?? '').replace(/\/+$/, '')}${path}`

export const joinAdminUrl = (
  adminUrl: string | null | undefined,
  pathWithQuery: string,
) => {
  const base = (adminUrl ?? '').replace(/\/+$/, '')
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`
  return `${base}${path}`
}

export const draftEditPath = (draft: {
  id: string
  document: { refId: string | null }
}) => {
  const params = new URLSearchParams()
  params.set('draftId', draft.id)
  if (draft.document.refId) params.set('id', draft.document.refId)
  return `/posts/edit?${params.toString()}`
}

export interface PublicLink {
  scheduledFor?: string
  status: 'live' | 'scheduled' | 'unavailable'
  url?: string
}

const isScheduled = (post: Pick<Post, 'isPublished' | 'publicAt'>) => {
  if (!post.isPublished || !post.publicAt) return false
  const at = Date.parse(post.publicAt)
  return Number.isFinite(at) && at > Date.now()
}

export const publicPostLink = (
  urls: UrlOptions,
  post: Pick<Post, 'category' | 'id' | 'isPublished' | 'publicAt' | 'slug' | 'url'>,
): PublicLink => {
  if (!post.isPublished) {
    return { status: 'unavailable' }
  }
  const path = renderPostPermalink(urls.postPermalink || DEFAULT_POST_PERMALINK, {
    category: post.category?.slug,
    id: post.id,
    slug: post.slug,
  })
  const url = post.url || joinWebUrl(urls.webUrl, path)
  if (isScheduled(post)) {
    return { scheduledFor: post.publicAt ?? undefined, status: 'scheduled', url }
  }
  return { status: 'live', url }
}

export const draftAdminUrl = (urls: UrlOptions, draft: DraftBranch) =>
  joinAdminUrl(urls.adminUrl, draftEditPath(draft))

export const describePublicLink = (link: PublicLink) => {
  if (link.status === 'unavailable' || !link.url) {
    return 'not published; no public URL'
  }
  if (link.status === 'scheduled') {
    return `${link.url} (scheduled for ${link.scheduledFor}; not public yet)`
  }
  return link.url
}
