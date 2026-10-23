import { cx, Icon, Tooltip } from '@lobehub/ui'
import type { LucideIcon } from 'lucide-react'
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  LoaderCircle,
  Minus,
} from 'lucide-react'

import { useAiCopy } from '../copy'
import { hubStyles } from '../hub/styles'
import type { CapabilityState, CapabilitySummary, LangState } from './coverage'

const STATE_ICON: Record<CapabilityState, LucideIcon> = {
  done: CircleCheck,
  failed: CircleAlert,
  gap: CircleDashed,
  na: Minus,
  none: Minus,
  pending: LoaderCircle,
}

const STATE_CLASS: Record<CapabilityState, string> = {
  done: hubStyles.cellDone,
  failed: hubStyles.cellFailed,
  gap: hubStyles.cellGap,
  na: hubStyles.cellMuted,
  none: hubStyles.cellMuted,
  pending: hubStyles.cellPending,
}

const LANG_LABEL = {
  done: 'langDone',
  failed: 'failed',
  gap: 'missing',
  pending: 'generating',
} as const

function langsOf(summary: CapabilitySummary, state: LangState) {
  return summary.langs
    .filter((cell) => cell.state === state)
    .map((cell) => cell.lang)
}

export function CapabilityCell(props: {
  showProgress?: boolean
  summary: CapabilitySummary
}) {
  const copy = useAiCopy()
  const { summary } = props
  const missing = langsOf(summary, 'gap')
  const label =
    summary.state === 'done'
      ? copy('stateDone')
      : summary.state === 'gap'
        ? missing.length <= 2
          ? copy('stateMissingLangs', { langs: missing.join(' ') })
          : copy('stateMissingCount', { count: missing.length })
        : summary.state === 'failed'
          ? copy('failed')
          : summary.state === 'pending'
            ? copy('generating')
            : summary.state === 'na'
              ? copy('stateNa')
              : copy('stateNone')
  const detail = summary.langs.length
    ? summary.langs
        .map((cell) => `${cell.lang} ${copy(LANG_LABEL[cell.state])}`)
        .join(' · ')
    : summary.state === 'none'
      ? copy('stateNoneHint')
      : undefined
  const done = langsOf(summary, 'done').length

  return (
    <Tooltip title={detail}>
      <span className={cx(hubStyles.cell, STATE_CLASS[summary.state])}>
        <Icon
          icon={STATE_ICON[summary.state]}
          size="small"
          spin={summary.state === 'pending'}
        />
        {label}
        {props.showProgress && summary.langs.length > 1 ? (
          <span className={hubStyles.cellProgress}>
            {copy('langProgress', { done, total: summary.langs.length })}
          </span>
        ) : null}
      </span>
    </Tooltip>
  )
}
