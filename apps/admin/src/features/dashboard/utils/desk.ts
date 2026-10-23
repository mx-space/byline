import type { AiOverviewListRow } from '~/api/ai-overview'
import { getEditPathForDraft } from '~/features/drafts/utils/draft-edit-path'
import type { DraftModel } from '~/models/draft'

export const newPostPath = '/posts/edit'
export const draftsPath = '/drafts'
export const postsPath = '/posts'
export const aiOverviewPath = '/ai/overview'
export const failedTasksPath = '/tasks?status=failed'
export const activeTasksPath = '/tasks?status=active'

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

export function aiGapRows(rows: AiOverviewListRow[]) {
  return rows.filter((row) => row.gapCount > 0)
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
