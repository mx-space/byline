import { createStaticStyles, Icon } from '@lobehub/ui'
import { Loader2 } from 'lucide-react'

import type { AITask } from '~/api/tasks'
import { AITaskStatus } from '~/api/tasks'
import { useI18n } from '~/i18n'

import { formatElapsed, formatTaskClock } from '../utils/task-time'
import { getEffectiveStatus } from '../utils/tasks'

const styles = createStaticStyles(({ css, cssVar }) => ({
  list: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  `,
  item: css`
    align-items: baseline;
    display: grid;
    gap: 8px;
    grid-template-columns: 4.5rem minmax(0, 1fr) auto;
  `,
  label: css`
    color: ${cssVar.colorText};
    font-size: ${cssVar.fontSizeSM};
  `,
  pending: css`
    color: ${cssVar.colorTextTertiary};
  `,
  time: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
  `,
  duration: css`
    color: ${cssVar.colorTextTertiary};
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
  `,
}))

interface Stage {
  duration?: string
  key: 'completed' | 'created' | 'running' | 'started'
  labelKey:
    | 'tasks.timeline.completed'
    | 'tasks.timeline.created'
    | 'tasks.timeline.running'
    | 'tasks.timeline.started'
  state: 'active' | 'done' | 'pending'
  timestamp?: number
}

function relativeDuration(from?: number, to?: number) {
  if (!from || !to) return undefined
  const diff = to - from
  if (diff <= 0) return undefined
  return `+${formatElapsed(diff)}`
}

export function TaskTimeline(props: { task: AITask }) {
  const { t } = useI18n()
  const task = props.task
  const effective = getEffectiveStatus(task)
  const now = Date.now()
  const isFinal =
    task.status === AITaskStatus.Completed ||
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed ||
    task.status === AITaskStatus.Cancelled
  const running =
    effective === AITaskStatus.Running && task.startedAt && !isFinal

  const stages: Stage[] = [
    {
      key: 'created',
      labelKey: 'tasks.timeline.created',
      state: 'done',
      timestamp: task.createdAt,
    },
    {
      duration: relativeDuration(task.createdAt, task.startedAt),
      key: 'started',
      labelKey: 'tasks.timeline.started',
      state: task.startedAt ? 'done' : 'pending',
      timestamp: task.startedAt,
    },
  ]

  if (running) {
    stages.push({
      duration: relativeDuration(task.startedAt, now),
      key: 'running',
      labelKey: 'tasks.timeline.running',
      state: 'active',
    })
  }

  stages.push({
    duration: relativeDuration(
      task.startedAt ?? task.createdAt,
      task.completedAt,
    ),
    key: 'completed',
    labelKey: 'tasks.timeline.completed',
    state: task.completedAt ? 'done' : 'pending',
    timestamp: task.completedAt,
  })

  return (
    <ol className={styles.list}>
      {stages.map((stage) => (
        <li className={styles.item} key={stage.key}>
          <span
            className={
              stage.state === 'pending' ? styles.pending : styles.label
            }
          >
            {stage.state === 'active' ? (
              <Icon icon={Loader2} size="small" spin />
            ) : null}{' '}
            {t(stage.labelKey)}
          </span>
          <span className={styles.time}>
            {stage.timestamp ? formatTaskClock(stage.timestamp) : '--'}
          </span>
          <span className={styles.duration}>{stage.duration ?? ''}</span>
        </li>
      ))}
    </ol>
  )
}
