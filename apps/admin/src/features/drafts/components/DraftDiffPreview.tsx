import type { RevisionSnapshot } from '~/models/draft'

import { useDraftCopy } from '../copy'
import type { DraftDiffStats } from '../types/drafts'
import { getDraftTextForDiff } from '../utils/draft-diff'
import { MarkdownDraftDiffPanel } from './MarkdownDraftDiffPanel'
import { RichDraftDiffPanel } from './RichDraftDiffPanel'

export function DraftDiffPreview(props: {
  comparisonLabel?: string
  currentDraft: RevisionSnapshot
  currentLabel?: string
  diffStats: DraftDiffStats | null
  hideTitle?: boolean
  selectedDraft: RevisionSnapshot
  selectedLabel?: string
}) {
  const { copy } = useDraftCopy()
  if (props.diffStats?.isSame) return null

  if (
    props.selectedDraft.contentFormat === 'lexical' &&
    props.currentDraft.contentFormat === 'lexical' &&
    props.selectedDraft.content &&
    props.currentDraft.content
  ) {
    return (
      <RichDraftDiffPanel
        comparisonLabel={
          props.comparisonLabel ?? copy('diffDirectionPublished')
        }
        currentContent={props.currentDraft.content}
        hideTitle={props.hideTitle}
        selectedContent={props.selectedDraft.content}
      />
    )
  }

  return (
    <MarkdownDraftDiffPanel
      comparisonLabel={props.comparisonLabel ?? copy('diffDirectionPublished')}
      currentLabel={props.currentLabel ?? copy('diffDraftFile')}
      currentText={getDraftTextForDiff(props.currentDraft)}
      hideTitle={props.hideTitle}
      selectedLabel={props.selectedLabel ?? copy('diffPublishedFile')}
      selectedText={getDraftTextForDiff(props.selectedDraft)}
    />
  )
}
