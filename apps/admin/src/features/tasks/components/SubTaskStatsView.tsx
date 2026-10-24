import { createStaticStyles, Progress } from '@lobehub/ui'

import type { AITask } from '~/api/tasks'
import { useI18n } from '~/i18n'

import { SmallBadge } from './TaskPrimitives'

const styles = createStaticStyles(({ css, cssVar }) => ({
  root: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-block-end: 12px;
  `,
  count: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
  `,
  badges: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `,
}))

export function SubTaskStatsView(props: { task: AITask }) {
  const { t } = useI18n()
  const stats = props.task.subTaskStats
  if (!stats || stats.total <= 0) return null

  const completeOrFailed = stats.completed + stats.failed
  const progress = (completeOrFailed / stats.total) * 100

  return (
    <div className={styles.root}>
      <div className={styles.count}>
        {t('tasks.task.subProgress')} {completeOrFailed}/{stats.total}
      </div>
      <Progress
        percent={Math.max(0, Math.min(100, progress))}
        showInfo={false}
        size="small"
        status={stats.failed > 0 ? 'exception' : 'normal'}
      />
      <div className={styles.badges}>
        <SmallBadge size="sm" tone="success">
          {t('tasks.task.subStats.completed', { count: stats.completed })}
        </SmallBadge>
        <SmallBadge size="sm" tone="info">
          {t('tasks.task.subStats.running', { count: stats.running })}
        </SmallBadge>
        <SmallBadge size="sm">
          {t('tasks.task.subStats.pending', { count: stats.pending })}
        </SmallBadge>
        {stats.failed > 0 ? (
          <SmallBadge size="sm" tone="danger">
            {t('tasks.task.subStats.failed', { count: stats.failed })}
          </SmallBadge>
        ) : null}
      </div>
    </div>
  )
}
