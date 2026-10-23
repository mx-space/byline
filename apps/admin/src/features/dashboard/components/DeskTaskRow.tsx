import {
  Button,
  createStaticStyles,
  cssVar,
  Progress,
  Tag,
  Text,
} from '@lobehub/ui'
import { RotateCcw } from 'lucide-react'

import type { AITask } from '~/api/tasks'
import { useTaskLabels } from '~/features/tasks/hooks/use-task-labels'
import type { TaskSubject } from '~/features/tasks/utils/task-subject'
import { getProgress } from '~/features/tasks/utils/tasks'
import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { displayDeskTime, taskRecordPath } from '../utils/desk'
import { DeskRecordLink } from './DeskRecordLink'

const styles = createStaticStyles(({ css }) => ({
  progress: css`
    width: 7.5rem;
  `,
}))

export function DeskTaskRow(props: {
  category: 'failed' | 'active'
  onRetry?: (task: AITask) => void
  retrying?: boolean
  subject: TaskSubject
  task: AITask
}) {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const labels = useTaskLabels()
  const { task } = props
  const status = labels.status(task)
  const progress = props.category === 'active' ? getProgress(task) : null
  const error =
    props.category === 'failed'
      ? task.error?.trim() || copy('failureNoReason')
      : null

  return (
    <DeskRecordLink
      actions={
        props.onRetry ? (
          <Button
            icon={RotateCcw}
            loading={props.retrying}
            onClick={() => props.onRetry?.(task)}
            size="small"
          >
            {copy('retry')}
          </Button>
        ) : null
      }
      meta={
        <>
          <Tag size="small">{labels.type(task.type)}</Tag>
          {props.category === 'active' ? (
            progress !== null ? (
              <Progress
                percent={Math.round(Math.max(0, Math.min(100, progress)))}
                size="small"
                className={styles.progress}
                status="active"
              />
            ) : (
              <Tag color={status.color} size="small">
                {status.label}
              </Tag>
            )
          ) : null}
          <Text as="span" type="secondary">
            {displayDeskTime(format.relativeTime(task.createdAt))}
          </Text>
        </>
      }
      subtitle={
        error ? (
          <Text
            as="span"
            color={cssVar.colorErrorText}
            ellipsis={{ tooltip: error }}
          >
            {error}
          </Text>
        ) : props.subject.subline ? (
          <Text as="span" ellipsis type="secondary">
            {props.subject.subline}
          </Text>
        ) : null
      }
      title={props.subject.title}
      to={taskRecordPath(task.id, props.category)}
    />
  )
}
