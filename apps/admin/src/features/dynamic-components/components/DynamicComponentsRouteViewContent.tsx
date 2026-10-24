import { toast } from '@lobehub/ui'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'

import { deleteDynamicComponentEntry } from '~/api/dynamic-components'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { confirmDialog } from '~/ui/feedback/confirm'
import { MasterDetailShell } from '~/ui/layout/master-detail-shell'

import {
  useApplyDynamicCatalog,
  useDynamicCatalog,
} from '../hooks/use-dynamic-catalog'
import type { DynamicComponentItem } from '../types/dynamic-components'
import { DynamicComponentsRouteContext } from './dynamic-components-route-context'
import { presentDynamicComponentEditor } from './DynamicComponentEditorModal'
import { DynamicComponentList } from './DynamicComponentList'
import {
  DynamicComponentDetailEmptyState,
  DynamicComponentsEmptyPage,
} from './DynamicComponentStates'

const BASE_PATH = '/dynamic-components'

export function DynamicComponentsRouteViewContent() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const { items, query } = useDynamicCatalog()
  const applyCatalog = useApplyDynamicCatalog()
  const detailId = params.id ?? null
  const autoSelectedRef = useRef(false)

  useEffect(() => {
    if (autoSelectedRef.current) return
    if (detailId) {
      autoSelectedRef.current = true
      return
    }
    if (!isDesktop || items.length === 0) return
    autoSelectedRef.current = true
    navigate(`${BASE_PATH}/${items[0].id}`, { replace: true })
  }, [detailId, isDesktop, items, navigate])

  const closeDetail = useCallback(() => {
    navigate(BASE_PATH)
  }, [navigate])

  const openEditor = useCallback(
    async (item: DynamicComponentItem | null) => {
      const result = await presentDynamicComponentEditor(item)
      if (!result) return
      applyCatalog(result.catalog)
      const saved = result.catalog.components.find(
        (entry) => entry.url === result.url,
      )
      if (saved?.id) navigate(`${BASE_PATH}/${saved.id}`)
    },
    [applyCatalog, navigate],
  )

  const deleteMutation = useMutation({
    mutationFn: deleteDynamicComponentEntry,
    onError: () => {
      toast.error(t('dynamicComponents.toast.deleteFailed'))
    },
    onSuccess: (catalog) => {
      applyCatalog(catalog)
      toast.success(t('dynamicComponents.toast.deleted'))
      const next = catalog.components.find((entry) => entry.id)
      navigate(isDesktop && next ? `${BASE_PATH}/${next.id}` : BASE_PATH, {
        replace: true,
      })
    },
  })

  const ctxValue = useMemo(
    () => ({
      onBack: closeDetail,
      onDelete: async (item: DynamicComponentItem) => {
        const confirmed = await confirmDialog({
          confirmText: t('common.delete'),
          description: t('dynamicComponents.delete.description'),
          destructive: true,
          title: t('dynamicComponents.delete.title', { name: item.name }),
        })
        if (confirmed) deleteMutation.mutate(item.id)
      },
      onEdit: (item: DynamicComponentItem) => void openEditor(item),
    }),
    [closeDetail, deleteMutation, openEditor, t],
  )

  const empty = query.isSuccess && items.length === 0

  return (
    <DynamicComponentsRouteContext.Provider value={ctxValue}>
      {empty ? (
        <DynamicComponentsEmptyPage onCreate={() => void openEditor(null)} />
      ) : (
        <MasterDetailShell
          emptyDetail={
            items.length > 0 ? <DynamicComponentDetailEmptyState /> : null
          }
          list={
            <DynamicComponentList
              onCreate={() => void openEditor(null)}
              onSelect={(item) => navigate(`${BASE_PATH}/${item.id}`)}
              selectedId={detailId}
            />
          }
          onDismiss={closeDetail}
        />
      )}
    </DynamicComponentsRouteContext.Provider>
  )
}
