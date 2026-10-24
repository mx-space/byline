import { Alert, createStaticStyles, Icon, ScrollArea } from '@lobehub/ui'
import { RefreshCw } from 'lucide-react'

import type { AITaskLog } from '~/api/tasks'
import { Button } from '~/ui/site-button'

import { useTaskCopy } from '../copy'
import { TaskLogRow } from './TaskLogRow'

const styles = createStaticStyles(({ css, cssVar }) => ({
  section: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  head: css`
    align-items: center;
    display: flex;
    gap: 8px;
    justify-content: space-between;
  `,
  title: css`
    color: ${cssVar.colorText};
    font-size: ${cssVar.fontSize};
    font-weight: 500;
    margin: 0;
  `,
  live: css`
    align-items: center;
    color: ${cssVar.colorInfo};
    display: inline-flex;
    font-size: ${cssVar.fontSizeSM};
    gap: 6px;
  `,
  empty: css`
    color: ${cssVar.colorTextSecondary};
    font-size: ${cssVar.fontSizeSM};
    margin: 0;
  `,
  list: css`
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius};
    max-height: 24rem;
  `,
  rows: css`
    display: flex;
    flex-direction: column;
  `,
}))

export function TaskLogsBlock(props: {
  loadFailed: boolean
  logs: AITaskLog[] | undefined
  onReload: () => void
  polling: boolean
  reloading: boolean
}) {
  const copy = useTaskCopy()
  const logs = Array.isArray(props.logs) ? props.logs : []
  const missingLogs = !Array.isArray(props.logs)

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>{copy('logTitle')}</h2>
        {props.polling ? (
          <span className={styles.live}>
            <Icon icon={RefreshCw} size="small" spin />
            {copy('logLive')}
          </span>
        ) : null}
      </div>
      {props.loadFailed || missingLogs ? (
        <Alert
          action={
            <Button
              loading={props.reloading}
              onClick={props.onReload}
              size="small"
            >
              {copy('logReload')}
            </Button>
          }
          description={copy('logLoadBody')}
          title={copy('logLoadTitle')}
          type="error"
        />
      ) : null}
      {props.loadFailed && logs.length > 0 ? (
        <p className={styles.empty}>{copy('logStale')}</p>
      ) : null}
      {!props.loadFailed && !missingLogs && logs.length === 0 ? (
        <p className={styles.empty}>{copy('logEmpty')}</p>
      ) : null}
      {logs.length > 0 ? (
        <ScrollArea className={styles.list} scrollFade="vertical">
          <div className={styles.rows}>
            {logs.map((log, index) => (
              <TaskLogRow key={`${log.timestamp}-${index}`} log={log} />
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </section>
  )
}
