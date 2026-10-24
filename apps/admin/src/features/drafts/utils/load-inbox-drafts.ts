import { getDrafts, type GetDraftsParams } from '~/api/drafts'
import type { DraftModel } from '~/models/draft'

import { isPublishedIdenticalDraft } from './draft-decision'

const FETCH_SIZE = 50
const MAX_PAGES = 40

export async function loadInboxDrafts(
  params: Omit<GetDraftsParams, 'page' | 'size'>,
) {
  const rows: DraftModel[] = []
  let page = 1
  let totalPages = 1
  while (page <= totalPages && page <= MAX_PAGES) {
    const result = await getDrafts({ ...params, page, size: FETCH_SIZE })
    const batch = result.data ?? []
    rows.push(...batch)
    const reported = result.pagination
    totalPages =
      reported?.totalPages ||
      (reported?.total ? Math.ceil(reported.total / FETCH_SIZE) : 1)
    if (batch.length === 0) break
    page += 1
  }
  return rows.filter((draft) => !isPublishedIdenticalDraft(draft))
}
