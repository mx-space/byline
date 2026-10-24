import {
  ActionIcon,
  Alert,
  confirmModal,
  Drawer,
  Empty,
  Flexbox,
  Highlighter,
  Tag,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Inbox, RotateCcw } from 'lucide-react'
import { useState } from 'react'

import type { WebhookEventRecord, WebhookModel } from '~/api/webhooks'
import { getWebhookDispatches, redispatchWebhook } from '~/api/webhooks'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import {
  pinEnd,
  pinStart,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { dispatchPageSize } from '../constants'
import { useWebhookCopy } from '../copy'
import {
  deliveryDuration,
  describeDelivery,
  endpointUrl,
  errorText,
  failureText,
  formatAbsoluteTime,
  formatDuration,
  formatJson,
  HEALTH_CHECK_EVENT,
  responseBody,
  responseHeaders,
} from '../utils/webhooks'
import { styles } from './styles'

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(target.closest('a,button,[data-row-actions]'))
  )
}

export function WebhookDeliveries(props: { webhook: WebhookModel }) {
  const text = useWebhookCopy()
  const table = useRecordTable()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const webhook = props.webhook
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const query = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () =>
      getWebhookDispatches(webhook.id, { page, size: dispatchPageSize }),
    queryKey: adminQueryKeys.webhooks.dispatches({
      page,
      size: dispatchPageSize,
      webhookId: webhook.id,
    }),
  })
  const records = query.data?.data ?? []
  const total = query.data?.pagination?.total ?? 0
  const openRecord = records.find((record) => record.id === openId) ?? null

  const redispatchMutation = useMutation({
    mutationFn: (eventId: string) => redispatchWebhook(eventId),
    onSuccess: async () => {
      toast.success(text('redispatched'))
      setPage(1)
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.webhooks.dispatchesRoot(webhook.id),
      })
    },
  })

  const askRedispatch = (record: WebhookEventRecord) => {
    confirmModal({
      cancelText: text('cancel'),
      content: `${record.event || text('emptyMark')} → ${endpointUrl(webhook)}`,
      okText: text('redispatch'),
      onOk: async () => {
        try {
          await redispatchMutation.mutateAsync(record.id)
          setOpenId(null)
        } catch (error) {
          toast.error(
            text('redispatchFailed', {
              message: errorText(error, text('retryLater')),
            }),
          )
        }
      },
      title: text('redispatch'),
    })
  }

  const columns: ProColumns<WebhookEventRecord>[] = [
    {
      dataIndex: 'event',
      render: (_dom, record) => (
        <Flexbox align="center" gap={6} horizontal style={{ minWidth: 0 }}>
          <span className={styles.eventName} title={record.event}>
            {record.event || text('emptyMark')}
          </span>
          {record.event === HEALTH_CHECK_EVENT ? (
            <Tag size="small">{text('healthCheck')}</Tag>
          ) : null}
        </Flexbox>
      ),
      title: text('columnEvent'),
      ...pinStart(table.pin),
    },
    {
      dataIndex: 'status',
      render: (_dom, record) => <DeliveryStatusTag record={record} />,
      title: text('columnStatus'),
      width: 120,
    },
    {
      align: 'right',
      key: 'duration',
      render: (_dom, record) => {
        const duration = deliveryDuration(record)
        return (
          <span className={styles.time}>
            {duration == null ? text('emptyMark') : formatDuration(duration)}
          </span>
        )
      },
      responsive: ['md'],
      title: text('columnDuration'),
      width: 112,
    },
    {
      dataIndex: 'timestamp',
      render: (_dom, record) => (
        <Tooltip title={formatAbsoluteTime(record.timestamp)}>
          <span className={styles.time}>
            {record.timestamp
              ? format.relativeTime(record.timestamp)
              : text('emptyMark')}
          </span>
        </Tooltip>
      ),
      responsive: ['md'],
      title: text('columnTime'),
      width: 132,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, record) => (
        <div className={styles.tableActions} data-row-actions="">
          <ActionIcon
            aria-label={text('redispatch')}
            icon={RotateCcw}
            loading={
              redispatchMutation.isPending &&
              redispatchMutation.variables === record.id
            }
            onClick={() => askRedispatch(record)}
            size="small"
            title={text('redispatch')}
          />
        </div>
      ),
      title: '',
      width: 64,
      ...pinEnd(table.pin),
    },
  ]

  const initialLoading = query.isPending

  return (
    <>
      {query.isError && records.length > 0 ? (
        <Alert
          action={
            <Button onClick={() => void query.refetch()}>
              {text('retry')}
            </Button>
          }
          description={errorText(query.error, text('retryLater'))}
          showIcon
          title={text('deliveryErrorTitle')}
          type="warning"
        />
      ) : null}
      <ProTable<WebhookEventRecord>
        className={recordTableStyles.root}
        columnEmptyText="--"
        columns={columns}
        scroll={recordTableScroll(columns, table)}
        tableLayout="fixed"
        dataSource={records}
        headerTitle={
          total > 0 ? (
            <Text type="secondary">
              {text('deliveryCount', { count: total })}
            </Text>
          ) : undefined
        }
        loading={query.isFetching && query.isPlaceholderData}
        locale={{
          emptyText: query.isError ? (
            <Empty
              action={
                <Button onClick={() => void query.refetch()}>
                  {text('retry')}
                </Button>
              }
              description={errorText(query.error, text('retryLater'))}
              title={text('deliveryErrorTitle')}
            />
          ) : (
            <Empty
              description={text('deliveryEmptyDescription')}
              icon={Inbox}
              title={text('deliveryEmptyTitle')}
            />
          ),
        }}
        onRow={(record) => ({
          onClick: (event) => {
            if (isInteractiveTarget(event.target)) return
            setOpenId(record.id)
          },
        })}
        options={{
          density: false,
          fullScreen: false,
          reload: () => void query.refetch(),
          search: false,
          setting: false,
        }}
        pagination={{
          current: page,
          hideOnSinglePage: true,
          onChange: (next) => setPage(next),
          pageSize: dispatchPageSize,
          showSizeChanger: false,
          total,
        }}
        rowClassName={() => styles.tableRow}
        rowKey="id"
        search={false}
        tableRender={(_props, dom) =>
          initialLoading ? <TableSkeleton rows={6} /> : dom
        }
        variant="outlined"
      />
      <DeliveryDrawer
        onClose={() => setOpenId(null)}
        onRedispatch={askRedispatch}
        record={openRecord}
        redispatching={redispatchMutation.isPending}
      />
    </>
  )
}

function DeliveryStatusTag(props: { record: WebhookEventRecord }) {
  const text = useWebhookCopy()
  const fact = describeDelivery(props.record)
  const label =
    props.record.status > 0 ? String(props.record.status) : text('notDelivered')
  const tag = (
    <Tag color={fact.type === 'success' ? 'success' : 'error'}>{label}</Tag>
  )
  if (fact.type === 'success') return tag
  return <Tooltip title={failureText(fact, text)}>{tag}</Tooltip>
}

function DeliveryDrawer(props: {
  onClose: () => void
  onRedispatch: (record: WebhookEventRecord) => void
  record: WebhookEventRecord | null
  redispatching: boolean
}) {
  const text = useWebhookCopy()
  const record = props.record
  const fact = record ? describeDelivery(record) : null
  const duration = record ? deliveryDuration(record) : null

  return (
    <Drawer
      footer={
        record ? (
          <Flexbox gap={8} horizontal justify="flex-end">
            <Button
              icon={RotateCcw}
              loading={props.redispatching}
              onClick={() => props.onRedispatch(record)}
              type="primary"
            >
              {text('redispatch')}
            </Button>
          </Flexbox>
        ) : null
      }
      onClose={props.onClose}
      open={record != null}
      placement="right"
      title={record?.event || text('deliveryTitle')}
      width="min(100vw, 640px)"
    >
      {record && fact ? (
        <div className={styles.drawerBody}>
          {fact.type === 'success' ? null : (
            <Alert showIcon title={failureText(fact, text)} type="error" />
          )}
          <dl className={styles.facts}>
            <dt>{text('columnStatus')}</dt>
            <dd>
              <DeliveryStatusTag record={record} />
            </dd>
            <dt>{text('columnTime')}</dt>
            <dd className={styles.time}>
              {formatAbsoluteTime(record.timestamp) || text('emptyMark')}
            </dd>
            <dt>{text('columnDuration')}</dt>
            <dd className={styles.time}>
              {duration == null ? text('emptyMark') : formatDuration(duration)}
            </dd>
          </dl>
          <CodeSection
            content={record.headers}
            label={text('requestHeaders')}
          />
          <CodeSection content={record.payload} label={text('requestBody')} />
          <CodeSection
            content={responseHeaders(record.response)}
            label={text('responseHeaders')}
          />
          <CodeSection
            content={responseBody(record.response)}
            label={text('responseBody')}
          />
        </div>
      ) : null}
    </Drawer>
  )
}

function codeLanguage(body: string) {
  const trimmed = body.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json'
  return 'plaintext'
}

function CodeSection(props: { content: unknown; label: string }) {
  const text = useWebhookCopy()
  const body = formatJson(props.content)
  return (
    <section className={styles.drawerSection}>
      <Text type="secondary" weight={500}>
        {props.label}
      </Text>
      {body ? (
        <Highlighter
          language={codeLanguage(body)}
          style={{ maxHeight: 320, overflow: 'auto' }}
          variant="filled"
          wrap
        >
          {body}
        </Highlighter>
      ) : (
        <Text type="secondary">{text('emptyMark')}</Text>
      )}
    </section>
  )
}
