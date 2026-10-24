import { createStaticStyles, Flexbox, Text } from '@lobehub/ui'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { useI18n } from '~/i18n'
import { ListSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { useDashboardCopy } from '../copy'
import { DeskRetryNotice } from './DeskRetryNotice'
import { useSlowPending } from './use-slow-pending'

const styles = createStaticStyles(({ css, cssVar }) => ({
  count: css`
    font-variant-numeric: tabular-nums;
    color: ${cssVar.colorTextTertiary};
  `,
  head: css`
    display: flex;
    align-items: center;
    gap: 8px;

    min-block-size: 32px;
    padding-inline: 12px;
    border-radius: ${cssVar.borderRadiusXS};

    background: ${cssVar.colorFillQuaternary};
  `,
  label: css`
    font-size: ${cssVar.fontSizeSM};
    line-height: 1.4;
  `,
  more: css`
    margin-inline-start: auto;
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
    text-decoration: none;

    &:hover {
      color: ${cssVar.colorText};
    }
  `,
  rows: css`
    display: flex;
    flex-direction: column;
  `,
}))

export interface DeskQuery {
  data: unknown
  isError: boolean
  isFetching: boolean
  isPending: boolean
  refetch: () => unknown
}

export function DeskQueryState(props: {
  children: ReactNode
  errorMessage: string
  query: DeskQuery
  rows?: number
}) {
  const { t } = useI18n()
  const copy = useDashboardCopy()
  const { query } = props
  const pending = query.isPending && !query.data
  const slow = useSlowPending(pending)
  const retry = () => void query.refetch()

  if (pending) {
    return (
      <Flexbox aria-busy gap={8}>
        <ListSkeleton rows={props.rows ?? 3} />
        {slow ? (
          <Flexbox align="center" gap={8} horizontal>
            <Text type="secondary">{copy('slowLoading')}</Text>
            <Button loading={query.isFetching} onClick={retry} size="small">
              {t('common.retry')}
            </Button>
          </Flexbox>
        ) : null}
      </Flexbox>
    )
  }

  if (query.isError && !query.data) {
    return (
      <DeskRetryNotice
        fetching={query.isFetching}
        message={props.errorMessage}
        onRetry={retry}
        retryLabel={t('common.retry')}
      />
    )
  }

  return (
    <>
      {query.isError ? (
        <DeskRetryNotice
          fetching={query.isFetching}
          message={copy('refreshStale')}
          onRetry={retry}
          retryLabel={t('common.retry')}
          tone="warning"
        />
      ) : null}
      {props.children}
    </>
  )
}

export function DeskGroup(props: {
  children: ReactNode
  count?: ReactNode
  more?: string
  moreTo?: string
  title: string
}) {
  return (
    <Flexbox gap={8}>
      <div className={styles.head}>
        <Text className={styles.label} type="secondary">
          {props.title}
        </Text>
        {props.count != null ? (
          <span className={styles.count}>{props.count}</span>
        ) : null}
        {props.more && props.moreTo ? (
          <Link className={styles.more} to={props.moreTo}>
            {props.more}
          </Link>
        ) : null}
      </div>
      <div className={styles.rows}>{props.children}</div>
    </Flexbox>
  )
}
