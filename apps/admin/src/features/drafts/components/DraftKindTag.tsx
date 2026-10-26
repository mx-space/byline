import type { TagSize } from '@lobehub/ui'
import { Tag, Tooltip } from '@lobehub/ui'

import type { DraftModel } from '~/models/draft'

import { useDraftCopy } from '../copy'
import type { DraftChangeKind } from '../utils/draft-decision'
import { draftChangeKind } from '../utils/draft-decision'

const kindColor: Record<DraftChangeKind, string | undefined> = {
  changed: 'processing',
  new: undefined,
  same: 'success',
}

const kindLabel = {
  changed: 'changeChanged',
  new: 'changeNew',
  same: 'changeSame',
} as const

const kindDetail = {
  changed: 'changeChangedDetail',
  new: 'changeNewDetail',
  same: 'changesNone',
} as const

export function DraftKindTag(props: { draft: DraftModel; size?: TagSize }) {
  const { copy } = useDraftCopy()
  const kind = draftChangeKind(props.draft)
  return (
    <Tooltip title={copy(kindDetail[kind])}>
      <span>
        <Tag color={kindColor[kind]} size={props.size}>
          {copy(kindLabel[kind])}
        </Tag>
      </span>
    </Tooltip>
  )
}
