import { createStaticStyles } from '@lobehub/ui'

import type { AITaskLog } from '~/api/tasks'
import { cn } from '~/utils/cn'

import { useTaskCopy } from '../copy'
import { formatTaskClock } from '../utils/task-time'

const styles = createStaticStyles(({ css, cssVar }) => ({
  row: css`
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
    display: grid;
    gap: 4px 12px;
    padding: 8px 12px;

    @media (min-width: 640px) {
      grid-template-columns: 9.5rem 3.5rem minmax(0, 1fr);
    }

    &:last-child {
      border-block-end: 0;
    }
  `,
  time: css`
    color: ${cssVar.colorTextTertiary};
    font-size: ${cssVar.fontSizeSM};
    font-variant-numeric: tabular-nums;
  `,
  level: css`
    font-size: ${cssVar.fontSizeSM};
    font-weight: 500;
  `,
  error: css`
    color: ${cssVar.colorError};
  `,
  warn: css`
    color: ${cssVar.colorWarning};
  `,
  info: css`
    color: ${cssVar.colorTextSecondary};
  `,
  message: css`
    color: ${cssVar.colorText};
    font-size: ${cssVar.fontSizeSM};
    min-width: 0;
    overflow-wrap: anywhere;
  `,
}))

export function TaskLogRow(props: { log: AITaskLog }) {
  const copy = useTaskCopy()
  const level =
    props.log.level === 'error'
      ? copy('logError')
      : props.log.level === 'warn'
        ? copy('logWarn')
        : copy('logInfo')
  const levelClass =
    props.log.level === 'error'
      ? styles.error
      : props.log.level === 'warn'
        ? styles.warn
        : styles.info

  return (
    <div className={styles.row}>
      <time
        className={styles.time}
        dateTime={new Date(props.log.timestamp).toISOString()}
      >
        {formatTaskClock(props.log.timestamp)}
      </time>
      <span className={cn(styles.level, levelClass)}>{level}</span>
      <span className={styles.message}>{props.log.message}</span>
    </div>
  )
}
