import type { ContentDocument, DraftModel } from '~/models/draft'

export function getEditPathForDraft(
  draft: Pick<DraftModel, 'id'> & {
    document: Pick<ContentDocument, 'refId' | 'refType'>
  },
) {
  const basePath = '/posts/edit'
  const params = new URLSearchParams()
  params.set('draftId', draft.id)
  if (draft.document.refId) params.set('id', draft.document.refId)

  return `${basePath}?${params.toString()}`
}

export function getEditPathForRevision(
  draft: DraftModel,
  baseRevisionId: string,
) {
  const url = new URL(getEditPathForDraft(draft), 'https://admin.invalid')
  url.searchParams.delete('draftId')
  url.searchParams.set('baseRevisionId', baseRevisionId)
  return `${url.pathname}?${url.searchParams.toString()}`
}
