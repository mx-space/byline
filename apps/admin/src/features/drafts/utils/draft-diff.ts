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
    isSame: selectedText === currentText,
  }
}

export function getDraftTextForDiff(revision: RevisionSnapshot) {
  if (revision.contentFormat === 'lexical' && revision.content) {
    return revision.text || revision.content
  }
  return revision.text || revision.content || ''
}
