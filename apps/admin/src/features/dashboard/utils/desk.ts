import type { AiOverviewListRow, CapabilityCoverage } from '~/api/ai-overview'
import { draftChangeKind } from '~/features/drafts/utils/draft-decision'
import { getEditPathForDraft } from '~/features/drafts/utils/draft-edit-path'
import type { DraftModel } from '~/models/draft'

export const newPostPath = '/posts/edit'
export const draftsPath = '/drafts'
export const postsPath = '/posts'
export const aiOverviewPath = '/ai/overview'
export const failedTasksPath = '/tasks?status=failed'
export const activeTasksPath = '/tasks?status=active'
export const tasksPath = '/tasks'
export const translationGapsPath = '/ai/overview?capability=translation&gaps=1'

export type DeskWritingStatus = 'modified' | 'unpublished'

export interface DeskWritingItem {
  branchCount: number
  draftId: string
  id: string
  status: DeskWritingStatus
  time: string
  title: string
  to: string
}

export function buildWritingItems(drafts: DraftModel[]): DeskWritingItem[] {
  const byDocument = new Map<string, DeskWritingItem>()
  for (const draft of drafts) {
    if (draft.status !== 'active' || draft.relationToPublished === 'same')
      continue
    const existing = byDocument.get(draft.documentId)
    if (existing) {
      existing.branchCount += 1
      continue
    }
    byDocument.set(draft.documentId, {
      branchCount: 1,
      draftId: draft.id,
      id: draft.documentId,
      status: draft.document.refId ? 'modified' : 'unpublished',
      time: draft.updatedAt ?? draft.createdAt,
      title: draft.headRevision.title,
      to: getEditPathForDraft(draft),
    })
  }

  return [...byDocument.values()].sort((a, b) => b.time.localeCompare(a.time))
}

export function countUnpublishedDrafts(drafts: DraftModel[]) {
  let fresh = 0
  let behind = 0
  for (const draft of drafts) {
    if (draft.status !== 'active') continue
    const kind = draftChangeKind(draft)
    if (kind === 'new') fresh += 1
    else if (kind === 'behind') behind += 1
  }
  return { behind, drafts: fresh }
}

const HEATMAP_MAX_LEVEL = 4

export interface CreationActivity {
  count: number
  date: string
  level: number
}

function localDayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function buildCreationHeatmap(
  createdAts: Array<string | null | undefined>,
  year: number,
): CreationActivity[] {
  const counts = new Map<string, number>()
  for (const value of createdAts) {
    if (!value) continue
    const date = new Date(value)
    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) continue
    const key = localDayKey(date)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let maxCount = 0
  for (const count of counts.values()) maxCount = Math.max(maxCount, count)

  const days: CreationActivity[] = []
  for (
    const cursor = new Date(year, 0, 1);
    cursor.getFullYear() === year;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const date = localDayKey(cursor)
    const count = counts.get(date) ?? 0
    const level =
      count === 0
        ? 0
        : Math.min(
            HEATMAP_MAX_LEVEL,
            Math.max(1, Math.ceil((count / maxCount) * HEATMAP_MAX_LEVEL)),
          )
    days.push({ count, date, level })
  }
  return days
}

export interface CategoryShare {
  count: number
  name: string | null
}

export function countCategoryShare(
  names: Array<string | null | undefined>,
): CategoryShare[] {
  const counts = new Map<string | null, number>()
  for (const name of names) {
    const key = name?.trim() ? name.trim() : null
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ count, name }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        (left.name ?? '').localeCompare(right.name ?? ''),
    )
}

export function takePublishedPosts<T extends { isPublished?: boolean }>(
  posts: T[],
  limit: number,
): T[] {
  const picked: T[] = []
  for (const post of posts) {
    if (!post.isPublished) continue
    picked.push(post)
    if (picked.length >= limit) break
  }
  return picked
}

export function countPublishStates(
  posts: Array<{ createdAt?: string | null; isPublished?: boolean }>,
) {
  let published = 0
  let unpublished = 0
  let latestPublishedAt: string | null = null
  for (const post of posts) {
    if (!post.isPublished) {
      unpublished += 1
      continue
    }
    published += 1
    const createdAt = post.createdAt
    if (!createdAt) continue
    const createdTime = Date.parse(createdAt)
    if (Number.isNaN(createdTime)) continue
    if (!latestPublishedAt || createdTime > Date.parse(latestPublishedAt)) {
      latestPublishedAt = createdAt
    }
  }
  return { latestPublishedAt, published, unpublished }
}

export function aiGapRows(rows: AiOverviewListRow[]) {
  return rows.filter((row) => row.gapCount > 0)
}

export interface TranslationGapSummary {
  applicable: number
  items: number
  posts: number
}

function missingLangs(coverage: CapabilityCoverage) {
  const have = new Set(coverage.langs)
  return coverage.expected.filter((lang) => !have.has(lang))
}

export function postTranslationCheck(
  coverage: CapabilityCoverage | null | undefined,
): {
  done: number
  missing: number
  missingLangs: string[]
  state: 'done' | 'gap' | 'unset'
  total: number
} {
  if (
    !coverage?.applicable ||
    (coverage.expected.length === 0 && coverage.langs.length === 0)
  ) {
    return { done: 0, missing: 0, missingLangs: [], state: 'unset', total: 0 }
  }
  const total =
    coverage.expected.length > 0
      ? coverage.expected.length
      : coverage.langs.length
  const absent = missingLangs(coverage)
  return absent.length === 0
    ? { done: total, missing: 0, missingLangs: [], state: 'done', total }
    : {
        done: total - absent.length,
        missing: absent.length,
        missingLangs: absent,
        state: 'gap',
        total,
      }
}

/** Recommended lengths shared with the write-page SEO counters. */
export const SEO_TITLE_LIMIT = 60
export const SEO_DESCRIPTION_LIMIT = 145

export type SeoFieldKey = 'description' | 'image' | 'title'
export type SeoFieldState = 'long' | 'missing' | 'ok'

export interface SeoFieldCheck {
  key: SeoFieldKey
  limit?: number
  state: SeoFieldState
  used: number
}

function seoField(
  key: SeoFieldKey,
  value: string,
  limit?: number,
): SeoFieldCheck {
  if (!value) return { key, limit, state: 'missing', used: 0 }
  if (limit != null && value.length > limit) {
    return { key, limit, state: 'long', used: value.length }
  }
  return { key, limit, state: 'ok', used: value.length }
}

export function postSeoChecks(post: {
  image?: string | null
  seo?: {
    description?: string | null
    image?: string | null
    title?: string | null
  } | null
  summary?: string | null
  title?: string | null
}): SeoFieldCheck[] {
  const title = post.seo?.title?.trim() || post.title?.trim() || ''
  const description =
    post.seo?.description?.trim() || post.summary?.trim() || ''
  const image = post.seo?.image?.trim() || post.image?.trim() || ''
  return [
    seoField('image', image),
    seoField('title', title, SEO_TITLE_LIMIT),
    seoField('description', description, SEO_DESCRIPTION_LIMIT),
  ]
}

export function translationGapSummary(
  rows: Array<{ coverage: { translation: CapabilityCoverage } }>,
): TranslationGapSummary {
  let applicable = 0
  let items = 0
  let posts = 0
  for (const row of rows) {
    const coverage = row.coverage.translation
    if (
      !coverage.applicable ||
      (coverage.expected.length === 0 && coverage.langs.length === 0)
    ) {
      continue
    }
    applicable += 1
    const missing = missingLangs(coverage)
    if (missing.length === 0) continue
    posts += 1
    items += missing.length
  }
  return { applicable, items, posts }
}

export function aiOverviewArticlePath(id: string) {
  return `${aiOverviewPath}/${encodeURIComponent(id)}`
}

export function formatVersionLabel(version: string) {
  return /^\d/.test(version) ? `v${version}` : version
}

export function versionLabel(version: string | null | undefined) {
  if (!version || version === 'N/A') return '--'
  return formatVersionLabel(version)
}

export function displayDeskTime(formatted: string | null | undefined) {
  if (!formatted || formatted === '-' || formatted === 'N/A') return '--'
  return formatted
}

export function taskRecordPath(id: string, category: 'failed' | 'active') {
  return `/tasks/${encodeURIComponent(id)}?status=${category}`
}
