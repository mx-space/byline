import type { TagSize } from '@lobehub/ui'
import { Tag } from '@lobehub/ui'

import type { DraftModel } from '~/models/draft'

import { useDraftCopy } from '../copy'
import type { DraftChangeKind } from '../utils/draft-decision'
import { draftChangeKind } from '../utils/draft-decision'

const kindColor: Record<DraftChangeKind, string | undefined> = {
  behind: 'warning',
  changed: 'processing',
  new: undefined,
  same: 'success',
}

const kindLabel = {
  behind: 'changeBehind',
  changed: 'changeChanged',
  new: 'changeNew',
  same: 'changeSame',
} as const

export function DraftKindTag(props: { draft: DraftModel; size?: TagSize }) {
  const { copy } = useDraftCopy()
  const kind = draftChangeKind(props.draft)
  return (
    <Tag color={kindColor[kind]} size={props.size}>
      {copy(kindLabel[kind])}
    </Tag>
  )
}
