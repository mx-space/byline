import {
  ActionIcon,
  createStaticStyles,
  type DropdownItem,
  DropdownMenu,
  Progress,
  Tag,
  Text,
  Tooltip,
} from '@lobehub/ui'
import { Ellipsis, FileText, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { AITask } from '~/api/tasks'
import { AITaskStatus } from '~/api/tasks'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/site-button'

import { useTaskCopy } from '../copy'
import {
  canCancelTask,
  canDeleteTask,
  canRetryTask,
} from '../hooks/use-task-actions'
import { useTaskLabels } from '../hooks/use-task-labels'
import { taskDestinations } from '../utils/task-destinations'
import type { TaskSubject } from '../utils/task-subject'
import { formatTaskClock } from '../utils/task-time'
import {
  getEffectiveStatus,
  getProgress,
  getTaskProgressLabel,
} from '../utils/tasks'

export const cellStyles = createStaticStyles(({ css, cssVar }) => ({
  actions: css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  `,
  hoverActions: css`
    display: flex;
    align-items: center;
    gap: 2px;
  `,
  error: css`
    color: ${cssVar.colorErrorText};
  `,
  progress: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    max-width: 16rem;
  `,
  row: css`
    cursor: pointer;
  `,
  subjectCell: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `,
  subjectId: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  subjectTitle: css`
    overflow: hidden;

    font-weight: 500;
    color: ${cssVar.colorText};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  subline: css`
    overflow: hidden;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  time: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextSecondary};
    white-space: nowrap;
  `,
}))

export function TaskSubjectCell(props: { subject: TaskSubject }) {
  const { subject } = props
  return (
    <div className={cellStyles.subjectCell}>
      <span
        className={
          subject.titleIsId ? cellStyles.subjectId : cellStyles.subjectTitle
        }
        title={subject.title}
      >
        {subject.title}
      </span>
      {subject.subline ? (
        <span className={cellStyles.subline} title={subject.subline}>
          {subject.subline}
        </span>
      ) : null}
    </div>
  )
}

export function TaskStatusTag(props: { task: AITask }) {
  const labels = useTaskLabels()
  const status = labels.status(props.task)
  return <Tag color={status.color}>{status.label}</Tag>
}

export function TaskResultCell(props: { task: AITask }) {
  const { t } = useI18n()
  const copy = useTaskCopy()
  const { task } = props
  const status = getEffectiveStatus(task)

  if (status === AITaskStatus.Failed || status === AITaskStatus.PartialFailed) {
    const failedItems = task.subTaskStats?.failed ?? 0
    const reason =
      task.error?.trim() ||
      (failedItems > 0
        ? copy('failedItems', { count: failedItems })
        : copy('noReasonShort'))
    return (
      <Text
        className={cellStyles.error}
        ellipsis={{ rows: 2, tooltip: reason }}
      >
        {reason}
      </Text>
    )
  }

  if (status === AITaskStatus.Running) {
    const progress = getProgress(task)
    const label = task.progressMessage || getTaskProgressLabel(task)
    return (
      <div className={cellStyles.progress}>
        {progress !== null ? (
          <Progress
            percent={Math.round(Math.max(0, Math.min(100, progress)))}
            size="small"
            status="active"
          />
        ) : null}
        {label ? (
          <Text ellipsis={{ tooltip: label }} type="secondary">
            {label}
          </Text>
        ) : null}
      </div>
    )
  }

  if (status === AITaskStatus.Pending) {
    return <Text type="secondary">{copy('queued')}</Text>
  }

  const done = getTaskProgressLabel(task)
  if (done) return <span className={cellStyles.time}>{done}</span>
  if (task.tokensGenerated && task.tokensGenerated > 0) {
    return (
      <Text type="secondary">
        {t('tasks.task.tokensGenerated', { count: task.tokensGenerated })}
      </Text>
    )
  }
  return <Text type="secondary">--</Text>
}

export function TaskTimeCell(props: { timestamp?: number }) {
  const { format } = useI18n()
  if (!props.timestamp) return <span className={cellStyles.time}>--</span>
  return (
    <Tooltip title={formatTaskClock(props.timestamp)}>
      <time
        className={cellStyles.time}
        dateTime={new Date(props.timestamp).toISOString()}
      >
        {format.relativeTime(props.timestamp)}
      </time>
    </Tooltip>
  )
}

export function TaskRowActions(props: {
  onCancel: (task: AITask) => void
  onDelete: (task: AITask) => void
  onRetry: (task: AITask) => void
  retrying: boolean
  task: AITask
}) {
  const copy = useTaskCopy()
  const navigate = useNavigate()
  const { task } = props
  const destinations = taskDestinations(task)
  const failed =
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed

  const menuItems: DropdownItem[] = [
    ...(destinations.articleHref
      ? [
          {
            icon: FileText,
            key: 'article',
            label: copy('openArticle'),
            onClick: () => navigate(destinations.articleHref!),
          },
        ]
      : []),
    ...(destinations.artifactHref && destinations.artifactKey
      ? [
          {
            key: 'artifact',
            label: copy(destinations.artifactKey),
            onClick: () => navigate(destinations.artifactHref!),
          },
        ]
      : []),
    ...(canDeleteTask(task)
      ? [
          ...(destinations.articleHref || destinations.artifactHref
            ? [{ type: 'divider' as const }]
            : []),
          {
            danger: true,
            icon: Trash2,
            key: 'delete',
            label: copy('deleteTask'),
            onClick: () => props.onDelete(task),
          },
        ]
      : []),
  ]

  return (
    <div className={cellStyles.actions}>
      {failed ? (
        <Button
          icon={RotateCcw}
          loading={props.retrying}
          onClick={() => props.onRetry(task)}
          size="small"
        >
          {copy('retry')}
        </Button>
      ) : null}
      <div className={cellStyles.hoverActions} data-row-actions="">
        {!failed && canRetryTask(task) ? (
          <ActionIcon
            aria-label={copy('retry')}
            icon={RotateCcw}
            onClick={() => props.onRetry(task)}
            size="small"
            title={copy('retry')}
          />
        ) : null}
        {canCancelTask(task) ? (
          <ActionIcon
            aria-label={copy('cancelTask')}
            icon={Square}
            onClick={() => props.onCancel(task)}
            size="small"
            title={copy('cancelTask')}
          />
        ) : null}
        {menuItems.length > 0 ? (
          <DropdownMenu items={menuItems}>
            <ActionIcon
              aria-label={copy('more')}
              icon={Ellipsis}
              size="small"
              title={copy('more')}
            />
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  )
}
