import { getEditPathForDraft } from '~/features/drafts/utils/draft-edit-path'
import type { DraftModel } from '~/models/draft'

import { deskWritingItemLimit } from '../constants'

export type DeskWritingStatus = 'modified' | 'unpublished'

export interface DeskWritingItem {
  branchCount: number
  chars: number
  draftId: string
  excerpt: string
  id: string
  status: DeskWritingStatus
  time: string
  title: string
  to: string
}

const EXCERPT_LENGTH = 160

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
    const text = draft.headRevision.text ?? ''
    byDocument.set(draft.documentId, {
      branchCount: 1,
      chars: text.length,
      draftId: draft.id,
      excerpt: text.replaceAll(/\s+/g, ' ').trim().slice(0, EXCERPT_LENGTH),
      id: draft.documentId,
      status: draft.document.refId ? 'modified' : 'unpublished',
      time: draft.updatedAt ?? draft.createdAt,
      title: draft.headRevision.title,
      to: getEditPathForDraft(draft),
    })
  }

  return [...byDocument.values()]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, deskWritingItemLimit)
}

export function resolveGreetingKey(hour: number) {
  if (hour < 12) return 'dashboard.desk.greeting.morning' as const
  if (hour < 18) return 'dashboard.desk.greeting.afternoon' as const
  return 'dashboard.desk.greeting.evening' as const
}

export function formatVersionLabel(version: string) {
  return /^\d/.test(version) ? `v${version}` : version
}
