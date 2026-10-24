import {
  ActionIcon,
  Alert,
  type ContextMenuItem,
  createStaticStyles,
  DropdownMenu,
  Empty,
  Flexbox,
  Segmented,
  Select,
  Skeleton,
  Tag,
  toast,
} from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Lock, LockOpen, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import type { AIInsights, AISummary, AITranslation, AITtsRow } from '~/api/ai'
import { getArticleOverview } from '~/api/ai-overview'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import { useArticleGroupedRouteContext } from '../components/article-grouped/article-grouped-route-context'
import type { AiProduct } from '../components/article-grouped/types'
import {
  GENERATE_LABEL,
  isLockedItem,
  PRIMARY_ACTION_IDS,
  useArtefactActions,
} from '../components/article-grouped/use-artefact-actions'
import { useAiCopy } from '../copy'
import { DetailDrawer } from '../hub/DetailDrawer'
import { getErrorMessage, isTtsNarrationIncomplete } from '../utils/ai'
import { InsightsBody, SummaryBody, TranslationBody } from './bodies'
import { TtsListenBody } from './TtsListenBody'

const KIND_KEY = {
  insights: 'kindInsights',
  summary: 'kindSummary',
  translation: 'kindTranslation',
  tts: 'kindTts',
} as const

const EMPTY_TITLE = {
  insights: 'insightsEmptyTitle',
  summary: 'summaryEmptyTitle',
  translation: 'translationEmptyTitle',
  tts: 'ttsEmptyTitle',
} as const

const EMPTY_BODY = {
  insights: 'insightsEmptyBody',
  summary: 'summaryEmptyBody',
  translation: 'translationEmptyBody',
  tts: 'ttsEmptyBody',
} as const

const EDIT_LABEL = {
  insights: 'editInsights',
  summary: 'editSummary',
  translation: 'editTranslation',
  tts: 'retryTts',
} as const

const MAX_SEGMENTED_LANGS = 7

const styles = createStaticStyles(({ css, cssVar }) => ({
  langBar: css`
    display: flex;
    flex: none;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    padding-block: 8px;
    padding-inline: 24px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
  `,
}))

function isLive(status: string) {
  return status === 'pending' || status === 'running'
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { format } = useI18n()
  const copy = useAiCopy()
  const ctx = useArticleGroupedRouteContext<unknown>()
  const { config } = ctx
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const requestedLang = searchParams.get('lang')
  const requestedItem = searchParams.get('item')

  const detailQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => config.getItemsByRef(id!),
    queryKey: adminQueryKeys.ai.groupedByRef({
      group: config.groupedQueryKey,
      id: id ?? '',
    }),
  })

  const overviewQuery = useQuery({
    enabled: Boolean(id),
    queryFn: () => getArticleOverview(id!),
    queryKey: adminQueryKeys.ai.overviewArticle(id ?? ''),
    refetchInterval: (query) =>
      query.state.data?.activeTasks.some((task) => isLive(task.status))
        ? 2000
        : false,
    refetchIntervalInBackground: true,
  })

  const items = detailQuery.data?.items ?? []
  const title =
    detailQuery.data?.article?.document.title ??
    overviewQuery.data?.article.title ??
    ''
  useDocumentTitle(title || undefined)

  const selected = useMemo(() => {
    if (!items.length) return null
    const byId = requestedItem
      ? items.find((item) => config.getId(item) === requestedItem)
      : undefined
    const byLang = requestedLang
      ? items.find((item) => config.getLang(item) === requestedLang)
      : undefined
    return byId ?? byLang ?? items[0]
  }, [config, items, requestedItem, requestedLang])

  const product = config.product
  const lang = selected ? config.getLang(selected) : ''
  const tasks = (overviewQuery.data?.activeTasks ?? []).filter(
    (task) => task.capability === product,
  )
  const coversLang = (langs: string[]) =>
    langs.length === 0 || !lang || langs.includes(lang)
  const live = tasks.find(
    (task) => isLive(task.status) && coversLang(task.langs),
  )
  const failed = tasks.find(
    (task) => !isLive(task.status) && task.error && coversLang(task.langs),
  )
  const lockedLangs = items
    .filter(isLockedItem)
    .map((item) => config.getLang(item))
  const stale = Boolean(
    selected &&
    overviewQuery.data?.assets[product].find(
      (asset) => asset.id === config.getId(selected),
    )?.stale,
  )

  const invalidate = async () => {
    await ctx.invalidate()
    if (id) {
      await queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.overviewArticle(id),
      })
    }
  }

  const actions = useArtefactActions(config, invalidate)

  const updateMutation = useMutation({
    mutationFn: (next: unknown) => config.updateItem(config.getId(next), next),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, copy('saveFailed'))),
    onSuccess: async () => {
      toast.success(copy('saved'))
      setEditing(false)
      await invalidate()
    },
  })

  const selectItem = (itemId: string) => {
    setEditing(false)
    const next = new URLSearchParams(searchParams)
    next.set('item', itemId)
    next.delete('lang')
    setSearchParams(next, { replace: true })
  }

  if (!id) return null

  if (detailQuery.isLoading && !detailQuery.data) {
    return (
      <DetailDrawer onClose={ctx.onBack} title={copy('loadingPost')}>
        <DetailPane hideHeader>
          <Flexbox aria-busy gap={16}>
            <Skeleton height={20} width="48%" />
            <Skeleton height={12} width="32%" />
            <Skeleton.Text
              rows={6}
              width={['100%', '96%', '88%', '92%', '70%', '40%']}
            />
          </Flexbox>
        </DetailPane>
      </DetailDrawer>
    )
  }

  if (detailQuery.isError) {
    return (
      <DetailDrawer onClose={ctx.onBack} title={copy('post')}>
        <DetailPane hideHeader>
          <Empty
            action={
              <Button onClick={() => void detailQuery.refetch()}>
                {copy('retryLoad')}
              </Button>
            }
            description={copy('itemFailedBody')}
            title={copy('itemFailedTitle')}
          />
        </DetailPane>
      </DetailDrawer>
    )
  }

  const incomplete =
    product === 'tts' &&
    selected &&
    isTtsNarrationIncomplete(selected as { blockOrder: string[] })
  const primary = resolvePrimary({
    editing,
    failed: Boolean(failed),
    hasItem: Boolean(selected),
    incomplete: Boolean(incomplete),
    live: Boolean(live),
    product,
  })
  const extra = selected ? (config.extraItemActions?.(selected) ?? []) : []
  const lockToggle = extra.find((action) => action.id === 'toggle-lock')
  const resume = extra.find((action) => action.id === 'resume')

  const runPrimary = () => {
    if (!selected || primary === 'generate')
      void actions.generate(id, lockedLangs)
    else if (primary === 'edit') setEditing(true)
    else if (primary === 'resume' && resume) actions.run(resume, selected)
    else void actions.regenerate(selected, id, lockedLangs)
  }

  const moreItems = (): ContextMenuItem[] => {
    if (!selected) return []
    return [
      ...(product === 'tts'
        ? []
        : [
            {
              icon: Plus,
              key: 'generate',
              label: copy(GENERATE_LABEL[product]),
              onClick: () => void actions.generate(id, lockedLangs),
            },
          ]),
      ...extra
        .filter((action) => !PRIMARY_ACTION_IDS.includes(action.id))
        .map((action) => ({
          icon: action.icon,
          key: action.id,
          label: action.label,
          onClick: () => actions.run(action, selected),
        })),
      { key: 'divider', type: 'divider' as const },
      {
        danger: true,
        icon: Trash2,
        key: 'delete',
        label: copy('delete'),
        onClick: () => actions.remove(selected),
      },
    ]
  }

  const statusTag = live ? (
    <Tag color="processing">{copy('generating')}</Tag>
  ) : failed ? (
    <Tag color="error">{copy('failed')}</Tag>
  ) : !selected ? (
    <Tag color="warning">{copy('missing')}</Tag>
  ) : incomplete ? (
    <Tag color="warning">{copy('incomplete')}</Tag>
  ) : stale ? (
    <Tag color="warning">{copy('stale')}</Tag>
  ) : isLockedItem(selected) ? (
    <Tag color="gold">{copy('locked')}</Tag>
  ) : null

  const createdAt = selected ? config.getCreatedAt(selected) : ''

  const operations =
    editing || (!primary && !selected) ? undefined : (
      <Flexbox gap={8} horizontal justify="flex-end">
        {primary ? (
          <Button loading={actions.busy} onClick={runPrimary} type="primary">
            {primary === 'generate'
              ? copy(GENERATE_LABEL[product])
              : primary === 'retry'
                ? copy('retry')
                : primary === 'resume'
                  ? copy('resumeTts')
                  : copy(EDIT_LABEL[product])}
          </Button>
        ) : null}
        {selected && primary !== 'retry' ? (
          <Button
            icon={RefreshCw}
            loading={actions.busy}
            onClick={() => void actions.regenerate(selected, id, lockedLangs)}
          >
            {copy('regenerate')}
          </Button>
        ) : null}
        {lockToggle && selected ? (
          <ActionIcon
            aria-label={lockToggle.label}
            disabled={actions.extraPending}
            icon={isLockedItem(selected) ? LockOpen : Lock}
            onClick={() => actions.run(lockToggle, selected)}
            title={lockToggle.label}
          />
        ) : null}
        {selected ? (
          <DropdownMenu items={moreItems}>
            <ActionIcon
              aria-label={copy('more')}
              icon={Ellipsis}
              title={copy('more')}
            />
          </DropdownMenu>
        ) : null}
      </Flexbox>
    )

  return (
    <DetailDrawer
      footer={operations}
      onClose={ctx.onBack}
      title={
        <Flexbox align="center" gap={8} horizontal style={{ minWidth: 0 }}>
          <span
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title || copy('post')}
          </span>
          {statusTag}
        </Flexbox>
      }
    >
      <DetailPane
        contentWidth="narrow"
        hideHeader
        tabs={
          items.length > 1 ? (
            <div className={styles.langBar}>
              {items.length > MAX_SEGMENTED_LANGS ? (
                <Select
                  aria-label={copy('langLabel')}
                  onChange={(value) => {
                    if (typeof value === 'string') selectItem(value)
                  }}
                  options={items.map((item, index) => ({
                    label: langOptionLabel(items, item, index, config.getLang),
                    value: config.getId(item),
                  }))}
                  popupMatchSelectWidth={false}
                  value={selected ? config.getId(selected) : undefined}
                />
              ) : (
                <Segmented
                  aria-label={copy('langLabel')}
                  onChange={(value) => selectItem(String(value))}
                  options={items.map((item, index) => ({
                    label: langOptionLabel(items, item, index, config.getLang),
                    value: config.getId(item),
                  }))}
                  size="small"
                  value={selected ? config.getId(selected) : undefined}
                />
              )}
            </div>
          ) : undefined
        }
      >
        <Flexbox gap={16}>
          <span>
            {copy(KIND_KEY[product])}
            {createdAt ? ` · ${format.relativeTime(createdAt)}` : ''}
            {product === 'translation' && selected
              ? ` · ${copy('translationPair', {
                  from: (selected as AITranslation).sourceLang,
                  to: lang,
                })}`
              : ''}
          </span>
          {live ? (
            <Alert
              description={live.progressMessage || undefined}
              title={copy('generatingLine', {
                kind: copy(KIND_KEY[product]),
                langs: live.langs.length ? ` · ${live.langs.join('、')}` : '',
              })}
              type="info"
            />
          ) : null}
          {failed?.error ? (
            <Alert
              description={failed.error}
              title={copy('failed')}
              type="error"
            />
          ) : null}
          {incomplete ? (
            <Alert title={copy('ttsIncomplete')} type="warning" />
          ) : null}
          {selected ? (
            <SelectedBody
              editing={editing}
              item={selected}
              key={config.getId(selected)}
              onCancel={() => setEditing(false)}
              onSubmit={async (next) => {
                await updateMutation.mutateAsync(next)
              }}
              playPrimary={primary == null}
              product={product}
              submitting={updateMutation.isPending}
            />
          ) : (
            <Empty
              description={copy(EMPTY_BODY[product])}
              title={copy(EMPTY_TITLE[product])}
            />
          )}
        </Flexbox>
      </DetailPane>
    </DetailDrawer>
  )
}

function langOptionLabel<TItem>(
  items: TItem[],
  item: TItem,
  index: number,
  getLang: (item: TItem) => string,
) {
  const itemLang = getLang(item)
  const duplicated =
    items.filter((candidate) => getLang(candidate) === itemLang).length > 1
  return duplicated ? `${itemLang} ${index + 1}` : itemLang
}

function resolvePrimary(input: {
  editing: boolean
  failed: boolean
  hasItem: boolean
  incomplete: boolean
  live: boolean
  product: AiProduct
}) {
  if (input.editing || input.live) return null
  if (!input.hasItem) return 'generate' as const
  if (input.failed) return 'retry' as const
  if (input.incomplete) return 'resume' as const
  if (input.product === 'tts') return null
  return 'edit' as const
}

function SelectedBody(props: {
  editing: boolean
  item: unknown
  onCancel: () => void
  onSubmit: (next: unknown) => Promise<void>
  playPrimary?: boolean
  product: AiProduct
  submitting: boolean
}) {
  if (props.product === 'translation') {
    return (
      <TranslationBody
        editing={props.editing}
        item={props.item as AITranslation}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        submitting={props.submitting}
      />
    )
  }
  if (props.product === 'summary') {
    return (
      <SummaryBody
        editing={props.editing}
        item={props.item as AISummary}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        submitting={props.submitting}
      />
    )
  }
  if (props.product === 'insights') {
    return (
      <InsightsBody
        editing={props.editing}
        item={props.item as AIInsights}
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        submitting={props.submitting}
      />
    )
  }
  return (
    <TtsListenBody
      item={props.item as AITtsRow}
      playPrimary={props.playPrimary}
    />
  )
}
