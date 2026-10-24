import { Heatmaps } from '@lobehub/charts'
import { createStaticStyles } from '@lobehub/ui'
import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { postCountsQuery } from '../queries'
import { buildCreationHeatmap } from '../utils/desk'
import { DeskRetryNotice } from './DeskRetryNotice'

const ZH_MONTHS = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]
const ZH_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const styles = createStaticStyles(({ css }) => ({
  chart: css`
    width: fit-content;
    max-width: 100%;
    margin-inline: auto;
  `,
}))

export function CreationHeatmap() {
  const { format, locale, t } = useI18n()
  const copy = useDashboardCopy()
  const posts = useQuery(postCountsQuery)
  const year = new Date().getFullYear()
  const data = useMemo(
    () => buildCreationHeatmap(posts.data?.createdAts ?? [], year),
    [posts.data?.createdAts, year],
  )
  const labels = useMemo(() => {
    const shared = {
      legend: { less: copy('heatmapLess'), more: copy('heatmapMore') },
      totalCount: copy('heatmapTotal'),
    }
    if (!locale.startsWith('zh')) return shared
    return { ...shared, months: ZH_MONTHS, weekdays: ZH_WEEKDAYS }
  }, [copy, locale])

  return (
    <Section
      desc={copy('heatmapDesc')}
      title={copy('heatmapTitle')}
      variant="card"
    >
      {posts.isError && !posts.data ? (
        <DeskRetryNotice
          fetching={posts.isFetching}
          message={copy('heatmapError')}
          onRetry={() => void posts.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : (
        <div className={styles.chart}>
          <Heatmaps
            customTooltip={(activity) => {
              const date = new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'long',
              }).format(new Date(`${activity.date}T12:00:00`))
              return activity.count
                ? copy('heatmapDay', {
                    count: format.number(activity.count),
                    date,
                  })
                : copy('heatmapEmptyDay', { date })
            }}
            data={data}
            labels={labels}
            loading={posts.isPending && !posts.data}
            showWeekdayLabels
            weekStart={1}
          />
        </div>
      )}
    </Section>
  )
}
