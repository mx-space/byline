import { ActionIcon, Flexbox, Tag, Text, Tooltip } from '@lobehub/ui'
import type { ProColumns } from '@lobehub/ui/pro-table'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { Copy, ExternalLink, Trash2 } from 'lucide-react'

import type { RemoteFile } from '~/api/files'
import { useI18n } from '~/i18n'
import { pinEnd, pinStart, useRecordTable } from '~/ui/record-table'

import { useFileCopy } from '../copy'
import { extensionOf } from '../utils/file-kind'
import { formatBytes, formatUploadedAt } from '../utils/format'
import { FileThumb } from './FileThumb'

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    display: 'flex',
    gap: 2,
    justifyContent: 'flex-end',
  },
  nameCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  nameText: {
    fontWeight: 500,
  },
  numeric: {
    color: cssVar.colorTextSecondary,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  path: {
    color: cssVar.colorTextTertiary,
    fontFamily: cssVar.fontFamilyCode,
    fontSize: cssVar.fontSizeSM,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

export function useRemoteFileColumns(props: {
  deleteDisabled: boolean
  onCopy: (item: RemoteFile) => void
  onDelete: (item: RemoteFile) => void
}): ProColumns<RemoteFile>[] {
  const copy = useFileCopy()
  const table = useRecordTable()
  const { format } = useI18n()

  return [
    {
      dataIndex: 'fileName',
      render: (_dom, item) => (
        <Flexbox align="center" gap={12} horizontal style={{ minWidth: 0 }}>
          <FileThumb
            mime={item.mimeType}
            name={item.fileName}
            url={item.fileUrl}
          />
          <div {...stylex.props(styles.nameCell)}>
            <Text
              {...stylex.props(styles.nameText)}
              ellipsis={{ tooltip: item.fileName, tooltipWhenOverflow: true }}
            >
              {item.fileName}
            </Text>
            <span {...stylex.props(styles.path)}>{item.objectKey}</span>
          </div>
        </Flexbox>
      ),
      title: copy('columnName'),
      ...pinStart(table.pin),
    },
    {
      dataIndex: 'inUse',
      render: (_dom, item) =>
        item.inUse ? (
          <Tag color="success">{copy('stateInUse')}</Tag>
        ) : (
          <Tag>{copy('stateUnused')}</Tag>
        ),
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
      width: 112,
    },
    {
      align: 'right',
      dataIndex: 'byteSize',
      render: (_dom, item) => (
        <span {...stylex.props(styles.numeric)}>
          {formatBytes(item.byteSize)}
        </span>
      ),
      responsive: ['md'],
      title: copy('fieldSize'),
      width: 104,
    },
    {
      dataIndex: 'createdAt',
      render: (_dom, item) => (
        <Tooltip title={formatUploadedAt(item.createdAt)}>
          <span {...stylex.props(styles.numeric)}>
            {format.relativeTime(item.createdAt)}
          </span>
        </Tooltip>
      ),
      responsive: ['md'],
      title: copy('fieldUploaded'),
      width: 140,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, item) => (
        <div {...stylex.props(styles.actions)}>
          <ActionIcon
            aria-label={copy('openFile')}
            icon={ExternalLink}
            onClick={() =>
              window.open(item.fileUrl, '_blank', 'noopener,noreferrer')
            }
            size="small"
            title={copy('openFile')}
          />
          <ActionIcon
            aria-label={copy('copyLink')}
            icon={Copy}
            onClick={() => props.onCopy(item)}
            size="small"
            title={copy('copyLink')}
          />
          <ActionIcon
            aria-label={copy('deleteFile')}
            disabled={props.deleteDisabled}
            icon={Trash2}
            onClick={() => props.onDelete(item)}
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
}
