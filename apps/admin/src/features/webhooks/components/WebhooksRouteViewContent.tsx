import { Button, Empty } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Plus, Webhook } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { getWebhooks } from '~/api/webhooks'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '~/hooks/use-media-query'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { MasterDetailShell } from '~/ui/layout/master-detail-shell'
import { DetailPlaceholder, Page } from '~/ui/page'

import { useWebhookCopy } from '../copy'
import { WebhookCreateModal } from './WebhookCreateModal'
import { WebhookListPane } from './WebhookListPane'
import { WebhooksRouteContext } from './webhooks-route-context'

export function WebhooksRouteViewContent() {
  const text = useWebhookCopy()
  const { t } = useI18n()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const detailId = params.id ?? null
  const autoSelectedRef = useRef(false)
  const [creating, setCreating] = useState(false)

  const webhooksQuery = useQuery({
    queryFn: getWebhooks,
    queryKey: adminQueryKeys.webhooks.list(),
  })
  const webhooks = useMemo(() => webhooksQuery.data ?? [], [webhooksQuery.data])

  useEffect(() => {
    if (autoSelectedRef.current) return
    if (detailId) {
      autoSelectedRef.current = true
      return
    }
    if (!isDesktop || webhooks.length === 0) return
    autoSelectedRef.current = true
    navigate(`/webhooks/${webhooks[0].id}`, { replace: true })
  }, [detailId, isDesktop, navigate, webhooks])

  const closeDetail = useCallback(() => {
    navigate('/webhooks')
  }, [navigate])

  const ctxValue = useMemo(
    () => ({
      onBack: closeDetail,
      onDeleted: (id: string) => {
        const next = webhooks.find((item) => item.id !== id)
        navigate(isDesktop && next ? `/webhooks/${next.id}` : '/webhooks', {
          replace: true,
        })
      },
    }),
    [closeDetail, isDesktop, navigate, webhooks],
  )

  const empty = webhooksQuery.isSuccess && webhooks.length === 0

  return (
    <WebhooksRouteContext.Provider value={ctxValue}>
      {empty ? (
        <Page
          description={t('routes.webhooks.description')}
          title={t('routes.webhooks.title')}
        >
          <Empty
            action={
              <Button
                icon={Plus}
                onClick={() => setCreating(true)}
                type="primary"
              >
                {text('create')}
              </Button>
            }
            description={text('emptyDescription')}
            icon={Webhook}
            title={text('emptyTitle')}
          />
        </Page>
      ) : (
        <MasterDetailShell
          emptyDetail={
            webhooks.length > 0 ? (
              <DetailPlaceholder icon={Webhook} title={text('listTitle')} />
            ) : null
          }
          list={
            <WebhookListPane
              onCreate={() => setCreating(true)}
              onSelect={(webhook) => navigate(`/webhooks/${webhook.id}`)}
              selectedId={detailId}
            />
          }
          onDismiss={closeDetail}
        />
      )}
      <WebhookCreateModal
        existingIds={webhooks.map((item) => item.id)}
        onClose={() => setCreating(false)}
        onCreated={(id) => {
          setCreating(false)
          if (id) navigate(`/webhooks/${id}?tab=deliveries`)
        }}
        open={creating}
      />
    </WebhooksRouteContext.Provider>
  )
}
