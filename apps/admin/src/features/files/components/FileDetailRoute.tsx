import { Button, Empty, Flexbox, Skeleton, Text, Tooltip } from '@lobehub/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useParams } from 'react-router'

import type { FileItem } from '~/api/files'
import { findInListCache } from '~/api/list-cache'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'

import { filesQueryKey } from '../constants'
import { useFileCopy } from '../copy'
import { mimeOf } from '../utils/file-kind'
import { EMPTY_VALUE, formatUploadedAt } from '../utils/format'
import { FileDetail, FileDetailState } from './FileDetail'
import { useFilesRouteContext } from './files-route-context'

const LIST_PREFIX = [...filesQueryKey, 'by-type'] as const

function extractFiles(value: unknown): FileItem[] | undefined {
  if (Array.isArray(value)) return value as FileItem[]
  return undefined
}

export function FileDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const copy = useFileCopy()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const ctx = useFilesRouteContext()

  const raw = useMemo(() => {
    if (!id) return undefined
    return findInListCache<FileItem>(
      queryClient,
      [...LIST_PREFIX, ctx.fileType],
      id,
      { extractItems: extractFiles, idField: 'name' },
    )
  }, [ctx.fileType, ctx.listStatus, id, queryClient])

  useDocumentTitle(raw?.name ?? id)

  let body
  if (!raw && ctx.listStatus === 'pending') {
    body = (
      <FileDetailState onClose={ctx.onBack} title={id ?? copy('loading')}>
        <Flexbox gap={16}>
          <Skeleton height={240} />
          <Skeleton.Text rows={4} />
        </Flexbox>
      </FileDetailState>
    )
  } else if (!raw && ctx.listStatus === 'error') {
    body = (
      <FileDetailState
        onClose={ctx.onBack}
        title={id ?? copy('missingFileTitle')}
      >
        <Empty
          action={<Button onClick={ctx.onRetry}>{copy('retry')}</Button>}
          description={copy('loadFailedBody')}
          title={copy('loadFailedTitle')}
        />
      </FileDetailState>
    )
  } else if (!id || !raw) {
    body = (
      <FileDetailState onClose={ctx.onBack} title={copy('missingFileTitle')}>
        <Empty
          action={<Button onClick={ctx.onBack}>{copy('backToList')}</Button>}
          description={copy('missingFileBody')}
          title={copy('missingFileTitle')}
        />
      </FileDetailState>
    )
  } else {
    const uploaded = formatUploadedAt(raw.created)
    body = (
      <FileDetail
        deleteDisabled={ctx.deleteDisabled}
        facts={[
          { key: 'type', label: copy('fieldType'), value: ctx.typeLabel },
          {
            key: 'mime',
            label: copy('fieldMime'),
            value: mimeOf(raw.name) ?? EMPTY_VALUE,
          },
          { key: 'uploaded', label: copy('fieldUploaded'), value: uploaded },
        ]}
        key={raw.url}
        meta={
          raw.created ? (
            <Tooltip title={uploaded}>
              <span>
                {copy('uploadedRelative', {
                  time: format.relativeTime(raw.created),
                })}
              </span>
            </Tooltip>
          ) : null
        }
        name={raw.name}
        onClose={ctx.onBack}
        onDelete={() => ctx.onDelete(raw)}
        references={<Text type="secondary">{copy('referencesUnknown')}</Text>}
        url={raw.url}
      />
    )
  }

  return body
}

export default FileDetailRoute
