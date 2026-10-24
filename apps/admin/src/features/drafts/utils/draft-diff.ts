import type { RevisionSnapshot } from '~/models/draft'

import type { DraftDiffStats } from '../types/drafts'

export function computeDiffStats(
  selected: RevisionSnapshot,
  current: RevisionSnapshot,
): DraftDiffStats {
  const selectedText = getDraftTextForDiff(selected)
  const currentText = getDraftTextForDiff(current)
  return {
    delta: currentText.length - selectedText.length,
    isSame: selected.content === current.content,
  }
}

export function getDraftTextForDiff(revision: RevisionSnapshot) {
  return revision.text || ''
}
