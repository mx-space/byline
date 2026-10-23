import { Tag } from '@lobehub/ui'

import type { OrphanFile } from '~/api/files'

import { useFileCopy } from '../copy'

export function wasReferenced(file: OrphanFile) {
  return Boolean(file.refType || file.detachedAt || file.status === 'detached')
}

export function OrphanStatusTag(props: { file: OrphanFile }) {
  const copy = useFileCopy()
  if (wasReferenced(props.file)) {
    return <Tag color="warning">{copy('stateDetached')}</Tag>
  }
  return <Tag>{copy('stateNeverUsed')}</Tag>
}
