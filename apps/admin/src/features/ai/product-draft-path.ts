import { getEditPathForDraft } from '~/features/drafts/utils/draft-edit-path'
import { DraftRefType } from '~/models/draft'

export function productDraftPath(draftId: string) {
  return getEditPathForDraft({
    id: draftId,
    document: { refId: null, refType: DraftRefType.Post },
  })
}
