import {
  Alert,
  createStaticStyles,
  Drawer,
  Flexbox,
  Skeleton,
  Text,
} from '@lobehub/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { ApiRequestError } from '~/api/http'
import { findInListCache } from '~/api/list-cache'
import type { AITask } from '~/api/tasks'
import { AITaskType, getTask } from '~/api/tasks'
import { useDocumentTitle } from '~/hooks/use-document-title'
import { adminQueryKeys } from '~/query/keys'
import { DetailPane } from '~/ui/page'
import { Button } from '~/ui/site-button'

import {
  fallbackPollingIntervalMs,
  liveSubscribeIntervalMs,
  tasksQueryKey,
} from '../constants'
import { useTaskCopy } from '../copy'
import { useTaskActions } from '../hooks/use-task-actions'
import { useTaskSubjects } from '../hooks/use-task-subjects'
import {
  useTaskDetailSubscription,
  useTaskGroupSubscription,
} from '../hooks/useTaskSubscription'
import { getErrorMessage } from '../utils/tasks'
import { TaskStatusTag } from './TaskCells'
import { TaskDetail, TaskDetailActions, TaskDetailMeta } from './TaskDetail'

const styles = createStaticStyles(({ css }) => ({
  body: css`
    height: 100%;
    padding: 0;
  `,
  state: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
  `,
  tag: css`
    flex-shrink: 0;
  `,
}))

const GROUP_PARENT_TYPES = new Set<AITaskType>([
  AITaskType.TranslationBatch,
  AITaskType.TranslationAll,
])

export function TaskDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const copy = useTaskCopy()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const close = () => navigate({ pathname: '/tasks', search: location.search })
  const actions = useTaskActions({ onDeleted: close })

  const initialTask = id
    ? findInListCache<AITask>(queryClient, tasksQueryKey, id)
    : undefined

  const { socketConnected } = useTaskDetailSubscription(id)
  const taskQuery = useQuery({
    enabled: Boolean(id),
    initialData: initialTask,
    queryFn: () => getTask(id!),
    queryKey: adminQueryKeys.tasks.taskDetail(id ?? ''),
    refetchInterval: () =>
      socketConnected ? liveSubscribeIntervalMs : fallbackPollingIntervalMs,
    staleTime: initialTask ? 5_000 : 0,
  })
  const task = taskQuery.data

  useTaskGroupSubscription(
    id && task && GROUP_PARENT_TYPES.has(task.type) ? id : null,
  )

  const subjectOf = useTaskSubjects(task ? [task] : [])
  const subject = task ? subjectOf(task) : null

  useDocumentTitle(subject?.title ?? copy('drawerTitle'))

  if (!id) return null

  let title: ReactNode = copy('drawerTitle')
  let footer: ReactNode
  let content
  if (task && subject) {
    title = (
      <Flexbox align="center" gap={8} horizontal style={{ minWidth: 0 }}>
        <Text
          ellipsis={{ tooltipWhenOverflow: true }}
          style={{ flex: '0 1 auto', minWidth: 0 }}
        >
          {subject.title}
        </Text>
        <span className={styles.tag}>
          <TaskStatusTag task={task} />
        </span>
      </Flexbox>
    )
    footer = (
      <Flexbox gap={8} horizontal justify="flex-end">
        <TaskDetailActions actions={actions} task={task} />
      </Flexbox>
    )
    content = (
      <DetailPane contentWidth="full" hideHeader>
        <Flexbox gap={12} horizontal wrap="wrap">
          <TaskDetailMeta subject={subject} task={task} />
        </Flexbox>
        <TaskDetail
          logsLoadFailed={taskQuery.isError || !Array.isArray(task.logs)}
          logsReloading={taskQuery.isFetching}
          onReloadLogs={() => void taskQuery.refetch()}
          polling={!taskQuery.isPaused}
          task={task}
        />
      </DetailPane>
    )
  } else if (taskQuery.isPending) {
    content = (
      <DetailPane hideHeader>
        <div aria-busy="true" aria-label={copy('loadingDetail')}>
          <Skeleton.Text rows={4} width={['30%', '55%', '80%', '60%']} />
        </div>
      </DetailPane>
    )
  } else {
    const missing =
      taskQuery.error instanceof ApiRequestError &&
      taskQuery.error.status === 404
    footer = (
      <Flexbox horizontal justify="flex-end">
        {missing ? (
          <Button onClick={close}>{copy('backToList')}</Button>
        ) : (
          <Button
            loading={taskQuery.isFetching}
            onClick={() => void taskQuery.refetch()}
          >
            {copy('reload')}
          </Button>
        )}
      </Flexbox>
    )
    content = (
      <DetailPane hideHeader>
        <div className={styles.state}>
          <Alert
            description={
              missing
                ? copy('taskMissingBody')
                : getErrorMessage(taskQuery.error, '') || copy('taskLoadBody')
            }
            showIcon
            title={missing ? copy('taskMissingTitle') : copy('taskLoadTitle')}
            type="error"
          />
        </div>
      </DetailPane>
    )
  }

  return (
    <Drawer
      classNames={{ bodyContent: styles.body }}
      footer={footer}
      onClose={close}
      open
      placement="right"
      title={title}
      width="min(100vw, 44rem)"
    >
      {content}
    </Drawer>
  )
}

export default TaskDetailRoute
