import {
  ActionIcon,
  Alert,
  Button,
  confirmModal,
  createStaticStyles,
  Empty,
  Flexbox,
  SearchBar,
  showContextMenu,
  Tag,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, ScanSearch, Trash2, X } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'

import type { OrphanFile } from '~/api/files'
import {
  batchDeleteOrphanFiles,
  cleanupOrphanFiles,
  reconcileFileReferences,
} from '~/api/files'
import { useI18n } from '~/i18n'
import { confirmDialog } from '~/ui/feedback/confirm'
import { FocusScope } from '~/ui/focus-scope'
import type { ListAction } from '~/ui/list-actions'
import { useListKeyboard } from '~/ui/list-actions'
import { Page } from '~/ui/page'

import {
  FILES_PAGE_SIZE,
  filesQueryKey,
  ORPHAN_CLEANUP_MAX_AGE_MINUTES,
} from '../constants'
import { useFileCopy } from '../copy'
import { useFileSearch } from '../hooks/useFileSearch'
import { useOrphanFilesList } from '../hooks/useOrphanFilesList'
import { extensionOf, pathOf } from '../utils/file-kind'
import {
  deletionCounts,
  formatBytes,
  formatUploadedAt,
  getErrorMessage,
} from '../utils/format'
import { buildFileMenuItems } from '../utils/menu'
import { copyFileLink } from './FileDetail'
import { FilesTabs } from './FilesTabs'
import { FileThumb } from './FileThumb'
import { OrphanFilesRouteContext } from './orphan-files-route-context'
import { OrphanStatusTag } from './OrphanStatusTag'
import {
  ReferenceReconcilePreview,
  runReferenceReconcileFlow,
} from './ReferenceReconcilePreview'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  actions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;

    opacity: 0;

    transition: opacity 0.12s ease;

    ${responsive.md} {
      opacity: 1;
    }
  `,
  nameCell: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  nameText: css`
    font-weight: 500;
  `,
  numeric: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;
  `,
  path: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  root: css`
    height: 100%;
    min-height: 0;
  `,
  row: css`
    cursor: pointer;

    &:hover [data-row-actions],
    &:focus-within [data-row-actions],
    &[data-cursor] [data-row-actions] {
      opacity: 1;
    }

    &[data-cursor] > td {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  rowOpen: css`
    & > td {
      background: ${cssVar.colorPrimaryBg};
    }
  `,
  search: css`
    flex: 1 1 14rem;
    min-width: 10rem;
    max-width: 24rem;
  `,
  selectionBar: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  `,
}))

const FOCUS_SCOPE_ID = 'orphan-files-list'

type DeleteInput = { all: true } | { ids: string[]; name?: string }

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

function sumBytes(items: OrphanFile[]) {
  let total = 0
  for (const item of items) {
    if (item.byteSize == null) return null
    total += item.byteSize
  }
  return total
}

export function OrphanFilesPage() {
  const copy = useFileCopy()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const openId = params.id ?? null
  const openIdRef = useRef(openId)
  openIdRef.current = openId
  const { orphans, orphansQuery, page, pageCount, setPage, total } =
    useOrphanFilesList()
  const [selectAllAcross, setSelectAllAcross] = useState(false)
  const [reconcileFlowActive, setReconcileFlowActive] = useState(false)
  const selectionClearRef = useRef<(() => void) | null>(null)

  const getName = useMemo(() => (item: OrphanFile) => item.fileName, [])
  const fileSearch = useFileSearch(orphans, getName)
  const filtered = fileSearch.items
  const firstLoad = orphansQuery.isPending && orphans.length === 0
  const failedEmpty = orphansQuery.isError && orphans.length === 0
  const showStale = orphansQuery.isError && orphans.length > 0

  const pageQuery = page > 1 ? `?page=${page}` : ''
  const closeDetail = () => navigate(`/files/orphans${pageQuery}`)
  const openItem = (item: OrphanFile) =>
    navigate(`/files/orphans/${encodeURIComponent(item.id)}${pageQuery}`)
  const copyLink = (item: OrphanFile) =>
    void copyFileLink(item.fileUrl, {
      failed: copy('copyFailed'),
      success: copy('copied'),
    })

  const deleteMutation = useMutation({
    mutationFn: (input: DeleteInput) =>
      batchDeleteOrphanFiles(
        'all' in input ? { all: true } : { ids: input.ids },
      ),
    onError: (_error: unknown, input) => {
      if (!('all' in input) && input.name && input.ids.length === 1) {
        toast.error(copy('deleteFailedNamed', { name: input.name }))
        return
      }
      const failed = 'all' in input ? total : input.ids.length
      toast.error(copy('deleteFailedBatch', { failed }))
    },
    onSuccess: async (result, input) => {
      const attempted = 'all' in input ? total : input.ids.length
      toast.success(
        copy('deleteResult', deletionCounts(attempted, result.deletedCount)),
      )
      selectionClearRef.current?.()
      setSelectAllAcross(false)
      const removedOpen =
        'all' in input ||
        (openIdRef.current != null && input.ids.includes(openIdRef.current))
      if (removedOpen) navigate(`/files/orphans${pageQuery}`)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const cleanupMutation = useMutation({
    mutationFn: () => cleanupOrphanFiles(ORPHAN_CLEANUP_MAX_AGE_MINUTES),
    onError: () => toast.error(copy('cleanupFailed')),
    onSuccess: async (result) => {
      toast.success(copy('cleanupResult', { count: result.deletedCount }))
      setPage(1)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const reconcileMutation = useMutation({
    mutationFn: (apply: boolean) => reconcileFileReferences(apply),
  })

  const runDelete = (input: DeleteInput) =>
    deleteMutation.mutateAsync(input).then(
      () => undefined,
      () => undefined,
    )

  const confirmAndDelete = (item: OrphanFile) => {
    confirmModal({
      cancelText: copy('cancel'),
      content: copy('deleteOneBody'),
      okButtonProps: { danger: true },
      okText: copy('delete'),
      onOk: () => runDelete({ ids: [item.id], name: item.fileName }),
      title: copy('deleteFileTitle', { name: item.fileName }),
    })
  }

  const sizeSuffix = (bytes: null | number) =>
    bytes == null ? '' : copy('sizeSuffix', { size: formatBytes(bytes) })

  const confirmBatchDelete = (targets: OrphanFile[]) => {
    const count = selectAllAcross ? total : targets.length
    if (count === 0) return
    const bytes = selectAllAcross
      ? pageCount === 1
        ? sumBytes(orphans)
        : null
      : sumBytes(targets)
    confirmModal({
      cancelText: copy('cancel'),
      content: copy('deleteBatchBody'),
      okButtonProps: { danger: true },
      okText: copy('deleteBatchConfirm', { count }),
      onOk: () =>
        runDelete(
          selectAllAcross
            ? { all: true }
            : { ids: targets.map((item) => item.id) },
        ),
      title: copy('deleteBatchTitle', { count, size: sizeSuffix(bytes) }),
    })
  }

  const confirmCleanup = () => {
    const cutoff = Date.now() - ORPHAN_CLEANUP_MAX_AGE_MINUTES * 60 * 1000
    const allLoaded = pageCount === 1 && !orphansQuery.isError
    const eligible = orphans.filter(
      (item) => new Date(item.createdAt).getTime() < cutoff,
    )
    const content = allLoaded
      ? copy('cleanupBodyExact', {
          kept: orphans.length - eligible.length,
          minutes: ORPHAN_CLEANUP_MAX_AGE_MINUTES,
        })
      : copy('cleanupBody', { minutes: ORPHAN_CLEANUP_MAX_AGE_MINUTES })
    const title = allLoaded
      ? copy('cleanupTitleExact', {
          count: eligible.length,
          size: sizeSuffix(sumBytes(eligible)),
        })
      : copy('cleanupTitle', { count: total })
    if (allLoaded && eligible.length === 0) {
      toast.info(
        copy('cleanupNothing', { minutes: ORPHAN_CLEANUP_MAX_AGE_MINUTES }),
      )
      return
    }
    confirmModal({
      cancelText: copy('cancel'),
      content,
      okButtonProps: { danger: true },
      okText: copy('cleanupConfirm'),
      onOk: () =>
        cleanupMutation.mutateAsync().then(
          () => undefined,
          () => undefined,
        ),
      title,
    })
  }

  const reconcileReferences = async () => {
    if (reconcileFlowActive) return
    setReconcileFlowActive(true)
    try {
      const appliedResult = await runReferenceReconcileFlow({
        confirm: (previewResult) =>
          confirmDialog({
            cancelText: copy('cancel'),
            confirmText: copy('reconcileApply'),
            description: <ReferenceReconcilePreview result={previewResult} />,
            title: copy('reconcileTitle'),
          }),
        onUpToDate: async () => {
          toast.success(copy('reconcileUpToDate'))
          setPage(1)
          await queryClient.invalidateQueries({ queryKey: filesQueryKey })
        },
        scan: async (apply) => {
          const pending = toast.loading(
            copy(apply ? 'reconcileApplying' : 'reconcileScanning'),
          )
          try {
            return await reconcileMutation.mutateAsync(apply)
          } finally {
            toast.dismiss(pending.id)
          }
        },
      })
      if (!appliedResult) return
      toast.success(
        copy('reconcileDone', {
          active: appliedResult.referencedFiles,
          isolated: appliedResult.isolatedFiles,
          usages: appliedResult.usages,
        }),
      )
      setPage(1)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    } catch (error) {
      toast.error(getErrorMessage(error, copy('reconcileFailed')))
    } finally {
      setReconcileFlowActive(false)
    }
  }

  const actions: ListAction<OrphanFile>[] = [
    {
      icon: ExternalLink,
      key: 'open',
      label: copy('openDetails'),
      run: (targets) => openItem(targets[0]),
      shortcut: 'Enter',
      shortcutLabel: '↵',
    },
    {
      icon: Copy,
      key: 'copy',
      label: copy('copyLink'),
      run: (targets) => copyLink(targets[0]),
    },
    {
      danger: true,
      icon: Trash2,
      key: 'delete',
      label: copy('deleteFile'),
      multi: true,
      run: (targets) =>
        targets.length === 1
          ? confirmAndDelete(targets[0])
          : confirmBatchDelete(targets),
      shortcut: 'Backspace',
      shortcutLabel: '⌫',
    },
  ]

  const { selection } = useListKeyboard<OrphanFile>({
    actions,
    getId: (item) => item.id,
    items: filtered,
    onBeforeSelectionReset: () => setSelectAllAcross(false),
    resetOn: [page, fileSearch.query],
    scopeId: FOCUS_SCOPE_ID,
  })
  selectionClearRef.current = selection.clear

  const selectedCount = selection.size
  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((item) => selection.isSelected(item.id))
  const maintenanceBusy =
    reconcileFlowActive || cleanupMutation.isPending || orphansQuery.isFetching

  const listStatus: 'error' | 'pending' | 'success' = orphansQuery.isError
    ? 'error'
    : orphansQuery.isPending
      ? 'pending'
      : 'success'

  const ctxValue = {
    deleteDisabled: deleteMutation.isPending,
    listStatus,
    listUpdatedAt: orphansQuery.dataUpdatedAt,
    onBack: closeDetail,
    onDelete: confirmAndDelete,
    onRetry: () => void orphansQuery.refetch(),
  }

  const columns: ProColumns<OrphanFile>[] = [
    {
      dataIndex: 'fileName',
      render: (_dom, item) => (
        <Flexbox align="center" gap={12} horizontal style={{ minWidth: 0 }}>
          <FileThumb
            mime={item.mimeType}
            name={item.fileName}
            url={item.fileUrl}
          />
          <div className={styles.nameCell}>
            <Text
              className={styles.nameText}
              ellipsis={{ tooltip: item.fileName, tooltipWhenOverflow: true }}
            >
              {item.fileName}
            </Text>
            <span className={styles.path}>{pathOf(item.fileUrl)}</span>
          </div>
        </Flexbox>
      ),
      title: copy('columnName'),
    },
    {
      dataIndex: 'status',
      render: (_dom, item) => <OrphanStatusTag file={item} />,
      responsive: ['lg'],
      title: copy('columnState'),
      width: 120,
    },
    {
      dataIndex: 'mimeType',
      render: (_dom, item) => {
        const ext = extensionOf(item.fileName)
        return ext ? <Tag>{ext.toUpperCase()}</Tag> : '--'
      },
      responsive: ['lg'],
      title: copy('fieldType'),
      width: 96,
    },
    {
      align: 'right',
      dataIndex: 'byteSize',
      render: (_dom, item) => (
        <span className={styles.numeric}>{formatBytes(item.byteSize)}</span>
      ),
      responsive: ['md'],
      title: copy('fieldSize'),
      width: 104,
    },
    {
      dataIndex: 'createdAt',
      render: (_dom, item) => (
        <Tooltip title={formatUploadedAt(item.createdAt)}>
          <span className={styles.numeric}>
            {format.relativeTime(item.createdAt)}
          </span>
        </Tooltip>
      ),
      responsive: ['md'],
      title: copy('fieldUploaded'),
      width: 128,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, item) => (
        <div className={styles.actions} data-row-actions="">
          <ActionIcon
            aria-label={copy('copyLink')}
            icon={Copy}
            onClick={() => copyLink(item)}
            size="small"
            title={copy('copyLink')}
          />
          <ActionIcon
            aria-label={copy('deleteFile')}
            icon={Trash2}
            onClick={() => confirmAndDelete(item)}
            size="small"
            title={copy('deleteFile')}
          />
        </div>
      ),
      title: '',
      width: 88,
    },
  ]

  const emptyNode: ReactNode = failedEmpty ? (
    <Empty
      action={
        <Button onClick={() => void orphansQuery.refetch()}>
          {copy('retry')}
        </Button>
      }
      description={copy('loadOrphansFailedBody')}
      title={copy('loadOrphansFailedTitle')}
    />
  ) : fileSearch.query ? (
    <Empty
      action={
        <Button onClick={() => fileSearch.setQuery('')}>
          {copy('clearSearch')}
        </Button>
      }
      description={copy('emptyOrphanSearchBody')}
      title={copy('emptySearchTitle')}
    />
  ) : (
    <Empty
      action={
        <Button
          disabled={maintenanceBusy}
          icon={ScanSearch}
          loading={reconcileFlowActive}
          onClick={() => void reconcileReferences()}
        >
          {copy('checkReferences')}
        </Button>
      }
      description={copy('emptyOrphansBody')}
      title={copy('emptyOrphansTitle')}
    />
  )

  return (
    <OrphanFilesRouteContext.Provider value={ctxValue}>
      <FocusScope className={styles.root} id={FOCUS_SCOPE_ID}>
        <Page
          actions={
            <>
              <Button
                disabled={maintenanceBusy}
                icon={ScanSearch}
                loading={reconcileFlowActive}
                onClick={() => void reconcileReferences()}
              >
                {copy('checkReferences')}
              </Button>
              <Button
                danger
                disabled={maintenanceBusy || total === 0}
                icon={Trash2}
                loading={cleanupMutation.isPending}
                onClick={confirmCleanup}
                type="primary"
              >
                {copy('cleanupAll')}
              </Button>
            </>
          }
          description={copy('orphanExplain', {
            minutes: ORPHAN_CLEANUP_MAX_AGE_MINUTES,
          })}
          tabs={<FilesTabs />}
          title={copy('libraryTitle')}
          width="wide"
        >
          {showStale ? (
            <Alert
              action={
                <Button onClick={() => void orphansQuery.refetch()}>
                  {copy('retry')}
                </Button>
              }
              description={copy('loadOrphansFailedBody')}
              title={copy('loadOrphansFailedTitle')}
              type="warning"
            />
          ) : null}
          <ProTable<OrphanFile>
            columnEmptyText="--"
            columns={columns}
            dataSource={filtered}
            loading={orphansQuery.isFetching && orphansQuery.isPlaceholderData}
            locale={{ emptyText: emptyNode }}
            onRow={(item) =>
              ({
                'data-cursor': selection.isCursor(item.id) ? '' : undefined,
                'data-id': item.id,
                'data-scope-item': 'row',
                onClick: (event) => {
                  if (isInteractiveTarget(event.target)) return
                  selection.setCursor(item.id)
                  if (event.shiftKey) selection.selectRange(item.id)
                  else if (event.metaKey || event.ctrlKey)
                    selection.toggleWithAnchor(item.id)
                  else openItem(item)
                },
                onContextMenu: (event) => {
                  event.preventDefault()
                  selection.setCursor(item.id)
                  showContextMenu(buildFileMenuItems(actions, item))
                },
                tabIndex: -1,
              }) as HTMLAttributes<HTMLElement>
            }
            options={{
              density: false,
              fullScreen: false,
              reload: () => void orphansQuery.refetch(),
              search: false,
              setting: false,
            }}
            pagination={{
              current: page,
              hideOnSinglePage: true,
              onChange: (nextPage) => setPage(nextPage),
              pageSize: FILES_PAGE_SIZE,
              showSizeChanger: false,
              total,
            }}
            rowClassName={(item) =>
              item.id === openId
                ? `${styles.row} ${styles.rowOpen}`
                : styles.row
            }
            rowKey="id"
            rowSelection={{
              onChange: (keys) => {
                setSelectAllAcross(false)
                const next = new Set(keys.map(String))
                for (const item of filtered) {
                  if (next.has(item.id) !== selection.isSelected(item.id)) {
                    selection.toggle(item.id)
                  }
                }
              },
              selectedRowKeys: [...selection.selectedIds],
            }}
            search={false}
            tableAlertOptionRender={() => (
              <div className={styles.selectionBar}>
                {allVisibleSelected && pageCount > 1 && !selectAllAcross ? (
                  <Button
                    htmlType="button"
                    onClick={() => setSelectAllAcross(true)}
                    size="small"
                    type="text"
                  >
                    {copy('selectEvery', { count: total })}
                  </Button>
                ) : null}
                <Button
                  danger
                  htmlType="button"
                  icon={Trash2}
                  loading={deleteMutation.isPending}
                  onClick={() =>
                    confirmBatchDelete(selection.getSelectedTargets())
                  }
                  size="small"
                >
                  {copy('deleteSelected')}
                </Button>
                <Button
                  htmlType="button"
                  icon={X}
                  onClick={() => {
                    setSelectAllAcross(false)
                    selection.clear()
                  }}
                  size="small"
                  type="text"
                >
                  {copy('clearSelection')}
                </Button>
              </div>
            )}
            tableAlertRender={() => (
              <Text weight={500}>
                {selectAllAcross
                  ? copy('allSelected', { count: total })
                  : copy('selectedCount', { count: selectedCount })}
              </Text>
            )}
            tableRender={(_props, dom) =>
              firstLoad ? <TableSkeleton rows={8} /> : dom
            }
            toolBarRender={() => [
              <div className={styles.search} key="search">
                <SearchBar
                  allowClear
                  aria-label={copy('searchLabel')}
                  enableShortKey={false}
                  onInputChange={fileSearch.setQuery}
                  placeholder={copy('searchPlaceholder')}
                  value={fileSearch.query}
                />
              </div>,
            ]}
            variant="outlined"
          />
        </Page>
        <Outlet />
      </FocusScope>
    </OrphanFilesRouteContext.Provider>
  )
}
