import { Alert, createStaticStyles, Progress } from '@lobehub/ui'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'

import type { AITask } from '~/api/tasks'
import { getTasksByGroupId } from '~/api/tasks'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/site-button'

import { taskStatusLabelKeys } from '../constants'
import { useTaskCopy } from '../copy'
import { useTaskGroupSubscription } from '../hooks/useTaskSubscription'
import { getProgress } from '../utils/tasks'
import { TaskCostBadge } from './TaskCostBadge'
import { StatusBadge } from './TaskPrimitives'

const styles = createStaticStyles(({ css, cssVar }) => ({
  list: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
  `,
  row: css`
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: ${cssVar.borderRadius};
    color: ${cssVar.colorText};
    cursor: pointer;
    display: flex;
    gap: 8px;
    padding: 8px;
    text-align: start;
    width: 100%;

    &:hover {
      background: ${cssVar.colorFillSecondary};
    }
  `,
  lang: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  progress: css`
    flex: 1;
    min-width: 4rem;
  `,
  meta: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    margin-inline-start: auto;
  `,
  note: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    margin: 0;
  `,
}))

export function SubTaskList(props: { groupId: string }) {
  const copy = useTaskCopy()
  const navigate = useNavigate()
  const location = useLocation()

  useTaskGroupSubscription(props.groupId)

  const childrenQuery = useQuery({
    queryFn: () => getTasksByGroupId(props.groupId),
    queryKey: adminQueryKeys.tasks.tasksByGroup(props.groupId),
  })

  if (childrenQuery.isPending) {
    return <p className={styles.note}>{copy('subtaskLoading')}</p>
  }

  if (childrenQuery.isError) {
    return (
      <Alert
        action={
          <Button onClick={() => void childrenQuery.refetch()} size="small">
            {copy('subtaskReload')}
          </Button>
        }
        title={copy('subtaskLoadTitle')}
        type="error"
      />
    )
  }

  const children = childrenQuery.data ?? []
  if (children.length === 0) {
    return <p className={styles.note}>{copy('subtaskEmpty')}</p>
  }

  return (
    <ul className={styles.list}>
      {children.map((child) => (
        <li key={child.id}>
          <SubTaskRow
            onOpen={() =>
              navigate({
                pathname: `/tasks/${child.id}`,
                search: location.search,
              })
            }
            task={child}
          />
        </li>
      ))}
    </ul>
  )
}

function SubTaskRow(props: { onOpen: () => void; task: AITask }) {
  const { t } = useI18n()
  const progress = getProgress(props.task)
  return (
    <button className={styles.row} onClick={props.onOpen} type="button">
      <span className={styles.lang}>
        {childLang(props.task, t('tasks.subTaskList.untitledLang'))}
      </span>
      <StatusBadge status={props.task.status}>
        {t(taskStatusLabelKeys[props.task.status])}
      </StatusBadge>
      {progress !== null ? (
        <div className={styles.progress}>
          <Progress
            percent={Math.max(0, Math.min(100, progress))}
            showInfo={false}
            size="small"
          />
        </div>
      ) : null}
      <span className={styles.meta}>
        {props.task.tokensGenerated && props.task.tokensGenerated > 0
          ? t('tasks.task.tokensGenerated', {
              count: props.task.tokensGenerated,
            })
          : null}
      </span>
      <TaskCostBadge cost={props.task.cost} />
    </button>
  )
}

function childLang(task: AITask, fallback: string) {
  const payload = task.payload as { lang?: unknown; targetLanguages?: unknown }
  if (typeof payload.lang === 'string' && payload.lang) return payload.lang
  if (Array.isArray(payload.targetLanguages)) {
    const langs = payload.targetLanguages.filter(
      (value): value is string => typeof value === 'string',
    )
    if (langs.length > 0) return langs.join(', ')
  }
  return fallback
}
