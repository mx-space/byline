import {
  ActionIcon,
  Alert,
  confirmModal,
  createStaticStyles,
  Empty,
  Flexbox,
  SearchBar,
  Segmented,
  showContextMenu,
  Skeleton,
  Tag,
  Text,
  toast,
  Tooltip,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  ExternalLink,
  LayoutGrid,
  List,
  RefreshCw,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react'
import type { ChangeEvent, HTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'

import type { FileItem } from '~/api/files'
import { deleteFileByTypeAndName } from '~/api/files'
import { useLocalStorageState } from '~/hooks/use-local-storage-state'
import { useI18n } from '~/i18n'
import {
  alphaFirst,
  compareText,
  compareTime,
  type HeaderSortOrder,
  newestFirst,
  orderedBy,
  readFilterValues,
} from '~/ui/data/table-header'
import { FocusScope } from '~/ui/focus-scope'
import type { ListAction } from '~/ui/list-actions'
import { useListKeyboard } from '~/ui/list-actions'
import { Page } from '~/ui/page'
import {
  pinEnd,
  pinStart,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import type { FilesView } from '../constants'
import {
  FILES_TABLE_PAGE_SIZE,
  FILES_VIEW_STORAGE_KEY,
  filesQueryKey,
  fileTypeOptions,
} from '../constants'
import { useFileCopy } from '../copy'
import { useFileDrop } from '../hooks/useFileDrop'
import { useFilesByTypeList } from '../hooks/useFilesByTypeList'
import { useFileSearch } from '../hooks/useFileSearch'
import { useFileUploader } from '../hooks/useFileUploader'
import { extensionOf, pathOf } from '../utils/file-kind'
import { formatUploadedAt } from '../utils/format'
import { buildFileMenuItems } from '../utils/menu'
import { copyFileLink } from './FileDetail'
import { FileGrid } from './FileGrid'
import { FilesRouteContext } from './files-route-context'
import { FilesTabs } from './FilesTabs'
import { FileThumb } from './FileThumb'
import { UploadStatus } from './UploadStatus'

const styles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  `,
  headerTitle: css`
    white-space: nowrap;
  `,
  drop: css`
    pointer-events: none;

    position: absolute;
    z-index: 10;
    inset: 12px;

    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;

    border: 1px dashed ${cssVar.colorPrimary};
    border-radius: ${cssVar.borderRadiusLG};

    color: ${cssVar.colorPrimary};

    background: ${cssVar.colorPrimaryBg};
  `,
  fileInput: css`
    position: absolute;
    overflow: hidden;
    width: 1px;
    height: 1px;
    opacity: 0;
  `,
  cardSkeleton: css`
    display: flex;
    flex-direction: column;
    gap: 8px;

    min-width: 0;
    padding: 8px;
    border: 1px solid ${cssVar.colorFillSecondary};
    border-radius: ${cssVar.borderRadiusLG};
  `,
  gridSkeleton: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
    gap: 12px;
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
  path: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  root: css`
    position: relative;
    height: 100%;
    min-height: 0;
  `,
  row: css`
    cursor: pointer;

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
  state: css`
    padding-block: 48px;
  `,
  time: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;
  `,
  toolbar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  `,
  toolbarEnd: css`
    display: flex;
    gap: 4px;
    align-items: center;
    margin-inline-start: auto;
  `,
}))

const FOCUS_SCOPE_ID = 'files-list'

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

export function FilesLibraryPage() {
  const copy = useFileCopy()
  const table = useRecordTable()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const openName = params.id ?? null
  const openNameRef = useRef(openName)
  openNameRef.current = openName
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useLocalStorageState<FilesView>(
    FILES_VIEW_STORAGE_KEY,
    'grid',
  )
  const { allFiles, fileType, filesQuery, setFileType } = useFilesByTypeList()
  const currentType =
    fileTypeOptions.find((option) => option.value === fileType) ??
    fileTypeOptions[0]

  const getName = useMemo(() => (item: FileItem) => item.name, [])
  const fileSearch = useFileSearch(allFiles, getName)
  const [extensions, setExtensions] = useState<string[]>([])
  const [columnSort, setColumnSort] = useState<{
    key: 'created' | 'name' | 'type'
    order: HeaderSortOrder
  } | null>(null)

  useEffect(() => {
    setExtensions([])
  }, [fileType])

  const extensionOptions = useMemo(() => {
    const found = new Set<string>()
    for (const item of allFiles) {
      const extension = extensionOf(item.name)
      if (extension) found.add(extension)
    }
    return [...found].sort(compareText)
  }, [allFiles])

  const rows = useMemo(() => {
    const selected = new Set(extensions)
    const narrowed =
      selected.size === 0
        ? fileSearch.items
        : fileSearch.items.filter((item) => {
            const extension = extensionOf(item.name)
            return extension ? selected.has(extension) : false
          })
    if (!columnSort) return narrowed
    const compare = {
      created: (left: FileItem, right: FileItem) =>
        compareTime(left.created, right.created),
      name: (left: FileItem, right: FileItem) =>
        compareText(left.name, right.name),
      type: (left: FileItem, right: FileItem) =>
        compareText(
          extensionOf(left.name) ?? '',
          extensionOf(right.name) ?? '',
        ),
    }[columnSort.key]
    return orderedBy(narrowed, columnSort.order, compare)
  }, [columnSort, extensions, fileSearch.items])
  const firstLoad = filesQuery.isPending && allFiles.length === 0
  const failedEmpty = filesQuery.isError && allFiles.length === 0
  const showStale = filesQuery.isError && allFiles.length > 0

  const listPath = `/files?type=${fileType}`
  const closeDetail = () => navigate(listPath)
  const openItem = (item: FileItem) =>
    navigate(`/files/${encodeURIComponent(item.name)}?type=${fileType}`)
  const copyLink = (item: FileItem) =>
    void copyFileLink(item.url, {
      failed: copy('copyFailed'),
      success: copy('copied'),
    })

  const deleteMutation = useMutation({
    mutationFn: (item: FileItem) =>
      deleteFileByTypeAndName(fileType, item.name),
    onError: (_error: unknown, item) =>
      toast.error(copy('deleteFailedNamed', { name: item.name })),
    onSuccess: async (_result, item) => {
      toast.success(copy('deletedNamed', { name: item.name }))
      if (openNameRef.current === item.name) navigate(listPath)
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const uploader = useFileUploader({
    acceptImage: currentType.acceptImage,
    notImageMessage: (name) => copy('notImage', { name }),
    onSettled: async ({ failureCount, successCount }) => {
      if (successCount === 0 && failureCount === 0) return
      if (successCount > 0) {
        await queryClient.invalidateQueries({ queryKey: filesQueryKey })
      }
      toast[failureCount > 0 && successCount === 0 ? 'error' : 'success'](
        copy('uploadResult', { failed: failureCount, success: successCount }),
      )
    },
    onValidationError: (message) => toast.error(message),
    type: fileType,
    uploadFailedMessage: copy('uploadFailed'),
  })
  const drop = useFileDrop((files) => void uploader.upload(files))

  const confirmAndDelete = (item: FileItem) => {
    confirmModal({
      cancelText: copy('cancel'),
      content: copy('deleteFileBody'),
      okButtonProps: { danger: true },
      okText: copy('delete'),
      onOk: async () => {
        await deleteMutation.mutateAsync(item).catch(() => undefined)
      },
      title: copy('deleteFileTitle', { name: item.name }),
    })
  }

  const actions: ListAction<FileItem>[] = [
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
      run: (targets) => confirmAndDelete(targets[0]),
      shortcut: 'Backspace',
      shortcutLabel: '⌫',
    },
  ]

  const { selection } = useListKeyboard<FileItem>({
    actions,
    getId: (item) => item.name,
    items: rows,
    resetOn: [columnSort, extensions, fileType, fileSearch.query, view],
    scopeId: FOCUS_SCOPE_ID,
  })
  const cursorId =
    rows.find((item) => selection.isCursor(item.name))?.name ?? null

  const onUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void uploader.upload(files)
  }

  const listStatus: 'error' | 'pending' | 'success' = filesQuery.isError
    ? 'error'
    : filesQuery.isPending
      ? 'pending'
      : 'success'

  const ctxValue = {
    deleteDisabled: deleteMutation.isPending,
    fileType,
    listStatus,
    onBack: closeDetail,
    onDelete: confirmAndDelete,
    onRetry: () => void filesQuery.refetch(),
    typeLabel: copy(currentType.copyKey),
  }

  const columns: ProColumns<FileItem>[] = [
    {
      dataIndex: 'name',
      render: (_dom, item) => (
        <Flexbox align="center" gap={12} horizontal style={{ minWidth: 0 }}>
          <FileThumb name={item.name} url={item.url} />
          <div className={styles.nameCell}>
            <Text
              className={styles.nameText}
              ellipsis={{ tooltip: item.name, tooltipWhenOverflow: true }}
            >
              {item.name}
            </Text>
            <span className={styles.path}>{pathOf(item.url)}</span>
          </div>
        </Flexbox>
      ),
      sortDirections: alphaFirst,
      sortOrder: columnSort?.key === 'name' ? columnSort.order : null,
      sorter: true,
      title: copy('columnName'),
      ...pinStart(table.pin),
    },
    {
      dataIndex: 'type',
      filterSearch: extensionOptions.length > 7,
      filteredValue: extensions.length > 0 ? extensions : null,
      filters:
        extensionOptions.length > 0
          ? extensionOptions.map((extension) => ({
              text: extension.toUpperCase(),
              value: extension,
            }))
          : undefined,
      onFilter: false,
      render: (_dom, item) => {
        const ext = extensionOf(item.name)
        return ext ? <Tag>{ext.toUpperCase()}</Tag> : '--'
      },
      responsive: ['md'],
      sortDirections: alphaFirst,
      sortOrder: columnSort?.key === 'type' ? columnSort.order : null,
      sorter: true,
      title: <span className={styles.headerTitle}>{copy('fieldType')}</span>,
      width: 128,
    },
    {
      dataIndex: 'created',
      render: (_dom, item) => (
        <Tooltip title={formatUploadedAt(item.created)}>
          <span className={styles.time}>
            {item.created ? format.relativeTime(item.created) : '--'}
          </span>
        </Tooltip>
      ),
      responsive: ['md'],
      sortDirections: newestFirst,
      sortOrder: columnSort?.key === 'created' ? columnSort.order : null,
      sorter: true,
      title: (
        <span className={styles.headerTitle}>{copy('fieldUploaded')}</span>
      ),
      width: 152,
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
            aria-label={copy('openFile')}
            icon={ExternalLink}
            onClick={() =>
              window.open(item.url, '_blank', 'noopener,noreferrer')
            }
            size="small"
            title={copy('openFile')}
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
      width: 120,
      ...pinEnd(table.pin),
    },
  ]

  const emptyNode: ReactNode = failedEmpty ? (
    <Empty
      action={
        <Button onClick={() => void filesQuery.refetch()}>
          {copy('retry')}
        </Button>
      }
      description={copy('loadFailedBody')}
      title={copy('loadFailedTitle')}
    />
  ) : fileSearch.query || extensions.length > 0 ? (
    <Empty
      action={
        <Button
          onClick={() => {
            if (extensions.length > 0) setExtensions([])
            if (fileSearch.query) fileSearch.setQuery('')
          }}
        >
          {fileSearch.query ? copy('clearSearch') : copy('clearFilters')}
        </Button>
      }
      title={copy('emptySearchTitle')}
    />
  ) : (
    <Empty
      action={
        <Button icon={Upload} onClick={() => uploadInputRef.current?.click()}>
          {copy('upload')}
        </Button>
      }
      description={copy('emptyLibraryBody')}
      title={copy('emptyLibraryTitle', { type: copy(currentType.copyKey) })}
    />
  )

  let content: ReactNode
  if (view === 'grid') {
    content = firstLoad ? (
      <div aria-busy="true" className={styles.gridSkeleton}>
        {Array.from({ length: 8 }, (_, index) => (
          <div className={styles.cardSkeleton} key={index}>
            <Skeleton
              style={{ aspectRatio: '4 / 3', height: 'auto' }}
              width="100%"
            />
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="40%" />
          </div>
        ))}
      </div>
    ) : rows.length === 0 ? (
      <div className={styles.state}>{emptyNode}</div>
    ) : (
      <FileGrid
        cursorId={cursorId}
        items={rows}
        menuItems={(item) => buildFileMenuItems(actions, item)}
        onCopy={copyLink}
        onOpen={(item) => {
          selection.setCursor(item.name)
          openItem(item)
        }}
        openName={openName}
      />
    )
  } else {
    content = (
      <ProTable<FileItem>
        className={recordTableStyles.root}
        columnEmptyText="--"
        columns={columns}
        scroll={recordTableScroll(columns, table)}
        tableLayout="fixed"
        dataSource={rows}
        onChange={(_pagination, filters, sorter, extra) => {
          if (extra.action === 'filter') {
            setExtensions(readFilterValues(filters, 'type'))
            return
          }
          if (extra.action !== 'sort') return
          const info = Array.isArray(sorter) ? sorter[0] : sorter
          const key = info?.columnKey == null ? '' : String(info.columnKey)
          if (
            !info?.order ||
            (key !== 'name' && key !== 'type' && key !== 'created')
          ) {
            setColumnSort(null)
            return
          }
          setColumnSort({ key, order: info.order })
        }}
        loading={filesQuery.isFetching && filesQuery.isPlaceholderData}
        locale={{ emptyText: emptyNode }}
        onRow={(item) =>
          ({
            'data-cursor': selection.isCursor(item.name) ? '' : undefined,
            'data-id': item.name,
            'data-scope-item': 'row',
            onClick: (event) => {
              if (isInteractiveTarget(event.target)) return
              selection.setCursor(item.name)
              openItem(item)
            },
            onContextMenu: (event) => {
              event.preventDefault()
              selection.setCursor(item.name)
              showContextMenu(buildFileMenuItems(actions, item))
            },
            tabIndex: -1,
          }) as HTMLAttributes<HTMLElement>
        }
        options={false}
        pagination={{
          hideOnSinglePage: true,
          pageSize: FILES_TABLE_PAGE_SIZE,
          showSizeChanger: false,
        }}
        rowClassName={(item) =>
          item.name === openName
            ? `${styles.row} ${styles.rowOpen}`
            : styles.row
        }
        rowKey="name"
        search={false}
        tableRender={(_props, dom) =>
          firstLoad ? <TableSkeleton rows={8} /> : dom
        }
        toolBarRender={false}
        variant="outlined"
      />
    )
  }

  return (
    <FilesRouteContext.Provider value={ctxValue}>
      <FocusScope className={styles.root} id={FOCUS_SCOPE_ID} {...drop.bind}>
        <Page
          actions={
            <>
              <input
                accept={currentType.acceptImage ? 'image/*' : undefined}
                aria-hidden
                className={styles.fileInput}
                multiple
                onChange={onUploadChange}
                ref={uploadInputRef}
                tabIndex={-1}
                type="file"
              />
              <Button
                icon={Upload}
                loading={uploader.busy}
                onClick={() => uploadInputRef.current?.click()}
                type="primary"
              >
                {uploader.busy ? copy('uploading') : copy('upload')}
              </Button>
            </>
          }
          count={filesQuery.isSuccess ? allFiles.length : undefined}
          description={copy('libraryDescription')}
          tabs={<FilesTabs />}
          title={copy('libraryTitle')}
          width="wide"
        >
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <SearchBar
                allowClear
                aria-label={copy('searchLabel')}
                enableShortKey={false}
                onInputChange={fileSearch.setQuery}
                placeholder={copy('searchPlaceholder')}
                value={fileSearch.query}
              />
            </div>
            <Segmented
              aria-label={copy('typeLabel')}
              onChange={(next) => {
                fileSearch.setQuery('')
                setFileType(next)
                navigate(`/files?type=${next}`)
              }}
              options={fileTypeOptions.map((option) => ({
                label: copy(option.copyKey),
                value: option.value,
              }))}
              value={fileType}
            />
            <div className={styles.toolbarEnd}>
              <Segmented
                aria-label={copy('viewLabel')}
                onChange={(next) => setView(next)}
                options={[
                  {
                    icon: <LayoutGrid size={16} />,
                    title: copy('viewGrid'),
                    value: 'grid',
                  },
                  {
                    icon: <List size={16} />,
                    title: copy('viewList'),
                    value: 'list',
                  },
                ]}
                value={view}
              />
              <ActionIcon
                aria-label={copy('refresh')}
                icon={RefreshCw}
                loading={filesQuery.isFetching}
                onClick={() => void filesQuery.refetch()}
                title={copy('refresh')}
              />
            </div>
          </div>
          {showStale ? (
            <Alert
              action={
                <Button onClick={() => void filesQuery.refetch()}>
                  {copy('retry')}
                </Button>
              }
              description={copy('loadFailedBody')}
              title={copy('loadFailedTitle')}
              type="warning"
            />
          ) : null}
          {uploader.items.length > 0 ? (
            <UploadStatus
              doneLabel={copy('uploadDone')}
              errorLabel={(count) => copy('uploadErrors', { count })}
              items={uploader.items}
              progressLabel={(count) => copy('uploadProgress', { count })}
            />
          ) : null}
          {content}
        </Page>
        {drop.over ? (
          <div className={styles.drop}>
            <UploadCloud size={32} />
            <Text strong>{copy('dropTitle')}</Text>
            <Text type="secondary">
              {currentType.acceptImage
                ? copy('dropImage', { type: copy(currentType.copyKey) })
                : copy('dropAny')}
            </Text>
          </div>
        ) : null}
        <Outlet />
      </FocusScope>
    </FilesRouteContext.Provider>
  )
}
