import {
  ActionIcon,
  Alert,
  Button,
  Center,
  cx,
  Empty,
  Skeleton,
  Tag,
  Tooltip,
} from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Webhook } from 'lucide-react'

import type { WebhookModel } from '~/api/webhooks'
import { getWebhookDispatches, getWebhooks } from '~/api/webhooks'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { ListPane } from '~/ui/page'

import { useWebhookCopy } from '../copy'
import {
  describeDelivery,
  endpointUrl,
  errorText,
  formatAbsoluteTime,
  splitEndpoint,
} from '../utils/webhooks'
import { styles } from './styles'

export function useLatestDelivery(webhookId: string) {
  return useQuery({
    queryFn: () => getWebhookDispatches(webhookId, { page: 1, size: 1 }),
    queryKey: [...adminQueryKeys.webhooks.dispatchesRoot(webhookId), 'latest'],
    select: (result) => result.data?.[0] ?? null,
  })
}

export function WebhookListPane(props: {
  onCreate: () => void
  onSelect: (webhook: WebhookModel) => void
  selectedId: string | null
}) {
  const text = useWebhookCopy()
  const query = useQuery({
    queryFn: getWebhooks,
    queryKey: adminQueryKeys.webhooks.list(),
  })
  const webhooks = query.data ?? []
  const hasRows = webhooks.length > 0

  const createButton = (
    <Button icon={Plus} onClick={props.onCreate} type="primary">
      {text('create')}
    </Button>
  )

  return (
    <ListPane
      actions={
        <>
          <ActionIcon
            aria-label={text('refresh')}
            icon={RefreshCw}
            loading={query.isFetching && !query.isPending}
            onClick={() => void query.refetch()}
            title={text('refresh')}
          />
          {hasRows ? (
            <ActionIcon
              aria-label={text('create')}
              icon={Plus}
              onClick={props.onCreate}
              title={text('create')}
            />
          ) : null}
        </>
      }
      aria-busy={query.isFetching}
      count={hasRows ? webhooks.length : undefined}
      notices={
        query.isError && hasRows ? (
          <Alert
            action={
              <Button onClick={() => void query.refetch()}>
                {text('retry')}
              </Button>
            }
            showIcon
            title={text('listErrorTitle')}
            type="warning"
          />
        ) : undefined
      }
      title={text('listTitle')}
    >
      {query.isPending ? (
        <div className={styles.stack}>
          {[0, 1, 2].map((index) => (
            <Skeleton height={44} key={index} width="100%" />
          ))}
        </div>
      ) : null}
      {query.isError && !hasRows ? (
        <Center padding={24}>
          <Empty
            action={
              <Button onClick={() => void query.refetch()}>
                {text('retry')}
              </Button>
            }
            description={errorText(query.error, text('listErrorDescription'))}
            title={text('listErrorTitle')}
          />
        </Center>
      ) : null}
      {query.isSuccess && !hasRows ? (
        <Center padding={24}>
          <Empty
            action={createButton}
            description={text('emptyDescription')}
            icon={Webhook}
            title={text('emptyTitle')}
          />
        </Center>
      ) : null}
      {hasRows ? (
        <nav aria-label={text('listTitle')}>
          {webhooks.map((webhook) => (
            <WebhookRow
              key={webhook.id}
              onSelect={() => props.onSelect(webhook)}
              selected={webhook.id === props.selectedId}
              webhook={webhook}
            />
          ))}
        </nav>
      ) : null}
    </ListPane>
  )
}

function WebhookRow(props: {
  onSelect: () => void
  selected: boolean
  webhook: WebhookModel
}) {
  const text = useWebhookCopy()
  const { format } = useI18n()
  const url = endpointUrl(props.webhook)
  const { host, path } = splitEndpoint(url)
  const latestQuery = useLatestDelivery(props.webhook.id)
  const latest = latestQuery.data
  const failed = latest ? describeDelivery(latest).type !== 'success' : false
  const statusLabel = latest
    ? failed
      ? text('lastFailed')
      : text('lastSucceeded')
    : text('lastNone')

  return (
    <button
      aria-current={props.selected ? 'true' : undefined}
      className={cx(styles.row, props.selected && styles.rowCurrent)}
      onClick={props.onSelect}
      title={url}
      type="button"
    >
      <Tooltip title={statusLabel}>
        <span
          aria-label={statusLabel}
          className={cx(
            styles.dot,
            latest && (failed ? styles.dotError : styles.dotSuccess),
          )}
          role="img"
        />
      </Tooltip>
      <span
        className={cx(
          styles.rowMain,
          !props.webhook.enabled && styles.rowMuted,
        )}
      >
        <span className={styles.rowHost}>{host || text('emptyMark')}</span>
        {path ? <span className={styles.rowPath}>{path}</span> : null}
      </span>
      <span className={styles.rowSide}>
        {props.webhook.enabled ? null : (
          <Tag size="small">{text('disabled')}</Tag>
        )}
        {latest ? (
          <time
            className={styles.rowTime}
            dateTime={latest.timestamp}
            title={formatAbsoluteTime(latest.timestamp)}
          >
            {format.relativeTime(latest.timestamp)}
          </time>
        ) : null}
      </span>
    </button>
  )
}
