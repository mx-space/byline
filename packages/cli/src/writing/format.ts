import type {
  Author,
  DraftBranch,
  Post,
  UserDetail,
} from '@mx-space/byline-api-client'

export const printJson = (value: unknown) => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
  return 0
}

const line = (label: string, value: unknown) =>
  value === undefined || value === null || value === ''
    ? []
    : [`${label.padEnd(10)}${Array.isArray(value) ? value.join(', ') : value}`]

const date = (value?: string | null) => (value ? value.slice(0, 16) : '')

export const formatDraftRow = (draft: DraftBranch) => {
  const head = draft.headRevision
  const slug = head.typeSpecificData?.slug
  const state = draft.document.refId ? `post ${draft.document.refId}` : 'new'
  return `${draft.id}  ${date(draft.updatedAt ?? draft.createdAt)}  ${state.padEnd(24)} ${head.title}${slug ? ` (${slug})` : ''}`
}

export const formatDraft = (
  draft: DraftBranch,
  extra: { authors: string[]; category?: string },
) => {
  const head = draft.headRevision
  const data = head.typeSpecificData ?? {}
  return [
    ...line('Draft', draft.id),
    ...line('Title', head.title),
    ...line('Slug', data.slug),
    ...line('Category', extra.category),
    ...line('Authors', extra.authors),
    ...line('Tags', data.tags),
    ...line('Summary', data.summary),
    ...line('Post', draft.document.refId || 'not published'),
    ...line('Revision', draft.headRevisionId),
    ...line('Updated', date(draft.updatedAt ?? draft.createdAt)),
    '',
    head.text,
  ].join('\n')
}

export const formatPostRow = (post: Post) =>
  `${post.id}  ${date(post.createdAt)}  ${post.isPublished ? 'published' : 'hidden   '}  ${post.title} (${post.category?.slug ?? post.categoryId}/${post.slug})`

export const formatPost = (post: Post) =>
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
    ...line('Published', post.isPublished ? 'yes' : 'no'),
    ...line('Created', date(post.createdAt)),
    '',
    post.text,
  ].join('\n')

export const formatUserRow = (user: UserDetail | Author) =>
  `${user.id}  ${(user.username ?? '-').padEnd(20)} ${user.displayName}${'isProfileOnly' in user && user.isProfileOnly ? '  (profile only)' : ''}`
