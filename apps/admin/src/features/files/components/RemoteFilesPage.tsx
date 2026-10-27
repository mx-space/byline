import { Alert, confirmModal, Empty, SearchBar, toast } from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { ProTable } from '@lobehub/ui/pro-table'
import * as stylex from '@stylexjs/stylex'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import type { RemoteFile } from '~/api/files'
import { deleteRemoteFile } from '~/api/files'
import { Page } from '~/ui/page'
import {
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import { FILES_PAGE_SIZE, filesQueryKey } from '../constants'
import { useFileCopy } from '../copy'
import { useFileSearch } from '../hooks/useFileSearch'
import { useRemoteFilesList } from '../hooks/useRemoteFilesList'
import { copyFileLink } from './FileDetail'
import { FilesTabs } from './FilesTabs'
import { useRemoteFileColumns } from './remote-file-columns'

const styles = stylex.create({
  search: {
    flexBasis: '14rem',
    flexGrow: 1,
    flexShrink: 1,
    maxWidth: '24rem',
    minWidth: '10rem',
  },
})

const getName = (item: RemoteFile) => item.fileName

export function RemoteFilesPage() {
  const copy = useFileCopy()
  const table = useRecordTable()
  const queryClient = useQueryClient()
  const { files, page, remoteQuery, setPage, total } = useRemoteFilesList()
  const fileSearch = useFileSearch(files, getName)
  const firstLoad = remoteQuery.isPending && files.length === 0
  const failedEmpty = remoteQuery.isError && files.length === 0
  const showStale = remoteQuery.isError && files.length > 0

  const deleteMutation = useMutation({
    mutationFn: (item: RemoteFile) => deleteRemoteFile(item.id),
    onError: (_error: unknown, item) =>
      toast.error(copy('deleteFailedNamed', { name: item.fileName })),
    onSuccess: async (_result, item) => {
      toast.success(copy('deletedNamed', { name: item.fileName }))
      await queryClient.invalidateQueries({ queryKey: filesQueryKey })
    },
  })

  const copyLink = (item: RemoteFile) =>
    void copyFileLink(item.fileUrl, {
      failed: copy('copyFailed'),
      success: copy('copied'),
    })

  const confirmAndDelete = (item: RemoteFile) => {
    confirmModal({
      cancelText: copy('cancel'),
      content: copy(item.inUse ? 'deleteInUseBody' : 'deleteOneBody'),
      okButtonProps: { danger: true },
      okText: copy('delete'),
      onOk: () =>
        deleteMutation.mutateAsync(item).then(
          () => undefined,
          () => undefined,
        ),
      title: copy('deleteFileTitle', { name: item.fileName }),
    })
  }

  const columns = useRemoteFileColumns({
    deleteDisabled: deleteMutation.isPending,
    onCopy: copyLink,
    onDelete: confirmAndDelete,
  })

  const retryButton = (
    <Button onClick={() => void remoteQuery.refetch()}>{copy('retry')}</Button>
  )

  const emptyNode: ReactNode = failedEmpty ? (
    <Empty
      action={retryButton}
      description={copy('loadRemoteFailedBody')}
      title={copy('loadRemoteFailedTitle')}
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
      description={copy('emptyRemoteBody')}
      title={copy('emptyRemoteTitle')}
    />
  )

  return (
    <Page
      description={copy('remoteExplain')}
      tabs={<FilesTabs />}
      title={copy('libraryTitle')}
      width="wide"
    >
      {showStale ? (
        <Alert
          action={retryButton}
          description={copy('loadRemoteFailedBody')}
          title={copy('loadRemoteFailedTitle')}
          type="warning"
        />
      ) : null}
      <ProTable<RemoteFile>
        className={recordTableStyles.root}
        columnEmptyText="--"
        columns={columns}
        dataSource={fileSearch.items}
        loading={remoteQuery.isFetching && remoteQuery.isPlaceholderData}
        locale={{ emptyText: emptyNode }}
        options={{
          density: false,
          fullScreen: false,
          reload: () => void remoteQuery.refetch(),
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
        rowKey="id"
        scroll={recordTableScroll(columns, table)}
        search={false}
        tableLayout="fixed"
        tableRender={(_props, dom) =>
          firstLoad ? <TableSkeleton rows={8} /> : dom
        }
        toolBarRender={() => [
          <div {...stylex.props(styles.search)} key="search">
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
  )
}
