import { DonutChart, Legend } from '@lobehub/charts'
import { Section } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useI18n } from '~/i18n'

import { useDashboardCopy } from '../copy'
import { postCountsQuery } from '../queries'
import { countCategoryShare } from '../utils/desk'
import { DeskRetryNotice } from './DeskRetryNotice'

export function CategoryShare() {
  const { format, t } = useI18n()
  const copy = useDashboardCopy()
  const posts = useQuery(postCountsQuery)
  const shares = useMemo(
    () => countCategoryShare(posts.data?.categoryNames ?? []),
    [posts.data?.categoryNames],
  )
  const total = shares.reduce((sum, share) => sum + share.count, 0)
  const data = shares.map((share) => ({
    name: share.name ?? copy('categoryUncategorized'),
    value: share.count,
  }))

  return (
    <Section
      desc={copy('categoryShareDesc')}
      title={copy('categoryShareTitle')}
      variant="card"
    >
      {posts.isError && !posts.data ? (
        <DeskRetryNotice
          fetching={posts.isFetching}
          message={copy('categoryShareError')}
          onRetry={() => void posts.refetch()}
          retryLabel={t('common.retry')}
        />
      ) : (
        <>
          <DonutChart
            category="value"
            data={data}
            height="8rem"
            index="name"
            label={copy('categoryShareTotal', { count: format.number(total) })}
            loading={posts.isPending && !posts.data}
            noDataText={copy('categoryShareDesc')}
            valueFormatter={(value) =>
              copy('categoryShareValue', {
                count: format.number(value),
                percent: total ? Math.round((value / total) * 100) : 0,
              })
            }
            variant="donut"
          />
          {data.length ? (
            <Legend categories={data.map((item) => item.name)} />
          ) : null}
        </>
      )}
    </Section>
  )
}
