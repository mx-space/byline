import {
  Alert,
  createStaticStyles,
  cx,
  Empty,
  Segmented,
  Tag,
} from '@lobehub/ui'
import { TableSkeleton } from '@lobehub/ui/dashboard'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { useQuery } from '@tanstack/react-query'
import { ListTodo, Trash2 } from 'lucide-react'
import { type HTMLAttributes, type ReactNode, useMemo } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router'

import type { AITask } from '~/api/tasks'
import { getTasks } from '~/api/tasks'
import { useUrlListState } from '~/features/_shared/hooks/use-url-list-state'
import {
  activeTasksQuery,
  failedTasksQuery,
} from '~/features/dashboard/queries'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { readSingleFilter } from '~/ui/data/table-header'
import { Page } from '~/ui/page'
import {
  pinEnd,
  pinStart,
  recordTableScroll,
  recordTableStyles,
  useRecordTable,
} from '~/ui/record-table'
import { Button } from '~/ui/site-button'

import type { TaskStatusCategory } from '../constants'
import {
  fallbackPollingIntervalMs,
  filterableTaskTypes,
  liveSubscribeIntervalMs,
  pageSize,
  statusCategoryStatuses,
  statusSegmentValues,
} from '../constants'
import { useTaskCopy } from '../copy'
import { useTaskActions } from '../hooks/use-task-actions'
import { useTaskLabels } from '../hooks/use-task-labels'
import { useTaskSubjects } from '../hooks/use-task-subjects'
import { useTaskListSubscription } from '../hooks/useTaskSubscription'
import { formatElapsed, taskElapsedMs } from '../utils/task-time'
import {
  readPositivePage,
  readTaskStatusFilter,
  readTaskTypeFilter,
} from '../utils/tasks'
import {
  cellStyles,
  TaskResultCell,
  TaskRowActions,
  TaskStatusTag,
  TaskSubjectCell,
  TaskTimeCell,
} from './TaskCells'

const styles = createStaticStyles(({ css, cssVar }) => ({
  count: css`
    margin-inline-start: 6px;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  countDanger: css`
    margin-inline-start: 6px;
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorError};
  `,
  selected: css`
    > td {
      background: ${cssVar.colorFillTertiary};
    }
  `,
  filters: css`
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    min-width: 0;
  `,
}))

const ALL_STATUS = '__all__'
const TASKS_BASE_PATH = '/tasks'

interface TasksUrlState {
  page: number
  status: TaskStatusCategory | ''
  type: string
}

function writeTasksUrlState(state: TasksUrlState) {
  const params = new URLSearchParams()
  if (state.page > 1) params.set('page', String(state.page))
  if (state.status) params.set('status', state.status)
  if (state.type) params.set('type', state.type)
  return params
}

const urlStateOptions = {
  read: (searchParams: URLSearchParams): TasksUrlState => ({
    page: readPositivePage(searchParams.get('page')),
    status: readTaskStatusFilter(searchParams.get('status')),
    type: readTaskTypeFilter(searchParams.get('type')),
  }),
  write: writeTasksUrlState,
}

function isInteractiveTarget(target: EventTarget) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'a,button,input,label,[role="menuitem"],[data-row-actions]',
      ),
    )
  )
}

export function TasksRouteView() {
  const { format, t } = useI18n()
  const copy = useTaskCopy()
  const table = useRecordTable()
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const labels = useTaskLabels()
  const actions = useTaskActions()
  const [listState, setListState] = useUrlListState(urlStateOptions)
  const { page, status, type } = listState

  const queryParams = {
    page,
    size: pageSize,
    status: status ? statusCategoryStatuses[status] : undefined,
    type: type || undefined,
  }

  const { socketConnected } = useTaskListSubscription()
  const tasksQuery = useQuery({
    placeholderData: (previous) => previous,
    queryFn: () => getTasks(queryParams),
    queryKey: adminQueryKeys.tasks.tasks(queryParams),
    refetchInterval: () =>
      socketConnected ? liveSubscribeIntervalMs : fallbackPollingIntervalMs,
  })
  const failedQuery = useQuery(failedTasksQuery)
  const activeQuery = useQuery(activeTasksQuery)

  const tasks = useMemo(() => tasksQuery.data?.data ?? [], [tasksQuery.data])
  const total = tasksQuery.data?.total ?? 0
  const subjectOf = useTaskSubjects(tasks)
  const failedTotal = failedQuery.data?.total ?? 0
  const activeTotal = activeQuery.data?.total ?? 0

  const listSearch = writeTasksUrlState(listState).toString()
  const openTask = (id: string) =>
    navigate({
      pathname: `${TASKS_BASE_PATH}/${id}`,
      search: listSearch ? `?${listSearch}` : '',
    })

  const segmentLabel = (value: (typeof statusSegmentValues)[number]) => {
    if (value === '') return copy('statusAll')
    if (value === 'completed') return copy('statusCompleted')
    const count = type ? null : value === 'failed' ? failedTotal : activeTotal
    return (
      <span>
        {value === 'failed' ? copy('statusFailed') : copy('statusActive')}
        {count ? (
          <span
            className={value === 'failed' ? styles.countDanger : styles.count}
          >
            {format.number(count)}
          </span>
        ) : null}
      </span>
    )
  }

  const columns: ProColumns<AITask>[] = [
    {
      dataIndex: 'payload',
      render: (_dom, task) => <TaskSubjectCell subject={subjectOf(task)} />,
      title: copy('columnSubject'),
      ...pinStart(table.pin),
    },
    {
      dataIndex: 'type',
      filterMultiple: false,
      filterSearch: filterableTaskTypes.length > 7,
      filteredValue: type ? [type] : null,
      filters: filterableTaskTypes.map((value) => ({
        text: labels.type(value),
        value,
      })),
      onFilter: false,
      render: (_dom, task) => <Tag>{labels.type(task.type)}</Tag>,
      responsive: ['md'],
      title: copy('columnType'),
      width: 128,
    },
    {
      dataIndex: 'status',
      render: (_dom, task) => <TaskStatusTag task={task} />,
      title: copy('columnStatus'),
      width: 112,
    },
    {
      dataIndex: 'progress',
      render: (_dom, task) => <TaskResultCell task={task} />,
      responsive: ['lg'],
      title: copy('columnResult'),
      width: 160,
    },
    {
      dataIndex: 'createdAt',
      render: (_dom, task) => <TaskTimeCell timestamp={task.createdAt} />,
      responsive: ['md'],
      title: copy('columnCreated'),
      width: 128,
    },
    {
      dataIndex: 'completedAt',
      render: (_dom, task) => (
        <span className={cellStyles.time}>
          {formatElapsed(taskElapsedMs(task, Date.now()))}
        </span>
      ),
      responsive: ['lg'],
      title: copy('columnElapsed'),
      width: 112,
    },
    {
      align: 'right',
      key: 'actions',
      render: (_dom, task) => (
        <TaskRowActions
          onCancel={actions.cancel}
          onDelete={actions.remove}
          onRetry={actions.retry}
          retrying={actions.retryingId === task.id}
          task={task}
        />
      ),
      title: '',
      width: 140,
      ...pinEnd(table.pin),
    },
  ]

  const filtered = Boolean(status || type)
  const initialLoading = tasksQuery.isLoading && tasks.length === 0
  const showStale = tasksQuery.isError && tasks.length > 0

  let emptyNode: ReactNode
  if (tasksQuery.isError) {
    emptyNode = (
      <Empty
        action={
          <Button onClick={() => void tasksQuery.refetch()}>
            {copy('reload')}
          </Button>
        }
        description={copy('listLoadBody')}
        icon={ListTodo}
        title={copy('listLoadTitle')}
      />
    )
  } else if (status === 'failed' && !type) {
    emptyNode = <Empty icon={ListTodo} title={copy('emptyFailedTitle')} />
  } else if (filtered) {
    emptyNode = (
      <Empty
        action={
          <Button
            onClick={() => setListState({ page: 1, status: '', type: '' })}
          >
            {copy('clearFilters')}
          </Button>
        }
        icon={ListTodo}
        title={copy('filteredTitle')}
      />
    )
  } else {
    emptyNode = (
      <Empty
        description={copy('emptyBody')}
        icon={ListTodo}
        title={copy('emptyTitle')}
      />
    )
  }

  return (
    <Page
      actions={
        <Button
          icon={Trash2}
          loading={actions.clearing}
          onClick={() =>
            actions.clearCompleted(
              type || undefined,
              type ? labels.type(type) : undefined,
            )
          }
          type="text"
        >
          {copy('clearCompleted')}
        </Button>
      }
      count={tasksQuery.data ? format.number(total) : undefined}
      description={copy('pageDescription')}
      title={t('routes.tasks.title')}
      width="wide"
    >
      {failedTotal > 0 && status !== 'failed' ? (
        <Alert
          action={
            <Button
              onClick={() =>
                setListState({ page: 1, status: 'failed', type: '' })
              }
              size="small"
            >
              {copy('viewFailed')}
            </Button>
          }
          showIcon
          title={copy('failedBanner', { count: failedTotal })}
          type="error"
        />
      ) : null}
      {showStale ? (
        <Alert
          action={
            <Button onClick={() => void tasksQuery.refetch()} size="small">
              {copy('reload')}
            </Button>
          }
          showIcon
          title={copy('listStale')}
          type="warning"
        />
      ) : null}
      <ProTable<AITask>
        className={recordTableStyles.root}
        columnEmptyText="--"
        columns={columns}
        scroll={recordTableScroll(columns, table)}
        tableLayout="fixed"
        dataSource={tasks}
        onChange={(_pagination, filters, _sorter, extra) => {
          if (extra.action !== 'filter') return
          const next = readSingleFilter(filters, 'type')
          setListState((current) => ({
            ...current,
            page: 1,
            type: next && filterableTaskTypes.includes(next) ? next : '',
          }))
        }}
        loading={
          tasksQuery.isFetching &&
          !initialLoading &&
          tasksQuery.isPlaceholderData
        }
        locale={{ emptyText: emptyNode }}
        onRow={(task) =>
          ({
            'data-id': task.id,
            'data-scope-item': 'row',
            onClick: (event) => {
              if (isInteractiveTarget(event.target)) return
              openTask(task.id)
            },
          }) as HTMLAttributes<HTMLElement>
        }
        options={{
          density: false,
          fullScreen: false,
          reload: () => void tasksQuery.refetch(),
          search: false,
          setting: false,
        }}
        pagination={{
          current: page,
          hideOnSinglePage: true,
          onChange: (nextPage) => setListState({ page: nextPage }),
          pageSize,
          showSizeChanger: false,
          total,
        }}
        rowClassName={(task) =>
          cx(cellStyles.row, task.id === params.id && styles.selected)
        }
        rowKey="id"
        search={false}
        tableRender={(_props, dom) =>
          initialLoading ? <TableSkeleton rows={8} /> : dom
        }
        toolBarRender={() => [
          <div className={styles.filters} key="filters">
            <Segmented
              aria-label={copy('statusFilter')}
              onChange={(value) =>
                setListState((current) => ({
                  ...current,
                  page: 1,
                  status:
                    value === ALL_STATUS ? '' : (value as TaskStatusCategory),
                }))
              }
              options={statusSegmentValues.map((value) => ({
                label: segmentLabel(value),
                value: value || ALL_STATUS,
              }))}
              value={status || ALL_STATUS}
            />
            {socketConnected ? null : <Tag>{copy('livePaused')}</Tag>}
          </div>,
        ]}
        variant="outlined"
      />
      <Outlet />
    </Page>
  )
}

export default TasksRouteView
