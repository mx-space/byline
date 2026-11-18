import type {
  Author,
  DraftBranch,
  Post,
  UserDetail,
} from '@mx-space/byline-api-client'

import { describePublicLink, type PublicLink } from './urls'

export const printJson = (value: unknown) => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
  return 0
}

const line = (label: string, value: unknown) =>
  value === undefined || value === null || value === ''
    ? []
    : [`${label.padEnd(10)}${Array.isArray(value) ? value.join(', ') : value}`]

const date = (value?: string | null) => (value ? value.slice(0, 16) : '')

const titleOf = (title: string) => title.trim() || '(untitled)'

export const formatDraftRow = (
  draft: DraftBranch,
  links?: { admin?: string; public?: string },
) => {
  const head = draft.headRevision
  const slug = head.typeSpecificData?.slug
  const state = draft.document.refId ? `post ${draft.document.refId}` : 'new'
  const row = `${draft.id}  ${date(draft.updatedAt ?? draft.createdAt)}  ${state.padEnd(24)} ${titleOf(head.title)}${slug ? ` (${slug})` : ''}`
  const extras = [
    links?.admin ? `admin ${links.admin}` : '',
    links?.public ?? '',
  ].filter(Boolean)
  return extras.length ? `${row}\n  ${extras.join('\n  ')}` : row
}

export const formatDiscarded = (draft: DraftBranch) => {
  const title = titleOf(draft.headRevision.title)
  return draft.document.refId
    ? `Discarded unpublished changes to post ${draft.document.refId} (${title}); the published post is unchanged`
    : `Deleted draft ${draft.id} (${title})`
}

export const formatDraft = (
  draft: DraftBranch,
  extra: {
    adminUrl?: string
    authors: string[]
    category?: string
    publicLink?: PublicLink
  },
) => {
  const head = draft.headRevision
  const data = head.typeSpecificData ?? {}
  return [
    ...line('Draft', draft.id),
    ...line('Status', draft.status === 'active' ? undefined : draft.status),
    ...line('Title', titleOf(head.title)),
    ...line('Slug', data.slug),
    ...line('Category', extra.category),
    ...line('Authors', extra.authors),
    ...line('Tags', data.tags),
    ...line('Summary', data.summary),
    ...line('Cover', data.image),
    ...line('Language', data.sourceLang),
    ...line('Public at', data.publicAt),
    ...line('Post', draft.document.refId || 'not published'),
    ...line('Admin', extra.adminUrl),
    ...line(
      'URL',
      extra.publicLink
        ? describePublicLink(extra.publicLink)
        : draft.document.refId
          ? undefined
          : 'not published; no public URL',
    ),
    ...line('Revision', draft.headRevisionId),
    ...line('Updated', date(draft.updatedAt ?? draft.createdAt)),
    '',
    head.text,
  ].join('\n')
}

export const formatPostRow = (post: Post, publicLink?: PublicLink) => {
  const state = post.isPublished
    ? publicLink?.status === 'scheduled'
      ? 'scheduled'
      : 'published'
    : 'hidden   '
  const row = `${post.id}  ${date(post.createdAt)}  ${state.padEnd(10)}  ${post.title} (${post.category?.slug ?? post.categoryId}/${post.slug})`
  return publicLink ? `${row}\n  ${describePublicLink(publicLink)}` : row
}

export const formatPost = (post: Post, publicLink?: PublicLink) =>
  [
    ...line('Post', post.id),
    ...line('Title', post.title),
    ...line('Path', `${post.category?.slug ?? post.categoryId}/${post.slug}`),
    ...line(
      'Authors',
      post.authors.map((author) => author.displayName),
    ),
    ...line('Tags', post.tags),
    ...line('Summary', post.summary),
    ...line('Cover', post.image),
    ...line('Language', post.sourceLang),
    ...line('Published', post.isPublished ? 'yes' : 'no'),
    ...line('Public at', post.publicAt),
    ...line('URL', publicLink ? describePublicLink(publicLink) : post.url),
    ...line('Created', date(post.createdAt)),
    '',
    post.text,
  ].join('\n')

export const formatUserRow = (user: UserDetail | Author) =>
  `${user.id}  ${(user.username ?? '-').padEnd(20)} ${user.displayName}${'isProfileOnly' in user && user.isProfileOnly ? '  (profile only)' : ''}`
