import type {
  ContentDocumentRow,
  ContentRevisionRow,
} from '~/modules/draft/draft.types'
import type { PostRow, PostSeo } from '~/modules/post/post.types'
import type { EntityId } from '~/shared/id/entity-id'

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined

const asNullableString = (value: unknown): string | null | undefined => {
  if (value === null) return null
  if (typeof value === 'string') return value
  return undefined
}

const asDate = (value: unknown): Date | null | undefined => {
  if (value === undefined) return undefined
  if (value === null) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  return undefined
}

export const canonicalArticleId = (
  document: Pick<ContentDocumentRow, 'id' | 'refId'>,
): string => String(document.refId ?? document.id)

export const buildPostRowFromDraft = (input: {
  document: Pick<ContentDocumentRow, 'createdAt' | 'id' | 'refId'>
  existing?: PostRow | null
  revision: ContentRevisionRow
}): PostRow => {
  const { document, revision, existing = null } = input
  const data = revision.typeSpecificData ?? {}
  const publicAt = asDate(data.publicAt)

  return {
    id: (existing?.id ?? document.refId ?? document.id) as EntityId,
    title: revision.title,
    slug: asString(data.slug) ?? existing?.slug ?? 'draft',
    text: revision.text,
    content: revision.content,
    contentFormat: 'lexical',
    summary: asNullableString(data.summary) ?? existing?.summary ?? null,
    images: revision.images,
    meta: revision.meta,
    tags: Array.isArray(data.tags)
      ? (data.tags.filter((tag) => typeof tag === 'string') as string[])
      : (existing?.tags ?? []),
    modifiedAt: existing?.modifiedAt ?? revision.createdAt,
    categoryId: (asString(data.categoryId) ??
      existing?.categoryId ??
      document.id) as EntityId,
    category: existing?.category,
    isPublished: existing?.isPublished ?? false,
    publicAt: publicAt === undefined ? existing?.publicAt : publicAt,
    sourceLang:
      asNullableString(data.sourceLang) ?? existing?.sourceLang ?? null,
    image: asNullableString(data.image) ?? existing?.image ?? null,
    seo: (data.seo as PostSeo | null | undefined) ?? existing?.seo ?? null,
    pinAt: existing?.pinAt ?? null,
    pinOrder: existing?.pinOrder ?? null,
    createdAt: existing?.createdAt ?? document.createdAt,
    authors: existing?.authors,
  }
}
