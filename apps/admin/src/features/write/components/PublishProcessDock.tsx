import { createStaticStyles } from '@lobehub/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'

import type {
  PublishAiMode,
  PublishAiResource,
  PublishTask,
} from '~/api/publish-jobs'
import {
  AITaskStatus,
  cancelTask,
  getTask,
  getTasks,
  retryTask,
} from '~/api/tasks'
import { CAPABILITY_META } from '~/features/ai/components/article-overview/capability-meta'
import {
  fallbackPollingIntervalMs,
  liveSubscribeIntervalMs,
  statusIcon,
} from '~/features/tasks/constants'
import {
  useTaskDetailSubscription,
  useTaskListSubscription,
} from '~/features/tasks/hooks/useTaskSubscription'
import {
  getProgress,
  getTaskProgressLabel,
  statusIconClassName,
} from '~/features/tasks/utils/tasks'
import { useLocalStorageState } from '~/hooks/use-local-storage-state'
import { useI18n } from '~/i18n'
import type { TranslationKey } from '~/i18n/types'
import { adminQueryKeys } from '~/query/keys'
import { confirmDialog } from '~/ui/feedback/confirm'
import { Popover } from '~/ui/overlay/popover'
import { Button } from '~/ui/primitives/button'
import { cn } from '~/utils/cn'

import { normalizeTaskAiResources } from './publish-ai-choices'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u88cee038: css`
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 1090;
    @media (max-width: 639px) {
      left: 1rem;
    }
  `,
  ufbf144d6: css`
    display: flex;
    height: 2.5rem;
    max-width: min(24rem, calc(100vw-2rem));
    align-items: center;
    gap: 0.5rem;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgElevated};
    padding-inline: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    box-shadow: ${cssVar.boxShadow};
    &:hover {
      background-color: ${cssVar.colorBgContainer};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px ${cssVar.colorPrimary};
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px
        color-mix(in srgb, ${cssVar.colorPrimary} 20%, transparent);
    }
  `,
  u37af38f0: css`
    border-color: color-mix(in srgb, ${cssVar.colorError} 40%, transparent);
  `,
  u9c0b6bca: css`
    border-color: color-mix(in srgb, ${cssVar.colorWarning} 40%, transparent);
  `,
  uc39c8d01: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  `,
  u87043da0: css`
    @keyframes byline-spin {
      to {
        transform: rotate(360deg);
      }
    }
    animation: byline-spin 1s linear infinite;
    color: ${cssVar.colorPrimary};
  `,
  uab398374: css`
    color: ${cssVar.colorSuccess};
  `,
  ue3f51cc6: css`
    color: ${cssVar.colorError};
  `,
  u1dd48761: css`
    color: ${cssVar.colorWarning};
  `,
  u26f463c1: css`
    min-width: 0px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  uab0d95e4: css`
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
  uccc0332d: css`
    border-radius: 999px;
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.375rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
  ufe06b4ad: css`
    max-height: min(72svh, 38rem);
    overflow: hidden;
  `,
  u6b07d529: css`
    height: 1.5rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    text-transform: none;
    letter-spacing: 0;
  `,
  u652c57ab: css`
    max-height: min(64svh, 34rem);
    overflow-y: auto;
    padding: 0px;
  `,
  u4de95a9e: css`
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding: 0.75rem;
    &:last-child {
      border-bottom-width: 0px;
      border-style: solid;
    }
  `,
  u7f362f39: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  ua989b332: css`
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    &:hover {
      color: ${cssVar.colorPrimary};
    }
    &:hover {
      text-decoration: underline;
    }
  `,
  u299f1ccb: css`
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  `,
  ubc7a44c0: css`
    margin-top: 0.125rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  uba2fb302: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
  `,
  u85decade: css`
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorError};
    &:hover {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorError} 10%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  uee129b1d: css`
    height: 1.75rem;
    padding-inline: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  ucc46d0fa: css`
    width: 1.75rem;
    height: 1.75rem;
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u4e79a06b: css`
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `,
  ub9e7a36d: css`
    height: 0.25rem;
    flex: 1 1 0%;
    overflow: hidden;
    border-radius: 999px;
    background-color: ${cssVar.colorBorderSecondary};
  `,
  ua1b304df: css`
    height: 100%;
    border-radius: 999px;
    background-color: ${cssVar.colorPrimary};
    transition-property: width;
    transition-duration: 300ms;
  `,
  u7aa79040: css`
    background-color: ${cssVar.colorError};
  `,
  u931bc423: css`
    background-color: ${cssVar.colorWarning};
  `,
  uf5cf4f7d: css`
    width: 2.25rem;
    text-align: right;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
  u67dcaedf: css`
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 1px;
  `,
  u7af16148: css`
    margin-top: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ub54dff1e: css`
    margin-top: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    overflow-wrap: break-word;
    color: ${cssVar.colorError};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  ucd74c6f0: css`
    margin-top: 0.5rem;
    border-radius: 10px;
    border-width: 1px;
    border-style: solid;
    border-color: color-mix(in srgb, ${cssVar.colorWarning} 25%, transparent);
    background-color: color-mix(
      in srgb,
      ${cssVar.colorWarning} 8%,
      transparent
    );
    padding-inline: 0.625rem;
    padding-block: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    line-height: 1.25rem;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  u7c244cbe: css`
    margin-left: 0.25rem;
    font-weight: 500;
    text-decoration: underline;
  `,
  u10d812d3: css`
    display: flex;
    height: 2rem;
    align-items: center;
    gap: 0.5rem;
    border-radius: 8px;
    padding-inline: 0.625rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    &:hover {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  u145dbbb5: css`
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  u67bab313: css`
    min-width: 0px;
    flex: 1 1 0%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  ub18bd739: css`
    flex-shrink: 0;
    color: ${cssVar.colorTextTertiary};
  `,
  u99909601: css`
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    align-items: center;
    justify-content: center;
    color: ${cssVar.colorTextTertiary};
    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  u783b0d9d: css`
    width: 0.875rem;
    height: 0.875rem;
  `,
  uc575e3ee: css`
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    color: ${cssVar.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
}))

type PublishProcessPhase =
  | 'cancelled'
  | 'completed'
  | 'failed'
  | 'partial'
  | 'preparing'
  | 'publishing'
  | 'queued'

const phaseLabelKeys: Record<PublishProcessPhase, TranslationKey> = {
  cancelled: 'write.publishProcess.cancelled',
  completed: 'write.publishProcess.completed',
  failed: 'write.publishProcess.failed',
  partial: 'write.publishProcess.onlineUpdatedWithAiFailure',
  preparing: 'write.publishProcess.preparing',
  publishing: 'write.publishProcess.publishing',
  queued: 'write.publishProcess.queued',
}

const queryParams = {
  page: 1,
  scope: 'content' as const,
  size: 20,
  type: 'content:publish',
}
const DISMISSED_PUBLISH_TASKS_KEY = 'dismissed-publish-task-ids'
const AUTO_DISMISS_COMPLETED_MS = 8000

export function openPublishProcessDock() {
  window.dispatchEvent(new Event('mx-admin:open-publish-dock'))
}

export function PublishProcessDock() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [dismissedIds, setDismissedIds] = useLocalStorageState<string[]>(
    DISMISSED_PUBLISH_TASKS_KEY,
    [],
  )
  const dismissed = useMemo(() => new Set(dismissedIds), [dismissedIds])
  const dismissedIdsRef = useRef(dismissedIds)
  dismissedIdsRef.current = dismissedIds
  const { socketConnected } = useTaskListSubscription()
  const tasksQuery = useQuery({
    queryFn: () => getTasks<PublishTask>(queryParams),
    queryKey: adminQueryKeys.tasks.tasks(queryParams),
    refetchInterval: () =>
      socketConnected ? liveSubscribeIntervalMs : fallbackPollingIntervalMs,
  })

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener('mx-admin:open-publish-dock', show)
    return () => window.removeEventListener('mx-admin:open-publish-dock', show)
  }, [])

  const tasks = (tasksQuery.data?.data ?? []).filter(
    (task) => !dismissed.has(task.id),
  )
  const completedKey = tasks
    .filter((task) => getPhase(task) === 'completed')
    .map((task) => task.id)
    .join(',')

  useEffect(() => {
    if (open || !completedKey) return
    const timer = window.setTimeout(() => {
      setDismissedIds([
        ...new Set([...dismissedIdsRef.current, ...completedKey.split(',')]),
      ])
    }, AUTO_DISMISS_COMPLETED_MS)
    return () => window.clearTimeout(timer)
  }, [completedKey, open, setDismissedIds])

  if (!tasks.length) return null

  const finishedIds = tasks
    .filter((task) => !isActiveTask(task))
    .map((task) => task.id)
  const dismissAll = () =>
    setDismissedIds([...new Set([...dismissedIds, ...finishedIds])])

  const current = tasks.find(isActiveTask) ?? tasks[0]
  const phase = getPhase(current)
  const progress = getPublishProgress(current)
  const CurrentIcon = getPhaseIcon(phase)

  return (
    <div className={lobeStyles.u88cee038}>
      <Popover onOpenChange={setOpen} open={open}>
        <Popover.Trigger
          aria-label={t('write.publishProcess.open')}
          className={cn(
            lobeStyles.ufbf144d6,
            phase === 'failed' && lobeStyles.u37af38f0,
            phase === 'partial' && lobeStyles.u9c0b6bca,
          )}
        >
          <CurrentIcon
            aria-hidden="true"
            className={cn(
              lobeStyles.uc39c8d01,
              isActiveTask(current) && lobeStyles.u87043da0,
              phase === 'completed' && lobeStyles.uab398374,
              phase === 'failed' && lobeStyles.ue3f51cc6,
              phase === 'partial' && lobeStyles.u1dd48761,
            )}
          />
          <span aria-live="polite" className={lobeStyles.u26f463c1}>
            {t(getPhaseLabelKey(current, phase))}
          </span>
          {isActiveTask(current) ? (
            <span className={lobeStyles.uab0d95e4}>{progress}%</span>
          ) : null}
          {tasks.length > 1 ? (
            <span className={lobeStyles.uccc0332d}>{tasks.length}</span>
          ) : null}
        </Popover.Trigger>
        <Popover.Content
          align="end"
          className={lobeStyles.ufe06b4ad}
          side="top"
          sideOffset={8}
          width="lg"
        >
          <Popover.Header>
            <span>{t('write.publishProcess.title')}</span>
            {finishedIds.length ? (
              <Button
                className={lobeStyles.u6b07d529}
                onClick={dismissAll}
                variant="ghost"
              >
                {t('write.publishProcess.clearFinished')}
              </Button>
            ) : null}
          </Popover.Header>
          <Popover.Body className={lobeStyles.u652c57ab}>
            {tasks.map((task) => (
              <ProcessDetail
                key={task.id}
                onDismiss={() =>
                  setDismissedIds([...new Set([...dismissedIds, task.id])])
                }
                task={task}
              />
            ))}
          </Popover.Body>
        </Popover.Content>
      </Popover>
    </div>
  )
}

function ProcessDetail(props: { onDismiss: () => void; task: PublishTask }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { task } = props
  const phase = getPhase(task)
  const active = isActiveTask(task)
  const progress = getPublishProgress(task)
  const articleId = task.result?.articleId ?? task.payload.refId
  const editPath = articleId
    ? `/posts/edit?id=${encodeURIComponent(articleId)}`
    : null

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.tasks.tasksRoot })
  const terminate = async () => {
    const confirmed = await confirmDialog({
      confirmText: t('write.publishProcess.terminate'),
      description: t('write.publishProcess.terminateDescription'),
      destructive: true,
      title: t('write.publishProcess.terminateTitle'),
    })
    if (!confirmed) return
    await cancelTask(task.id)
    await refresh()
  }
  const retry = async () => {
    if (
      task.result?.newerDraftChanges &&
      !(await confirmDialog({
        confirmText: t('common.retry'),
        description: t('write.publishProcess.retryOlderDescription'),
        title: t('write.publishProcess.retryOlderTitle'),
      }))
    ) {
      return
    }
    await retryTask(task.id)
    await refresh()
  }

  const title =
    task.payload.snapshot.title || t(`write.kind.${task.payload.refType}`)
  return (
    <section className={lobeStyles.u4de95a9e}>
      <div className={lobeStyles.u7f362f39}>
        <div className={lobeStyles.u7e0b7cdf}>
          {editPath ? (
            <Link className={lobeStyles.ua989b332} to={editPath}>
              {title}
            </Link>
          ) : (
            <span className={lobeStyles.u299f1ccb}>{title}</span>
          )}
          <p className={lobeStyles.ubc7a44c0}>
            {t(getPhaseLabelKey(task, phase))}
          </p>
        </div>
        <div className={lobeStyles.uba2fb302}>
          {active && !task.result?.articleCommitted ? (
            <Button
              className={lobeStyles.u85decade}
              onClick={() => void terminate()}
              variant="ghost"
            >
              {t('write.publishProcess.terminate')}
            </Button>
          ) : phase === 'failed' ||
            phase === 'cancelled' ||
            phase === 'partial' ? (
            <Button
              className={lobeStyles.uee129b1d}
              onClick={() => void retry()}
              variant="ghost"
            >
              {t('common.retry')}
            </Button>
          ) : null}
          {!active ? (
            <Button
              aria-label={t('common.close')}
              className={lobeStyles.ucc46d0fa}
              iconOnly
              onClick={props.onDismiss}
              variant="ghost"
            >
              <X aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className={lobeStyles.u4e79a06b}>
        <div className={lobeStyles.ub9e7a36d}>
          <div
            className={cn(
              lobeStyles.ua1b304df,
              phase === 'failed' && lobeStyles.u7aa79040,
              phase === 'partial' && lobeStyles.u931bc423,
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={lobeStyles.uf5cf4f7d}>{progress}%</span>
      </div>

      {task.payload.aiResources.length ? (
        <ul className={lobeStyles.u67dcaedf}>
          {normalizeTaskAiResources(task.payload.aiResources).map(
            ({ mode, resource }) => (
              <ResourceProgress
                key={resource}
                mode={mode}
                resource={resource}
                taskId={task.result?.resources[resource]}
              />
            ),
          )}
        </ul>
      ) : null}
      {active ? (
        <p className={lobeStyles.u7af16148}>
          {t('write.publishProcess.snapshotNotice')}
        </p>
      ) : null}
      {task.error ? <p className={lobeStyles.ub54dff1e}>{task.error}</p> : null}
      {task.result?.newerDraftChanges ? (
        <div className={lobeStyles.ucd74c6f0}>
          {t(
            phase === 'completed' || phase === 'partial'
              ? 'write.publishProcess.newerDraftRemains'
              : 'write.publishProcess.retryUsesOlderSnapshot',
          )}
          {editPath ? (
            <Link className={lobeStyles.u7c244cbe} to={editPath}>
              {t('write.publishProcess.openLatestDraft')}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function ResourceProgress(props: {
  mode: PublishAiMode
  resource: PublishAiResource
  taskId?: string
}) {
  const { t } = useI18n()
  const { socketConnected } = useTaskDetailSubscription(props.taskId)
  const taskQuery = useQuery({
    enabled: Boolean(props.taskId),
    queryFn: () => getTask(props.taskId!),
    queryKey: adminQueryKeys.tasks.taskDetail(props.taskId ?? ''),
    refetchInterval: () =>
      socketConnected ? liveSubscribeIntervalMs : fallbackPollingIntervalMs,
  })
  const task = taskQuery.data
  const status = task?.status ?? AITaskStatus.Pending
  const meta = CAPABILITY_META[props.resource]
  const CapabilityIcon = meta.icon
  const StatusIcon = statusIcon[status] ?? Clock
  const progress = task ? Math.round(getProgress(task) ?? 0) : 0

  return (
    <li className={`${lobeStyles.u10d812d3} group`}>
      <CapabilityIcon aria-hidden="true" className={lobeStyles.u145dbbb5} />
      <span className={lobeStyles.u67bab313}>{t(meta.labelKey)}</span>
      <span className={lobeStyles.ub18bd739}>
        {t(
          props.mode === 'sync'
            ? 'write.publishAi.modeSync'
            : 'write.publishAi.modeAsync',
        )}
      </span>
      {props.taskId ? (
        <Link
          aria-label={t('write.publishProcess.viewTask')}
          className={lobeStyles.u99909601}
          to={`/tasks/${encodeURIComponent(props.taskId)}`}
        >
          <ExternalLink aria-hidden="true" className={lobeStyles.u783b0d9d} />
        </Link>
      ) : null}
      <span className={lobeStyles.uc575e3ee}>
        <StatusIcon
          aria-hidden="true"
          className={cn(lobeStyles.u783b0d9d, statusIconClassName(status))}
        />
        {task
          ? (getTaskProgressLabel(task) ?? `${progress}%`)
          : t('write.publishProcess.queued')}
      </span>
    </li>
  )
}

function isActiveTask(task: PublishTask) {
  return (
    task.status === AITaskStatus.Pending || task.status === AITaskStatus.Running
  )
}

function getPublishProgress(task: PublishTask) {
  return Math.round(task.progress ?? 0)
}

function getPhase(task: PublishTask): PublishProcessPhase {
  if (task.status === AITaskStatus.Completed) return 'completed'
  if (task.status === AITaskStatus.Cancelled) {
    return task.result?.articleCommitted ? 'partial' : 'cancelled'
  }
  if (
    task.status === AITaskStatus.Failed ||
    task.status === AITaskStatus.PartialFailed
  )
    return task.result?.articleCommitted ? 'partial' : 'failed'
  if (task.status === AITaskStatus.Pending) return 'queued'
  return (task.progress ?? 0) >= 95 ? 'publishing' : 'preparing'
}

function getPhaseLabelKey(
  task: PublishTask,
  phase: PublishProcessPhase,
): TranslationKey {
  if (phase !== 'completed') return phaseLabelKeys[phase]
  if (task.payload.operation === 'online-update') {
    return 'write.publishProcess.onlineUpdated'
  }
  if (task.payload.operation === 'republish') {
    return 'write.publishProcess.republished'
  }
  return 'write.publishProcess.firstPublished'
}

function getPhaseIcon(phase: PublishProcessPhase) {
  if (phase === 'completed') return CheckCircle2
  if (phase === 'failed') return AlertCircle
  if (phase === 'partial') return AlertCircle
  if (phase === 'cancelled') return XCircle
  return Loader2
}
