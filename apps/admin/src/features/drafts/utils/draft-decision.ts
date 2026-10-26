import type { DraftModel, RevisionSnapshot } from '~/models/draft'

import { getDraftTextForDiff } from './draft-diff'

export type DraftChangeKind = 'changed' | 'new' | 'same'

export type DraftSort = 'oldest' | 'saved' | 'title'

export type DraftTypeFilter = 'all' | 'changed' | 'new'

export function draftTitle(
  draft: Pick<DraftModel, 'headRevision'>,
  untitled: string,
) {
  const title = draft.headRevision?.title?.trim()
  return title || untitled
}

export function draftChangeKind(draft: DraftModel): DraftChangeKind {
  if (draft.relation === 'in_sync') return 'same'
  if (draft.relation === 'ahead') return 'changed'
  return 'new'
}

export function draftRevertsChanges(draft: DraftModel) {
  return draft.relation === 'ahead'
}

export function isPublishedIdenticalDraft(draft: DraftModel) {
  return draft.relation === 'in_sync'
}

export function parentPostLabel(
  draft: DraftModel,
  unpublished: string,
  empty: string,
) {
  if (!draft.document.refId) return unpublished
  const title = draft.publishedRevision?.title?.trim()
  return title || empty
}

export function snapshotAuthorIds(
  snapshot: Pick<RevisionSnapshot, 'typeSpecificData'>,
) {
  const authors = snapshot.typeSpecificData?.authors
  if (!authors) return []
  return authors
    .map((author) => (typeof author === 'string' ? author : author.id))
    .filter((id) => id.length > 0)
}

export function draftAuthorIds(draft: DraftModel) {
  return snapshotAuthorIds(draft.headRevision)
}

export function draftSavedAt(
  draft: Pick<DraftModel, 'createdAt' | 'updatedAt'>,
) {
  return draft.updatedAt ?? draft.createdAt
}

export function draftSlug(draft: DraftModel) {
  const slug =
    draft.publishedRevision?.typeSpecificData?.slug ??
    draft.headRevision.typeSpecificData?.slug
  return slug?.trim() || null
}

export function sortDrafts(
  drafts: DraftModel[],
  sort: DraftSort,
  untitled: string,
  locale: string,
) {
  if (sort === 'saved') return drafts
  const savedTime = (draft: DraftModel) => Date.parse(draftSavedAt(draft)) || 0
  const next = [...drafts]
  if (sort === 'oldest') {
    next.sort((left, right) => savedTime(left) - savedTime(right))
  } else {
    const collator = new Intl.Collator(locale)
    next.sort((left, right) =>
      collator.compare(draftTitle(left, untitled), draftTitle(right, untitled)),
    )
  }
  return next
}

const CJK =
  /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/g

export function countWords(markdown: string) {
  const plain = markdown
    .replaceAll(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/https?:\/\/\S+/g, ' ')
  const cjk = plain.match(CJK)?.length ?? 0
  const words =
    plain.replaceAll(CJK, ' ').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)
      ?.length ?? 0
  return cjk + words
}

export function snapshotWordCount(snapshot: RevisionSnapshot) {
  return countWords(getDraftTextForDiff(snapshot))
}

export type DraftFieldKey =
  'authors' | 'category' | 'cover' | 'slug' | 'summary' | 'tags' | 'title'

export interface DraftFieldChange {
  from: string
  key: DraftFieldKey
  to: string
}

export interface DraftFieldResolvers {
  authors: (ids: string[]) => string
  category: (id: string) => string
  empty: string
  listJoin: string
}

function text(value: string | null | undefined) {
  return value?.trim() ?? ''
}

export function draftFieldChanges(
  published: RevisionSnapshot,
  head: RevisionSnapshot,
  resolve: DraftFieldResolvers,
): DraftFieldChange[] {
  const before = published.typeSpecificData ?? {}
  const after = head.typeSpecificData ?? {}
  const show = (value: string) => value || resolve.empty
  const changes: DraftFieldChange[] = []
  const push = (key: DraftFieldKey, from: string, to: string) => {
    if (from !== to) changes.push({ from: show(from), key, to: show(to) })
  }

  push('title', text(published.title), text(head.title))
  push('slug', text(before.slug), text(after.slug))
  push(
    'category',
    before.categoryId ? resolve.category(before.categoryId) : '',
    after.categoryId ? resolve.category(after.categoryId) : '',
  )
  push('summary', text(before.summary), text(after.summary))
  push(
    'tags',
    (before.tags ?? []).join(resolve.listJoin),
    (after.tags ?? []).join(resolve.listJoin),
  )
  push('cover', text(before.image), text(after.image))

  const authorsBefore = snapshotAuthorIds(published)
  const authorsAfter = snapshotAuthorIds(head)
  if (authorsBefore.join(',') !== authorsAfter.join(',')) {
    changes.push({
      from: authorsBefore.length
        ? resolve.authors(authorsBefore)
        : resolve.empty,
      key: 'authors',
      to: authorsAfter.length ? resolve.authors(authorsAfter) : resolve.empty,
    })
  }
  return changes
}

export function signedDelta(delta: number) {
  if (delta > 0) return `+${delta}`
  return String(delta)
}

export function relativeDraftTime(
  value: string | null | undefined,
  format: (value: string, current?: Date) => string,
  empty: string,
) {
  if (!value) return empty
  const saved = Date.parse(value)
  if (Number.isNaN(saved)) return empty
  const now = new Date()
  const current = saved > now.getTime() ? new Date(saved) : now
  return format(value, current)
}
