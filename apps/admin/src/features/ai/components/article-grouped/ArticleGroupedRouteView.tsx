import {
  ActionIcon,
  Alert,
  type ContextMenuItem,
  cx,
  DropdownMenu,
  Empty,
  Pagination,
  SearchBar,
  showContextMenu,
  Tag,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Ellipsis, Eye, RefreshCw, Trash2, WandSparkles } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useOutlet,
  useSearchParams,
} from 'react-router'

import type { ArticleInfo } from '~/api/ai'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { emptyOr } from '~/ui/placeholders'
import {
  EXPAND_COLUMN_WIDTH,
  pinEnd,
  pinStart,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { groupedPageSize } from '../../constants'
import { useAiCopy } from '../../copy'
import { AiHubPage } from '../../hub/AiHubPage'
import { hubStyles } from '../../hub/styles'
import { CAPABILITY_PATH } from '../../overview/capability-label'
import { productDraftPath } from '../../product-draft-path'
import { ArticleGroupedRouteContext } from './article-grouped-route-context'
import type { ArticleGroupedConfig, ItemStatus } from './types'
import {
  GENERATE_LABEL,
  isLockedItem,
  useArtefactActions,
} from './use-artefact-actions'

const SEARCH_DEBOUNCE_MS = 300

const MISSING_LABEL = {
  insights: 'insightsEmptyTitle',
  summary: 'summaryEmptyTitle',
  translation: 'translationEmptyTitle',
  tts: 'ttsEmptyTitle',
} as const

interface ArtefactRow<TItem> {
  article: ArticleInfo
  children?: ArtefactRow<TItem>[]
  item: TItem | null
  key: string
  lockedLangs: string[]
  nested?: boolean
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a,button,input,label,[role="menuitem"],[data-row-actions]',
      ),
    )
  )
}

function statusTag(status: ItemStatus) {
  const tag = <Tag color={status.color}>{status.label}</Tag>
  if (!status.hint) return tag
  return (
    <Tooltip title={status.hint}>
      <span>{tag}</span>
    </Tooltip>
  )
}

export function ArticleGroupedRouteView<TItem>(props: {
  config: ArticleGroupedConfig<TItem>
}) {
  const { config } = props
  const copy = useAiCopy()
  const table = useRecordTable()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const outlet = useOutlet()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const basePath = CAPABILITY_PATH[config.product]
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [draft, setDraft] = useState(q)
  const [pageActionPending, setPageActionPending] = useState(false)

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    if (draft.trim() === q) return
    const timer = window.setTimeout(() => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (draft.trim()) next.set('q', draft.trim())
          else next.delete('q')
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, q, setSearchParams])

  const setPage = (next: number) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        if (next > 1) params.set('page', String(next))
        else params.delete('page')
        return params
      },
      { replace: true },
    )

  const listQuery = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () =>
      config.getGroupedPage({
        page,
        search: q || undefined,
        size: groupedPageSize,
      }),
    queryKey: [
      ...adminQueryKeys.ai.grouped({
        group: config.groupedQueryKey,
        search: q,
      }),
      page,
    ],
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.groupedRoot(config.groupedQueryKey),
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.ai.overviewRoot,
      }),
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.tasks.tasksRoot,
      }),
    ])
  }

  const actions = useArtefactActions(config, invalidate)

  const rows = useMemo<ArtefactRow<TItem>[]>(
    () =>
      (listQuery.data?.data ?? []).flatMap((group): ArtefactRow<TItem>[] => {
        const lockedLangs = group.items.filter(isLockedItem).map(config.getLang)
        if (!group.items.length) {
          return [
            {
              article: group.article,
              item: null,
              key: `missing:${group.article.id}`,
              lockedLangs,
            },
          ]
        }
        const itemRows = group.items.map((item) => ({
          article: group.article,
          item,
          key: config.getId(item),
          lockedLangs,
          nested: group.items.length > 1,
        }))
        if (itemRows.length === 1) return itemRows
        return [
          {
            article: group.article,
            children: itemRows,
            item: group.items[0],
            key: `post:${group.article.id}`,
            lockedLangs,
          },
        ]
      }),
    [config, listQuery.data],
  )

  const total = listQuery.data?.pagination.total
  const search = location.search

  const openDraft = (draftId: string) => navigate(productDraftPath(draftId))

  const openRow = (row: ArtefactRow<TItem>) => {
    if (row.article.draftId) {
      openDraft(row.article.draftId)
      return
    }
    const params = new URLSearchParams(search)
    if (row.item) params.set('item', config.getId(row.item))
    else params.delete('item')
    navigate({
      pathname: `${basePath}/${row.article.id}`,
      search: `?${params.toString()}`,
    })
  }

  const menuItems = (
    row: ArtefactRow<TItem>,
    inline = false,
  ): ContextMenuItem[] => {
    const { item } = row
    if (!item) {
      if (row.article.draftId) {
        return [
          {
            key: 'edit',
            label: copy('editPost'),
            onClick: () => openDraft(row.article.draftId ?? ''),
          },
        ]
      }
      return [
        {
          icon: WandSparkles,
          key: 'generate',
          label: copy(GENERATE_LABEL[config.product]),
          onClick: () => void actions.generate(row.article.id, row.lockedLangs),
        },
      ]
    }
    const extra = config.extraItemActions?.(item) ?? []
    return [
      ...(inline
        ? []
        : [
            {
              icon: Eye,
              key: 'view',
              label: copy('view'),
              onClick: () => openRow(row),
            },
            {
              icon: RefreshCw,
              key: 'regenerate',
              label: copy('regenerate'),
              onClick: () =>
                void actions.regenerate(item, row.article.id, row.lockedLangs),
            },
          ]),
      ...extra
        .filter((action) => !['regenerate', 'retranslate'].includes(action.id))
        .map((action) => ({
          icon: action.icon,
          key: action.id,
          label: action.label,
          onClick: () => actions.run(action, item),
        })),
      { key: 'divider', type: 'divider' as const },
      {
        danger: true,
        icon: Trash2,
        key: 'delete',
        label: copy('delete'),
        onClick: () => actions.remove(item),
      },
    ]
  }

  const columns: ProColumns<ArtefactRow<TItem>>[] = [
    {
      key: 'post',
      render: (_dom, row) => {
        const preview = row.item
          ? emptyOr(config.getPreview(row.item))
          : copy(MISSING_LABEL[config.product])
        if (row.nested) {
          return <span className={hubStyles.childPreview}>{preview}</span>
        }
        return (
          <div className={hubStyles.titleCell}>
            <span className={hubStyles.titleText} title={row.article.title}>
              {row.article.title || copy('untitled')}
            </span>
            {row.children ? null : (
              <span className={hubStyles.preview}>{preview}</span>
            )}
          </div>
        )
      },
      title: copy('columnPost'),
      ...pinStart(table.pin),
    },
    {
      key: 'lang',
      render: (_dom, row) => {
        if (row.children) {
          return (
            <span className={hubStyles.time}>
              {copy('langCount', { count: row.children.length })}
            </span>
          )
        }
        return row.item ? (
          <Tag>{config.getLang(row.item)}</Tag>
        ) : (
          <span>{emptyOr(null)}</span>
        )
      },
      responsive: ['md'],
      title: copy('langLabel'),
      width: 112,
    },
    {
      key: 'status',
      render: (_dom, row) => {
        if (!row.item) return <Tag color="warning">{copy('missing')}</Tag>
        if (row.children) {
          const statuses = row.children.flatMap((child) =>
            child.item ? [config.getStatus?.(child.item) ?? null] : [],
          )
          const flagged = statuses.filter((status) => status !== null)
          if (!flagged.length) return <Tag color="success">{copy('ready')}</Tag>
          const first = flagged[0]
          const same = flagged.filter(
            (status) => status.label === first.label,
          ).length
          return statusTag({
            ...first,
            label:
              same === statuses.length
                ? first.label
                : `${first.label} ${same}/${statuses.length}`,
          })
        }
        const status = config.getStatus?.(row.item)
        return status ? (
          statusTag(status)
        ) : (
          <Tag color="success">{copy('ready')}</Tag>
        )
      },
      responsive: ['md'],
      title: copy('columnStatus'),
      width: 128,
    },
    {
      key: 'updated',
      render: (_dom, row) => {
        const value = row.children
          ? (row.children
              .map((child) =>
                child.item ? config.getCreatedAt(child.item) : '',
              )
              .sort()
              .at(-1) ?? '')
          : row.item
            ? config.getCreatedAt(row.item)
            : ''
        if (!value) return emptyOr(null)
        return (
          <Tooltip title={format.dateTime(value)}>
            <span className={hubStyles.time}>{format.relativeTime(value)}</span>
          </Tooltip>
        )
      },
      responsive: ['md'],
      title: copy('columnUpdated'),
      width: 128,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, row) => {
        const { item } = row
        if (!item) {
          const draftId = row.article.draftId
          return (
            <div className={hubStyles.rowActions} data-row-actions="">
              <ActionIcon
                aria-label={
                  draftId
                    ? copy('editPost')
                    : copy(GENERATE_LABEL[config.product])
                }
                icon={draftId ? Eye : WandSparkles}
                onClick={() =>
                  draftId
                    ? openDraft(draftId)
                    : void actions.generate(row.article.id, row.lockedLangs)
                }
                size="small"
                title={
                  draftId
                    ? copy('editPost')
                    : copy(GENERATE_LABEL[config.product])
                }
              />
            </div>
          )
        }
        return (
          <div className={hubStyles.rowActions} data-row-actions="">
            <ActionIcon
              aria-label={copy('view')}
              icon={Eye}
              onClick={() => openRow(row)}
              size="small"
              title={copy('view')}
            />
            <ActionIcon
              aria-label={copy('regenerate')}
              icon={RefreshCw}
              onClick={() =>
                void actions.regenerate(item, row.article.id, row.lockedLangs)
              }
              size="small"
              title={copy('regenerate')}
            />
            <DropdownMenu items={() => menuItems(row, true)}>
              <ActionIcon
                aria-label={copy('more')}
                icon={Ellipsis}
                size="small"
                title={copy('more')}
              />
            </DropdownMenu>
          </div>
        )
      },
      title: '',
      width: 128,
      ...pinEnd(table.pin),
    },
  ]

  let emptyNode: ReactNode
  if (listQuery.isError && !rows.length) {
    emptyNode = (
      <Empty
        action={
          <Button onClick={() => void listQuery.refetch()}>
            {copy('retryLoad')}
          </Button>
        }
        description={copy('listFailedBody')}
        title={copy('listFailedTitle')}
      />
    )
  } else if (q) {
    emptyNode = (
      <Empty
        action={
          <Button onClick={() => setDraft('')}>{copy('clearSearch')}</Button>
        }
        description={copy('filterEmptyBody')}
        title={copy('filterEmptyTitle')}
      />
    )
  } else {
    emptyNode = (
      <Empty
        description={copy('emptyPostsBody')}
        title={copy('emptyPostsTitle')}
      />
    )
  }

  const initialLoading = listQuery.isLoading && !listQuery.data
  const pageAction = config.pageAction
  const routeContext = {
    basePath,
    config: config as ArticleGroupedConfig<unknown>,
    invalidate,
  }

  if (outlet) {
    return (
      <ArticleGroupedRouteContext.Provider value={routeContext}>
        {outlet}
      </ArticleGroupedRouteContext.Provider>
    )
  }

  return (
    <ArticleGroupedRouteContext.Provider value={routeContext}>
      <AiHubPage
        actions={
          pageAction ? (
            <Button
              icon={pageAction.icon}
              loading={pageActionPending}
              onClick={async () => {
                setPageActionPending(true)
                try {
                  await pageAction.run({ invalidate })
                } finally {
                  setPageActionPending(false)
                }
              }}
            >
              {pageAction.label}
            </Button>
          ) : undefined
        }
        count={total}
      >
        {listQuery.isError && rows.length ? (
          <Alert
            action={
              <Button onClick={() => void listQuery.refetch()}>
                {copy('retryLoad')}
              </Button>
            }
            title={copy('listStale')}
            type="warning"
          />
        ) : null}
        <ProTable<ArtefactRow<TItem>>
          className={recordTableStyles.root}
          columnEmptyText={copy('emptyValue')}
          columns={columns}
          scroll={recordTableScroll(columns, table, EXPAND_COLUMN_WIDTH)}
          tableLayout="fixed"
          dataSource={rows}
          loading={listQuery.isFetching && listQuery.isPlaceholderData}
          locale={{ emptyText: emptyNode }}
          onRow={(row) =>
            ({
              'data-id': row.key,
              'data-scope-item': 'row',
              onClick: (event) => {
                if (isInteractiveTarget(event.target)) return
                if (row.article.draftId) openDraft(row.article.draftId)
                else if (row.item) openRow(row)
                else void actions.generate(row.article.id, row.lockedLangs)
              },
              onContextMenu: (event) => {
                event.preventDefault()
                showContextMenu(menuItems(row))
              },
            }) as HTMLAttributes<HTMLElement>
          }
          options={{
            density: false,
            fullScreen: false,
            reload: () => void listQuery.refetch(),
            search: false,
            setting: false,
          }}
          pagination={false}
          expandable={{
            columnWidth: EXPAND_COLUMN_WIDTH,
            expandRowByClick: false,
            indentSize: 0,
          }}
          rowClassName={(row) =>
            cx(hubStyles.row, row.nested && hubStyles.childRow)
          }
          rowKey="key"
          search={false}
          tableRender={(_props, dom) =>
            initialLoading ? <TableSkeleton rows={8} /> : dom
          }
          toolBarRender={() => [
            <div className={hubStyles.filters} key="filters">
              <SearchBar
                allowClear
                aria-label={copy('searchPosts')}
                className={hubStyles.search}
                enableShortKey={false}
                onInputChange={setDraft}
                placeholder={copy('searchPosts')}
                value={draft}
              />
            </div>,
          ]}
          variant="outlined"
        />
        {total && total > groupedPageSize ? (
          <Pagination
            align="end"
            current={page}
            hideOnSinglePage
            onChange={setPage}
            pageSize={groupedPageSize}
            showSizeChanger={false}
            showTotal={(count) => copy('totalPosts', { count })}
            total={total}
          />
        ) : null}
      </AiHubPage>
    </ArticleGroupedRouteContext.Provider>
  )
}
