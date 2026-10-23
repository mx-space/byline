import {
  Button,
  confirmModal,
  Flexbox,
  Switch,
  Tabs,
  Text,
  toast,
} from '@lobehub/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router'

import type { WebhookModel } from '~/api/webhooks'
import { deleteWebhook, updateWebhook } from '~/api/webhooks'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane } from '~/ui/page'

import { webhooksQueryKey } from '../constants'
import { useWebhookCopy } from '../copy'
import {
  describeDelivery,
  endpointUrl,
  errorText,
  scopeText,
} from '../utils/webhooks'
import { styles } from './styles'
import { WebhookConfigTab } from './WebhookConfigTab'
import { WebhookDeliveries } from './WebhookDeliveries'
import { useLatestDelivery } from './WebhookListPane'

type DetailTab = 'config' | 'deliveries'

export function WebhookDetail(props: {
  onBack: () => void
  onDeleted: () => void
  webhook: WebhookModel
}) {
  const text = useWebhookCopy()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: DetailTab =
    searchParams.get('tab') === 'deliveries' ? 'deliveries' : 'config'
  const webhook = props.webhook
  const url = endpointUrl(webhook) || text('emptyMark')
  const latest = useLatestDelivery(webhook.id).data
  const latestFailed = latest
    ? describeDelivery(latest).type !== 'success'
    : false

  const setTab = (next: DetailTab) => {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next === 'config') params.delete('tab')
        else params.set('tab', next)
        return params
      },
      { replace: true },
    )
  }

  const invalidateDeliveries = () =>
    queryClient.invalidateQueries({
      queryKey: adminQueryKeys.webhooks.dispatchesRoot(webhook.id),
    })

  const enableMutation = useMutation({
    mutationFn: (enabled: boolean) => updateWebhook(webhook.id, { enabled }),
    onError: (error: unknown, _enabled, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          adminQueryKeys.webhooks.list(),
          context.previous,
        )
      }
      toast.error(
        text('enableFailed', { message: errorText(error, text('retryLater')) }),
      )
    },
    onMutate: async (enabled: boolean) => {
      await queryClient.cancelQueries({
        queryKey: adminQueryKeys.webhooks.list(),
      })
      const previous = queryClient.getQueryData<WebhookModel[]>(
        adminQueryKeys.webhooks.list(),
      )
      queryClient.setQueryData<WebhookModel[]>(
        adminQueryKeys.webhooks.list(),
        (current) =>
          current?.map((item) =>
            item.id === webhook.id ? { ...item, enabled } : item,
          ),
      )
      return { previous }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: webhooksQueryKey })
    },
    onSuccess: (_result, enabled) => {
      toast.success(enabled ? text('turnedOn') : text('turnedOff'))
    },
  })

  // The server has no test route; any PATCH sends a health_check delivery.
  const testMutation = useMutation({
    mutationFn: () => updateWebhook(webhook.id, { enabled: webhook.enabled }),
    onError: (error: unknown) => {
      toast.error(
        text('testFailed', { message: errorText(error, text('retryLater')) }),
      )
    },
    onSuccess: async () => {
      toast.success(text('testSent'))
      setTab('deliveries')
      await invalidateDeliveries()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWebhook(webhook.id),
    onSuccess: async () => {
      toast.success(text('deleted'))
      await queryClient.invalidateQueries({ queryKey: webhooksQueryKey })
      props.onDeleted()
    },
  })

  const askDelete = () => {
    confirmModal({
      cancelText: text('cancel'),
      content: text('deleteBody', { url }),
      okButtonProps: { danger: true },
      okText: text('delete'),
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync()
        } catch (error) {
          toast.error(
            text('deleteFailed', {
              message: errorText(error, text('retryLater')),
            }),
          )
        }
      },
      title: text('deleteTitle'),
    })
  }

  const eventsLabel = webhook.events.includes('all')
    ? text('allEvents')
    : text('eventCount', { count: webhook.events.length })

  return (
    <DetailPane
      actions={
        <Flexbox align="center" gap={8} horizontal>
          <Flexbox align="center" as="label" gap={6} horizontal>
            <Switch
              aria-label={text('enable')}
              checked={webhook.enabled}
              loading={enableMutation.isPending}
              onChange={(checked) => enableMutation.mutate(checked)}
              size="small"
            />
            <Text type="secondary">{text('enable')}</Text>
          </Flexbox>
          <Button
            icon={Send}
            loading={testMutation.isPending}
            onClick={() => testMutation.mutate()}
          >
            {text('sendTest')}
          </Button>
          <Button
            aria-label={text('delete')}
            danger
            icon={Trash2}
            onClick={askDelete}
            title={text('delete')}
            type="text"
          />
        </Flexbox>
      }
      backLabel={text('backToList')}
      contentWidth={tab === 'deliveries' ? 'full' : 'default'}
      meta={
        <>
          <span>{eventsLabel}</span>
          <span>
            {text('scopeLine', { value: scopeText(webhook.scope, text) })}
          </span>
          {latest ? (
            <span>
              {latestFailed ? text('lastFailed') : text('lastSucceeded')}
              {' · '}
              {format.relativeTime(latest.timestamp)}
            </span>
          ) : (
            <span>{text('lastNone')}</span>
          )}
        </>
      }
      onBack={props.onBack}
      tabs={
        <div className={styles.tabs}>
          <Tabs
            activeKey={tab}
            items={[
              { key: 'config', label: text('tabConfig') },
              { key: 'deliveries', label: text('tabDeliveries') },
            ]}
            onChange={(key) => setTab(key as DetailTab)}
            variant="square"
          />
        </div>
      }
      title={<span title={url}>{url}</span>}
    >
      <div hidden={tab !== 'config'}>
        <WebhookConfigTab key={webhook.id} webhook={webhook} />
      </div>
      {tab === 'deliveries' ? (
        <WebhookDeliveries key={webhook.id} webhook={webhook} />
      ) : null}
    </DetailPane>
  )
}
