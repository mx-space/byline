import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileQuestion, RefreshCw } from 'lucide-react'
import { useParams } from 'react-router'

import { getDraftById } from '~/api/drafts'
import { findInListCache } from '~/api/list-cache'
import { useDocumentTitle } from '~/hooks/use-document-title'
import type { DraftModel } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane, DetailPlaceholder } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useDraftCopy } from '../copy'
import { draftTitle } from '../utils/draft-decision'
import { describeDraftError } from '../utils/errors'
import { DraftDetail } from './DraftDetail'
import { DraftDetailSkeleton } from './DraftListSkeleton'
import { useDraftsRouteContext } from './drafts-route-context'

const LIST_PREFIX = adminQueryKeys.drafts.listRoot

export function DraftDetailRoute() {
  const { copy } = useDraftCopy()
  const { id } = useParams<{ id?: string }>()
  const queryClient = useQueryClient()
  const ctx = useDraftsRouteContext()
  const initialDraft = id
    ? findInListCache<DraftModel>(queryClient, LIST_PREFIX, id)
    : undefined
  const draftQuery = useQuery({
    enabled: Boolean(id),
    initialData: initialDraft,
    queryFn: () => getDraftById(id!),
    queryKey: adminQueryKeys.drafts.detail(id ?? ''),
    staleTime: initialDraft ? 30_000 : 0,
  })

  useDocumentTitle(
    draftQuery.data ? draftTitle(draftQuery.data, copy('untitled')) : undefined,
  )

  if (!id) return null

  if (draftQuery.isError && !draftQuery.data) {
    return (
      <DetailPane
        backLabel={copy('title')}
        contentWidth="article"
        onBack={ctx.onBack}
        title={copy('title')}
      >
        <DetailPlaceholder
          action={
            <Button onClick={() => void draftQuery.refetch()}>
              {copy('retry')}
            </Button>
          }
          description={describeDraftError(
            draftQuery.error,
            copy('detailErrorBody'),
          )}
          icon={RefreshCw}
          title={copy('detailErrorTitle')}
        />
      </DetailPane>
    )
  }

  if (!draftQuery.data) {
    if (draftQuery.isPending) return <DraftDetailSkeleton />
    return (
      <DetailPane
        backLabel={copy('title')}
        contentWidth="article"
        onBack={ctx.onBack}
        title={copy('title')}
      >
        <DetailPlaceholder
          action={<Button onClick={ctx.onBack}>{copy('backToList')}</Button>}
          description={copy('detailMissingBody')}
          icon={FileQuestion}
          title={copy('detailMissingTitle')}
        />
      </DetailPane>
    )
  }

  return (
    <DraftDetail
      deleting={ctx.deleting}
      draft={draftQuery.data}
      onBack={ctx.onBack}
      onDelete={ctx.onDelete}
    />
  )
}

export default DraftDetailRoute
