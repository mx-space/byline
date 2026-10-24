import type { RevisionSnapshot } from '~/models/draft'

import { useDraftCopy } from '../copy'
import type { DraftDiffStats } from '../types/drafts'
import { RichDraftDiffPanel } from './RichDraftDiffPanel'

export function DraftDiffPreview(props: {
  comparisonLabel?: string
  currentDraft: RevisionSnapshot
  diffStats: DraftDiffStats | null
  hideTitle?: boolean
  selectedDraft: RevisionSnapshot
}) {
  const { copy } = useDraftCopy()
  if (props.diffStats?.isSame) return null

  return (
    <RichDraftDiffPanel
      comparisonLabel={props.comparisonLabel ?? copy('diffDirectionPublished')}
      currentContent={props.currentDraft.content ?? ''}
      hideTitle={props.hideTitle}
      selectedContent={props.selectedDraft.content ?? ''}
    />
  )
}
