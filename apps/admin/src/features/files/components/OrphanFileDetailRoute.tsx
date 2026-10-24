import { Empty, Flexbox, Skeleton, Text, Tooltip } from '@lobehub/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'

import type { OrphanFile } from '~/api/files'
import { findInListCache } from '~/api/list-cache'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { useI18n } from '~/i18n'
import { EmptyValue } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { filesQueryKey } from '../constants'
import { useFileCopy } from '../copy'
import { mimeOf } from '../utils/file-kind'
import { formatBytes, formatUploadedAt } from '../utils/format'
import { FileDetail, FileDetailState } from './FileDetail'
import { useOrphanFilesRouteContext } from './orphan-files-route-context'
import { OrphanStatusTag, wasReferenced } from './OrphanStatusTag'

const LIST_PREFIX = [...filesQueryKey, 'orphans'] as const

function extractOrphans(value: unknown): OrphanFile[] | undefined {
  if (!value || typeof value !== 'object') return undefined
  const data = (value as { data?: unknown }).data
  return Array.isArray(data) ? (data as OrphanFile[]) : undefined
}

function sourceHref(file: OrphanFile) {
  if (!file.refId) return null
  if (file.refType === 'post')
    return `/posts/edit?id=${encodeURIComponent(file.refId)}`
  if (file.refType === 'draft')
    return `/drafts/${encodeURIComponent(file.refId)}`
  return null
}

function OrphanReferences(props: { file: OrphanFile }) {
  const copy = useFileCopy()
  const { format } = useI18n()
  const href = sourceHref(props.file)
  if (!wasReferenced(props.file)) {
    return <Text type="secondary">{copy('referencesNever')}</Text>
  }
  const source =
    props.file.refType === 'draft' ? copy('sourceDraft') : copy('sourcePost')
  return (
    <Flexbox gap={4}>
      <Text type="secondary">
        {props.file.detachedAt
          ? copy('referencesDetachedAt', {
              source,
              time: format.relativeTime(props.file.detachedAt),
            })
          : copy('referencesDetached', { source })}
      </Text>
      {href ? <Link to={href}>{copy('openSource', { source })}</Link> : null}
    </Flexbox>
  )
}

export function OrphanFileDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const copy = useFileCopy()
  const { format } = useI18n()
  const queryClient = useQueryClient()
  const ctx = useOrphanFilesRouteContext()

  const raw = useMemo(() => {
    if (!id) return undefined
    return findInListCache<OrphanFile>(queryClient, LIST_PREFIX, id, {
      extractItems: extractOrphans,
    })
  }, [ctx.listUpdatedAt, id, queryClient])

  useDocumentTitle(raw?.fileName)

  let body
  if (!raw && ctx.listStatus === 'pending') {
    body = (
      <FileDetailState onClose={ctx.onBack} title={copy('loading')}>
        <Flexbox gap={16}>
          <Skeleton height={240} />
          <Skeleton.Text rows={4} />
        </Flexbox>
      </FileDetailState>
    )
  } else if (!raw && ctx.listStatus === 'error') {
    body = (
      <FileDetailState onClose={ctx.onBack} title={copy('missingOrphanTitle')}>
        <Empty
          action={<Button onClick={ctx.onRetry}>{copy('retry')}</Button>}
          description={copy('loadOrphansFailedBody')}
          title={copy('loadOrphansFailedTitle')}
        />
      </FileDetailState>
    )
  } else if (!id || !raw) {
    body = (
      <FileDetailState onClose={ctx.onBack} title={copy('missingOrphanTitle')}>
        <Empty
          action={<Button onClick={ctx.onBack}>{copy('backToList')}</Button>}
          description={copy('missingOrphanBody')}
          title={copy('missingOrphanTitle')}
        />
      </FileDetailState>
    )
  } else {
    const uploaded = formatUploadedAt(raw.createdAt)
    body = (
      <FileDetail
        deleteDisabled={ctx.deleteDisabled}
        facts={[
          {
            key: 'size',
            label: copy('fieldSize'),
            value:
              raw.byteSize == null ? <EmptyValue /> : formatBytes(raw.byteSize),
          },
          {
            key: 'mime',
            label: copy('fieldMime'),
            value: mimeOf(raw.fileName, raw.mimeType) ?? <EmptyValue />,
          },
          {
            key: 'uploaded',
            label: copy('fieldUploaded'),
            value: raw.createdAt ? uploaded : <EmptyValue />,
          },
        ]}
        key={raw.id}
        meta={
          <>
            <span>{formatBytes(raw.byteSize)}</span>
            <Tooltip title={uploaded}>
              <span>
                {copy('uploadedRelative', {
                  time: format.relativeTime(raw.createdAt),
                })}
              </span>
            </Tooltip>
          </>
        }
        mime={raw.mimeType}
        name={raw.fileName}
        onClose={ctx.onBack}
        onDelete={() => ctx.onDelete(raw)}
        references={<OrphanReferences file={raw} />}
        status={<OrphanStatusTag file={raw} />}
        url={raw.fileUrl}
      />
    )
  }

  return body
}

export default OrphanFileDetailRoute
