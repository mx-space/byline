import { createStaticStyles, Icon, Tag } from '@lobehub/ui'
import { CloudCheck, CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { DraftModel } from '~/models/draft'

import { useDraftCopy } from '../copy'

const styles = createStaticStyles(({ css }) => ({
  label: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
}))

const RELATIVE_TIME_TICK_MS = 30_000

export interface DraftStatusTagProps {
  className?: string
  draft: DraftModel | undefined
  isSaving: boolean
}

function latestOf(now: Date, savedAt: string) {
  const savedTs = Date.parse(savedAt)
  if (Number.isNaN(savedTs)) return now
  return savedTs > now.getTime() ? new Date(savedTs) : now
}

export function DraftStatusTag(props: DraftStatusTagProps) {
  const { copy, format } = useDraftCopy()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (props.isSaving || !props.draft) return
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, RELATIVE_TIME_TICK_MS)
    return () => window.clearInterval(timer)
  }, [props.draft, props.isSaving])

  if (props.isSaving) {
    return (
      <Tag className={props.className} icon={<Icon icon={Loader2} spin />}>
        <span>{copy('statusSaving')}</span>
      </Tag>
    )
  }

  if (!props.draft) {
    return (
      <Tag className={props.className} icon={<Icon icon={CloudOff} />}>
        <span>{copy('statusUnsaved')}</span>
      </Tag>
    )
  }

  const savedAt = props.draft.updatedAt ?? props.draft.createdAt
  const absolute = format.dateTime(savedAt)
  const relative = format.relativeTime(savedAt, latestOf(now, savedAt))

  return (
    <Tag
      className={props.className}
      icon={<Icon icon={CloudCheck} />}
      title={copy('statusSavedTooltip', { time: absolute })}
    >
      <span className={styles.label}>
        {copy('statusSaved', { time: relative })}
      </span>
    </Tag>
  )
}
