import { confirmModal, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileClock } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { deleteDraft, getDrafts } from '~/api/drafts'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import type { DraftModel } from '~/models/draft'
import { DraftRefType } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'
import { MasterDetailShell } from '~/ui/layout/master-detail-shell'
import { useListKeyboard } from '~/ui/list-actions'
import { DetailPlaceholder } from '~/ui/page'

import { DRAFT_PAGE_SIZE, draftsQueryKey } from '../constants'
import { useDraftCopy } from '../copy'
import type { DraftSort, DraftTypeFilter } from '../utils/draft-decision'
import { draftTitle, sortDrafts } from '../utils/draft-decision'
import { getEditPathForDraft } from '../utils/draft-edit-path'
import { describeDraftError } from '../utils/errors'
import { buildDraftActions } from './buildDraftActions'
import { DRAFT_LIST_SCOPE_ID, DraftListPane } from './DraftListPane'
import { DraftsRouteContext } from './drafts-route-context'

const WRITE_PATH = '/posts/edit'

function readPage(params: URLSearchParams) {
  const value = Number(params.get('page'))
  return Number.isInteger(value) && value > 0 ? value : 1
}

function readFilter(params: URLSearchParams): DraftTypeFilter {
  const value = params.get('type')
  return value === 'new' || value === 'changed' ? value : 'all'
}

function readSort(params: URLSearchParams): DraftSort {
  const value = params.get('sort')
  return value === 'oldest' || value === 'title' ? value : 'saved'
}

const sortParams: Record<
  DraftSort,
  { sort_by: string; sort_order: 'asc' | 'desc' }
> = {
  oldest: { sort_by: 'updatedAt', sort_order: 'asc' },
  saved: { sort_by: 'updatedAt', sort_order: 'desc' },
  title: { sort_by: 'title', sort_order: 'asc' },
}

export function DraftsRouteViewContent() {
  const { copy, locale } = useDraftCopy()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const detailId = useParams<{ id?: string }>().id ?? null
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const page = readPage(searchParams)
  const filter = readFilter(searchParams)
  const sort = readSort(searchParams)
  const [keyword, setKeyword] = useState(urlQuery)
  const searchParamsRef = useRef(searchParams)
  searchParamsRef.current = searchParams

  useEffect(() => {
    setKeyword(urlQuery)
  }, [urlQuery])

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParamsRef.current)
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      setSearchParams(next, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (keyword === (searchParamsRef.current.get('q') ?? '')) return
      updateParams({ page: null, q: keyword || null })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [keyword, updateParams])

  const draftsQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getDrafts({
        hasRef: filter === 'all' ? undefined : filter === 'changed',
        page,
        refType: DraftRefType.Post,
        search: urlQuery || undefined,
        size: DRAFT_PAGE_SIZE,
        ...sortParams[sort],
      }),
    queryKey: [
      ...adminQueryKeys.drafts.list(DraftRefType.Post),
      { filter, page, q: urlQuery, sort },
    ],
  })

  const pagination = draftsQuery.data?.pagination
  const drafts = useMemo(
    () =>
      sortDrafts(draftsQuery.data?.data ?? [], sort, copy('untitled'), locale),
    [copy, draftsQuery.data, locale, sort],
  )
  const selectionClearRef = useRef<(() => void) | null>(null)

  const listSearch = useCallback((id?: string) => {
    const qs = searchParamsRef.current.toString()
    const path = id ? `/drafts/${id}` : '/drafts'
    return qs ? `${path}?${qs}` : path
  }, [])

  const openDraft = useCallback(
    (draft: DraftModel) => navigate(listSearch(draft.id)),
    [listSearch, navigate],
  )

  const closeDetail = useCallback(
    () => navigate(listSearch()),
    [listSearch, navigate],
  )

  useEffect(() => {
    if (!isDesktop || detailId || draftsQuery.isPlaceholderData) return
    const first = drafts[0]
    if (first) navigate(listSearch(first.id), { replace: true })
  }, [
    detailId,
    drafts,
    draftsQuery.isPlaceholderData,
    isDesktop,
    listSearch,
    navigate,
  ])

  const refreshAfterDelete = useCallback(
    async (closeOpenDetail: boolean) => {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.drafts.listRoot,
      })
      if (closeOpenDetail) closeDetail()
      void queryClient.invalidateQueries({ queryKey: draftsQueryKey })
    },
    [closeDetail, queryClient],
  )

  const deleteMutation = useMutation({
    mutationFn: deleteDraft,
    onError: (error: unknown) =>
      toast.error(describeDraftError(error, copy('deleteFailed'))),
    onSuccess: async (_result, id) => {
      toast.success(copy('deleted'))
      selectionClearRef.current?.()
      await refreshAfterDelete(id === detailId)
    },
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => deleteDraft(id)))
      return {
        failedCount: results.filter((result) => result.status === 'rejected')
          .length,
        ids,
        successCount: results.filter((result) => result.status === 'fulfilled')
          .length,
      }
    },
    onError: (error: unknown) =>
      toast.error(describeDraftError(error, copy('deleteFailed'))),
    onSuccess: async ({ failedCount, ids, successCount }) => {
      selectionClearRef.current?.()
      if (failedCount > 0) {
        toast.warning(
          copy('deletedPartial', {
            failed: failedCount,
            success: successCount,
          }),
        )
      } else {
        toast.success(copy('deleted'))
      }
      await refreshAfterDelete(Boolean(detailId && ids.includes(detailId)))
    },
  })

  const confirmAndDelete = useCallback(
    (targets: DraftModel[]) => {
      if (targets.length === 0) return
      const single = targets.length === 1 ? targets[0] : null
      confirmModal({
        cancelText: copy('cancel'),
        content: single ? copy('confirmDeleteBody') : copy('confirmBatchBody'),
        okButtonProps: { danger: true },
        okText: single
          ? copy('confirmDeleteConfirm')
          : copy('confirmBatchConfirm', { count: targets.length }),
        onOk: async () => {
          if (single)
            await deleteMutation.mutateAsync(single.id).catch(() => {})
          else
            await batchDeleteMutation
              .mutateAsync(targets.map((target) => target.id))
              .catch(() => {})
        },
        title: single
          ? copy('confirmDeleteTitle', {
              title: draftTitle(single, copy('untitled')),
            })
          : copy('confirmBatchTitle', { count: targets.length }),
      })
    },
    [batchDeleteMutation, copy, deleteMutation],
  )

  const actions = useMemo(
    () =>
      buildDraftActions(
        {
          continueWriting: (draft) => navigate(getEditPathForDraft(draft)),
          deleteMany: confirmAndDelete,
          open: openDraft,
        },
        copy,
      ),
    [confirmAndDelete, copy, navigate, openDraft],
  )

  const { selection } = useListKeyboard<DraftModel>({
    actions,
    getId: (draft) => draft.id,
    items: drafts,
    onItemFocus: (id) => {
      const draft = drafts.find((item) => item.id === id)
      if (draft) openDraft(draft)
    },
    resetOn: [urlQuery, page, filter, sort],
    scopeId: DRAFT_LIST_SCOPE_ID,
  })
  selectionClearRef.current = selection.clear

  const routeContextValue = useMemo(
    () => ({
      deleting: deleteMutation.isPending || batchDeleteMutation.isPending,
      onBack: closeDetail,
      onDelete: (draft: DraftModel) => confirmAndDelete([draft]),
    }),
    [
      batchDeleteMutation.isPending,
      closeDetail,
      confirmAndDelete,
      deleteMutation.isPending,
    ],
  )

  const totalPages = pagination
    ? pagination.totalPages || Math.ceil(pagination.total / DRAFT_PAGE_SIZE)
    : 0

  return (
    <DraftsRouteContext.Provider value={routeContextValue}>
      <MasterDetailShell
        detailScopeId={`${DRAFT_LIST_SCOPE_ID}-detail`}
        emptyDetail={
          drafts.length > 0 ? (
            <DetailPlaceholder
              icon={FileClock}
              title={copy('detailIdleTitle')}
            />
          ) : null
        }
        list={
          <DraftListPane
            actions={actions}
            batchDeleting={batchDeleteMutation.isPending}
            detailId={detailId}
            drafts={drafts}
            error={
              draftsQuery.isError
                ? describeDraftError(draftsQuery.error, copy('listErrorBody'))
                : null
            }
            filter={filter}
            isFetching={draftsQuery.isFetching}
            isPending={draftsQuery.isPending}
            keyword={keyword}
            onBatchDelete={() =>
              confirmAndDelete(selection.getSelectedTargets())
            }
            onClearSearch={() => setKeyword('')}
            onFilterChange={(next) =>
              updateParams({ page: null, type: next === 'all' ? null : next })
            }
            onKeywordChange={setKeyword}
            onOpen={openDraft}
            onPageChange={(next) =>
              updateParams({ page: next > 1 ? String(next) : null })
            }
            onRefresh={() => void draftsQuery.refetch()}
            onSortChange={(next) =>
              updateParams({ sort: next === 'saved' ? null : next })
            }
            onWrite={() => navigate(WRITE_PATH)}
            page={page}
            searching={draftsQuery.isFetching && Boolean(urlQuery)}
            selection={selection}
            sort={sort}
            total={pagination?.total ?? null}
            totalPages={totalPages}
          />
        }
        onDismiss={closeDetail}
      />
    </DraftsRouteContext.Provider>
  )
}
