import {
  ActionIcon,
  Alert,
  DropdownMenu,
  Empty,
  SearchBar,
  Segmented,
  Select,
  showContextMenu,
  Text,
} from '@lobehub/ui'
import { MetricStrip, TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useQueryClient } from '@tanstack/react-query'
import { Ellipsis, Eye, WandSparkles, X } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutlet, useSearchParams } from 'react-router'

import type { AiOverviewCapability } from '~/api/ai-overview'
import { AI_OVERVIEW_CAPABILITIES } from '~/api/ai-overview'
import { adminQueryKeys } from '~/query/keys'
import {
  alphaFirst,
  type HeaderSortOrder,
  newestFirst,
  orderedBy,
} from '~/ui/data/table-header'
import {
  pinEnd,
  pinStart,
  recordTableScroll,
  recordTableStyles,
  SELECTION_COLUMN_WIDTH,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { useAiCopy } from '../copy'
import { useAiQuickActionsBuilder } from '../hooks/use-ai-quick-actions'
import { AiHubPage } from '../hub/AiHubPage'
import { hubStyles } from '../hub/styles'
import { productDraftPath } from '../product-draft-path'
import { CAPABILITY_LABEL } from './capability-label'
import type { MatrixRow } from './coverage'
import {
  compareMatrixRows,
  countGaps,
  hasGap,
  MATRIX_CAPABILITIES,
} from './coverage'
import { CapabilityCell } from './CoverageCells'
import { FillGapsModal } from './FillGapsModal'
import { useCoverageData } from './use-coverage-data'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

function parseCapability(raw: string | null): AiOverviewCapability | undefined {
  return AI_OVERVIEW_CAPABILITIES.find((capability) => capability === raw)
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

export function CoverageMatrixRouteView() {
  const copy = useAiCopy()
  const table = useRecordTable()
  const navigate = useNavigate()
  const outlet = useOutlet()
  const queryClient = useQueryClient()
  const buildAiItems = useAiQuickActionsBuilder()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const gapsOnly = searchParams.get('gaps') === '1'
  const capability = parseCapability(searchParams.get('capability'))
  const [draft, setDraft] = useState(q)
  const [page, setPage] = useState(1)
  const [headerSort, setHeaderSort] = useState<{
    key: string
    order: HeaderSortOrder
  } | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [fill, setFill] = useState<{
    clearSelection: boolean
    rows: MatrixRow[]
  } | null>(null)
  const { listQuery, rows } = useCoverageData()

  useEffect(() => {
    setDraft(q)
  }, [q])

  useEffect(() => {
    if (draft.trim() === q) return
    const timer = window.setTimeout(() => {
      updateParams({ q: draft.trim() || null })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, q])

  useEffect(() => {
    setPage(1)
  }, [q, gapsOnly, capability])

  function updateParams(next: Record<string, string | null>) {
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current)
        for (const [key, value] of Object.entries(next)) {
          if (value) params.set(key, value)
          else params.delete(key)
        }
        return params
      },
      { replace: true },
    )
  }

  const keyword = q.toLowerCase()
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!keyword || row.article.title.toLowerCase().includes(keyword)) &&
          (!gapsOnly || hasGap(row, capability)),
      ),
    [capability, gapsOnly, keyword, rows],
  )
  const counts = useMemo(() => countGaps(rows), [rows])
  const activeSort =
    !headerSort ||
    headerSort.key === 'post' ||
    !capability ||
    headerSort.key === capability
      ? headerSort
      : null
  const sorted = useMemo(
    () =>
      activeSort
        ? orderedBy(filtered, activeSort.order, (left, right) =>
            compareMatrixRows(left, right, activeSort.key),
          )
        : filtered,
    [activeSort, filtered],
  )
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const fillableRows = filtered.filter(
    (row) => hasGap(row, capability) && !row.article.draftId,
  )
  const selectedRows = rows.filter((row) =>
    selectedIds.includes(row.article.id),
  )
  const visibleCapabilities = capability ? [capability] : MATRIX_CAPABILITIES
  const search = searchParams.toString()

  const openPost = (article: MatrixRow['article']) => {
    if (article.draftId) {
      navigate(productDraftPath(article.draftId))
      return
    }
    navigate({
      pathname: `/ai/overview/${article.id}`,
      search: search ? `?${search}` : '',
    })
  }

  const refresh = () =>
    void queryClient.invalidateQueries({
      queryKey: adminQueryKeys.ai.overviewRoot,
    })

  const capabilityColumn = (
    key: AiOverviewCapability,
  ): ProColumns<MatrixRow> => ({
    key,
    render: (_dom, row) => (
      <CapabilityCell
        showProgress={key === 'translation'}
        summary={row.capabilities[key]}
      />
    ),
    responsive: key === 'translation' ? ['md'] : ['lg'],
    sortDirections: newestFirst,
    sortOrder: activeSort?.key === key ? activeSort.order : null,
    sorter: true,
    title: (
      <span className={hubStyles.headerTitle}>
        {copy(CAPABILITY_LABEL[key])}
      </span>
    ),
    width: 168,
  })

  const columns: ProColumns<MatrixRow>[] = [
    {
      key: 'post',
      render: (_dom, row) => (
        <div className={hubStyles.titleCell}>
          <span className={hubStyles.titleText} title={row.article.title}>
            {row.article.title || copy('untitled')}
          </span>
          <span className={hubStyles.subline}>
            {row.coverage.sourceLang
              ? copy('sourceLang', { lang: row.coverage.sourceLang })
              : copy('sourceUnknown')}
          </span>
        </div>
      ),
      sortDirections: alphaFirst,
      sortOrder: activeSort?.key === 'post' ? activeSort.order : null,
      sorter: true,
      title: copy('columnPost'),
      ...pinStart(table.pin),
    },
    ...visibleCapabilities.map(capabilityColumn),
    {
      align: 'right',
      key: 'actions',
      render: (_dom, row) => (
        <div className={hubStyles.rowActions} data-row-actions="">
          {hasGap(row) && !row.article.draftId ? (
            <ActionIcon
              aria-label={copy('fillGaps')}
              icon={WandSparkles}
              onClick={() => setFill({ clearSelection: false, rows: [row] })}
              size="small"
              title={copy('fillGaps')}
            />
          ) : null}
          <ActionIcon
            aria-label={
              row.article.draftId ? copy('editPost') : copy('openPostOverview')
            }
            icon={Eye}
            onClick={() => openPost(row.article)}
            size="small"
            title={
              row.article.draftId ? copy('editPost') : copy('openPostOverview')
            }
          />
          {row.article.draftId ? null : (
            <DropdownMenu items={() => buildAiItems(row.article.id)}>
              <ActionIcon
                aria-label={copy('more')}
                icon={Ellipsis}
                size="small"
                title={copy('more')}
              />
            </DropdownMenu>
          )}
        </div>
      ),
      title: '',
      width: 128,
      ...pinEnd(table.pin),
    },
  ]

  const clearFilters = () => {
    setDraft('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

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
  } else if (!rows.length) {
    emptyNode = (
      <Empty
        description={copy('emptyPostsBody')}
        title={copy('emptyPostsTitle')}
      />
    )
  } else if (gapsOnly && !keyword) {
    emptyNode = (
      <Empty
        action={<Button onClick={clearFilters}>{copy('showAllPosts')}</Button>}
        description={copy('noGapsBody')}
        title={copy('noGapsTitle')}
      />
    )
  } else {
    emptyNode = (
      <Empty
        action={<Button onClick={clearFilters}>{copy('clearFilters')}</Button>}
        description={copy('filterEmptyBody')}
        title={copy('filterEmptyTitle')}
      />
    )
  }

  const initialLoading = listQuery.isLoading && !rows.length

  if (outlet) return outlet

  return (
    <AiHubPage
      actions={
        <Button
          disabled={!fillableRows.length}
          icon={WandSparkles}
          onClick={() => setFill({ clearSelection: false, rows: fillableRows })}
          type="primary"
        >
          {copy('fillAll')}
        </Button>
      }
      count={rows.length || undefined}
    >
      <MetricStrip
        items={MATRIX_CAPABILITIES.map((key) => ({
          hint: counts.byCapability[key].items
            ? copy('metricItems', { count: counts.byCapability[key].items })
            : rows.length &&
                rows.every((row) =>
                  ['na', 'none'].includes(row.capabilities[key].state),
                )
              ? copy('stateNone')
              : copy('stateDone'),
          label: copy('metricCapabilityGaps', {
            capability: copy(CAPABILITY_LABEL[key]),
          }),
          onClick: () => updateParams({ capability: key, gaps: '1' }),
          value: counts.byCapability[key].posts,
        }))}
        loading={initialLoading}
      />
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
      <ProTable<MatrixRow>
        className={recordTableStyles.root}
        columnEmptyText={copy('emptyValue')}
        columns={columns}
        scroll={recordTableScroll(columns, table, SELECTION_COLUMN_WIDTH)}
        dataSource={pageRows}
        onChange={(_pagination, _filters, sorter, extra) => {
          if (extra.action !== 'sort') return
          const info = Array.isArray(sorter) ? sorter[0] : sorter
          const key = info?.columnKey == null ? '' : String(info.columnKey)
          const visible =
            key === 'post' ||
            visibleCapabilities.includes(key as AiOverviewCapability)
          if (!info?.order || !visible) {
            setHeaderSort(null)
          } else {
            setHeaderSort({ key, order: info.order })
          }
          setPage(1)
        }}
        locale={{ emptyText: emptyNode }}
        onRow={(row) =>
          ({
            'data-id': row.article.id,
            'data-scope-item': 'row',
            onClick: (event) => {
              if (isInteractiveTarget(event.target)) return
              openPost(row.article)
            },
            onContextMenu: (event) => {
              event.preventDefault()
              if (!row.article.draftId) {
                showContextMenu(buildAiItems(row.article.id))
              }
            },
          }) as HTMLAttributes<HTMLElement>
        }
        options={{
          density: false,
          fullScreen: false,
          reload: refresh,
          search: false,
          setting: false,
        }}
        pagination={{
          current: page,
          hideOnSinglePage: true,
          onChange: setPage,
          pageSize: PAGE_SIZE,
          showSizeChanger: false,
          total: filtered.length,
        }}
        rowClassName={() => hubStyles.row}
        rowKey={(row) => row.article.id}
        rowSelection={{
          columnWidth: SELECTION_COLUMN_WIDTH,
          onChange: (keys) => {
            const pageIds = new Set(pageRows.map((row) => row.article.id))
            const kept = selectedIds.filter((id) => !pageIds.has(id))
            setSelectedIds([
              ...kept,
              ...keys.map(String).filter((id) => pageIds.has(id)),
            ])
          },
          selectedRowKeys: selectedIds,
        }}
        search={false}
        tableLayout="fixed"
        tableAlertOptionRender={() => (
          <div className={hubStyles.selectionBar}>
            <Button
              icon={WandSparkles}
              onClick={() =>
                setFill({
                  clearSelection: true,
                  rows: selectedRows.filter((row) => !row.article.draftId),
                })
              }
              size="small"
            >
              {copy('fillGaps')}
            </Button>
            <Button
              icon={X}
              onClick={() => setSelectedIds([])}
              size="small"
              type="text"
            >
              {copy('clearSelection')}
            </Button>
          </div>
        )}
        tableAlertRender={() => (
          <Text weight={500}>
            {copy('selectedPosts', { count: selectedIds.length })}
          </Text>
        )}
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
            <Segmented
              aria-label={copy('filterGapsLabel')}
              onChange={(value) =>
                updateParams({ gaps: value === 'gaps' ? '1' : null })
              }
              options={[
                { label: copy('filterAllPosts'), value: 'all' },
                { label: copy('filterGaps'), value: 'gaps' },
              ]}
              value={gapsOnly ? 'gaps' : 'all'}
            />
            <Select
              aria-label={copy('filterCapabilityLabel')}
              className={hubStyles.select}
              onChange={(value) =>
                updateParams({
                  capability:
                    typeof value === 'string' && value !== 'all' ? value : null,
                })
              }
              options={[
                { label: copy('capabilityAll'), value: 'all' },
                ...MATRIX_CAPABILITIES.map((key) => ({
                  label: copy(CAPABILITY_LABEL[key]),
                  value: key,
                })),
              ]}
              popupMatchSelectWidth={false}
              value={capability ?? 'all'}
            />
          </div>,
        ]}
        variant="outlined"
      />
      {fill ? (
        <FillGapsModal
          capability={capability}
          onClose={() => setFill(null)}
          onDone={() => {
            if (fill.clearSelection) setSelectedIds([])
          }}
          rows={fill.rows}
        />
      ) : null}
    </AiHubPage>
  )
}
