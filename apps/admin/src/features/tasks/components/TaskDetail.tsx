import {
  ActionIcon,
  Alert,
  Button,
  createStaticStyles,
  type DropdownItem,
  DropdownMenu,
  Progress,
  Tag,
  Text,
} from '@lobehub/ui'
import { Ellipsis, FileText, RotateCcw, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { AITask } from '~/api/tasks'
import { AITaskStatus } from '~/api/tasks'
import { useI18n } from '~/i18n'

import { useTaskCopy } from '../copy'
import {
  canCancelTask,
  canContinueTts,
  canDeleteTask,
  canRetryTask,
  type useTaskActions,
} from '../hooks/use-task-actions'
import { useTaskLabels } from '../hooks/use-task-labels'
import { taskDestinations } from '../utils/task-destinations'
import type { TaskSubject } from '../utils/task-subject'
import { taskLanguages } from '../utils/task-subject'
import {
  formatElapsed,
  formatTaskClock,
  taskElapsedMs,
} from '../utils/task-time'
import { getEffectiveStatus, getProgress, isBatchTask } from '../utils/tasks'
import { CollapsibleSection } from './CollapsibleSection'
import { SubTaskList } from './SubTaskList'
import { SubTaskStatsView } from './SubTaskStatsView'
import { TaskCostBadge } from './TaskCostBadge'
import { TaskLogsBlock } from './TaskLogsBlock'
import { Code, Field, JsonBlock } from './TaskPrimitives'
import { shouldMountTaskStreamPanel, TaskStreamPanel } from './TaskStreamPanel'
import { TaskTimeline } from './TaskTimeline'

const styles = createStaticStyles(({ css, cssVar }) => ({
  body: css`
    display: flex;
    flex-direction: column;
    gap: 20px;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 12px 24px;
  `,
  mono: css`
    font-family: ${cssVar.fontFamilyCode};
    color: ${cssVar.colorTextTertiary};
  `,
  num: css`
    font-variant-numeric: tabular-nums;
  `,
}))

type TaskActions = ReturnType<typeof useTaskActions>

export function TaskDetailActions(props: {
  actions: TaskActions
  task: AITask
}) {
  const copy = useTaskCopy()
  const navigate = useNavigate()
  const { actions, task } = props
  const destinations = taskDestinations(task)
  const retryable = canRetryTask(task)

  const menuItems: DropdownItem[] = [
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
          {
            danger: true,
            icon: Trash2,
            key: 'delete',
            label: copy('deleteTask'),
            onClick: () => actions.remove(task),
          },
        ]
      : []),
  ]

  return (
    <>
      {canContinueTts(task) ? (
        <Button
          loading={actions.continuing}
          onClick={() => actions.continueTts(task)}
        >
          {copy('continueTts')}
        </Button>
      ) : null}
      {retryable ? (
        <Button
          icon={RotateCcw}
          loading={actions.retrying}
          onClick={() => actions.retry(task)}
          type="primary"
        >
          {copy('retry')}
        </Button>
      ) : null}
      {canCancelTask(task) ? (
        <Button
          loading={actions.canceling}
          onClick={() => actions.cancel(task)}
        >
          {copy('cancelTask')}
        </Button>
      ) : null}
      {destinations.articleHref ? (
        <ActionIcon
          aria-label={copy('openArticle')}
          icon={FileText}
          onClick={() => navigate(destinations.articleHref!)}
          title={copy('openArticle')}
        />
      ) : null}
      {menuItems.length > 0 ? (
        <DropdownMenu items={menuItems}>
          <ActionIcon
            aria-label={copy('more')}
            icon={Ellipsis}
            title={copy('more')}
          />
        </DropdownMenu>
      ) : null}
    </>
  )
}

export function TaskDetailMeta(props: { subject: TaskSubject; task: AITask }) {
  const { format, t } = useI18n()
  const labels = useTaskLabels()
  const { subject, task } = props
  const languages = taskLanguages(task)
  const elapsed = taskElapsedMs(task, Date.now())

  return (
    <>
      <span>{labels.type(task.type)}</span>
      {subject.subline ? (
        <span className={styles.mono}>{subject.subline}</span>
      ) : null}
      {languages ? <span>{languages}</span> : null}
      <time
        dateTime={new Date(task.createdAt).toISOString()}
        title={formatTaskClock(task.createdAt)}
      >
        {format.relativeTime(task.createdAt)}
      </time>
      {elapsed !== null ? (
        <span className={styles.num}>{formatElapsed(elapsed)}</span>
      ) : null}
      {task.retryCount > 0 ? (
        <span>{t('tasks.task.retryBadge', { count: task.retryCount })}</span>
      ) : null}
      {isBatchTask(task) ? (
        <Tag size="small">{t('tasks.task.batch')}</Tag>
      ) : null}
      <TaskCostBadge cost={task.cost} />
    </>
  )
}

export function TaskDetail(props: {
  logsLoadFailed: boolean
  logsReloading: boolean
  onReloadLogs: () => void
  polling: boolean
  task: AITask
}) {
  const { format, t } = useI18n()
  const copy = useTaskCopy()
  const { task } = props
  const status = getEffectiveStatus(task)
  const failed =
    status === AITaskStatus.Failed || status === AITaskStatus.PartialFailed
  const running = status === AITaskStatus.Running
  const progress = getProgress(task)

  return (
    <div className={styles.body}>
      {failed ? (
        <Alert
          description={task.error?.trim() || copy('failedNoReason')}
          showIcon
          title={
            status === AITaskStatus.PartialFailed
              ? copy('partialFailedTitle')
              : copy('failedTitle')
          }
          type={task.error?.trim() ? 'error' : 'warning'}
        />
      ) : null}
      {running && progress !== null ? (
        <Progress
          label={task.progressMessage ?? t('tasks.task.progressDefault')}
          percent={Math.round(Math.max(0, Math.min(100, progress)))}
          size="small"
          status="active"
        />
      ) : null}
      {status === AITaskStatus.Pending ? (
        <Text type="secondary">{copy('queuedBody')}</Text>
      ) : null}
      {shouldMountTaskStreamPanel(task) ? (
        <TaskStreamPanel taskId={task.id} />
      ) : null}
      <TaskLogsBlock
        loadFailed={props.logsLoadFailed}
        logs={task.logs}
        onReload={props.onReloadLogs}
        polling={props.polling && running && !props.logsLoadFailed}
        reloading={props.logsReloading}
      />
      <div>
        {task.subTaskStats ? (
          <CollapsibleSection
            defaultOpen={running || failed}
            hint={
              <span className={styles.num}>
                {task.subTaskStats.completed + task.subTaskStats.failed}/
                {task.subTaskStats.total}
              </span>
            }
            title={copy('subTasks')}
          >
            <SubTaskStatsView task={task} />
            <SubTaskList groupId={task.id} />
          </CollapsibleSection>
        ) : null}
        {task.result !== undefined && task.result !== null ? (
          <CollapsibleSection
            defaultOpen={!failed && !running}
            title={copy('result')}
          >
            <JsonBlock value={task.result} />
          </CollapsibleSection>
        ) : null}
        <CollapsibleSection title={copy('parameters')}>
          <JsonBlock value={task.payload} />
        </CollapsibleSection>
        <CollapsibleSection title={copy('timeline')}>
          <TaskTimeline task={task} />
        </CollapsibleSection>
        <CollapsibleSection title={copy('record')}>
          <div className={styles.grid}>
            <Field label={t('tasks.task.id')}>
              <Code>{task.id}</Code>
            </Field>
            <Field label={t('tasks.task.worker')}>
              {task.workerId ?? '--'}
            </Field>
            <Field label={t('tasks.task.totalItems')}>
              {task.totalItems ?? '--'}
            </Field>
            <Field label={t('tasks.task.completedItems')}>
              {task.completedItems ?? '--'}
            </Field>
            {task.tokensGenerated ? (
              <Field label={copy('tokens')}>
                <span className={styles.num}>
                  {format.number(task.tokensGenerated)}
                </span>
              </Field>
            ) : null}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
