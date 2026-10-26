import { createStaticStyles } from '@lobehub/ui'
import { MetricStrip } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, FilePen, Languages, ListTodo } from 'lucide-react'

import { OnboardingResumeBanner } from '~/features/setup/components/OnboardingResumeBanner'
import { useI18n } from '~/i18n'
import { Page } from '~/ui/page'

import { useDashboardCopy } from '../copy'
import {
  activeTasksQuery,
  draftCountsQuery,
  failedTasksQuery,
  postCountsQuery,
  translationCoverageQuery,
} from '../queries'
import {
  draftsPath,
  postsPath,
  tasksPath,
  translationGapsPath,
  translationGapSummary,
} from '../utils/desk'
import { ActiveTasks } from './ActiveTasks'
import { CategoryShare } from './CategoryShare'
import { CreationHeatmap } from './CreationHeatmap'
import { DeskFooter } from './DeskFooter'
import { PendingSection } from './PendingSection'
import { LatestPublished, RecentPublished } from './PublishedPosts'

const styles = createStaticStyles(({ css, cssVar, responsive }) => ({
  charts: css`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
    gap: 16px;
    align-items: stretch;

    > * {
      min-width: 0;
    }

    ${responsive.lg} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  pair: css`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: stretch;

    > * {
      min-width: 0;
    }

    ${responsive.lg} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  danger: css`
    color: ${cssVar.colorError};
  `,
  info: css`
    color: ${cssVar.colorInfo};
  `,
  success: css`
    color: ${cssVar.colorSuccess};
  `,
}))

function DeskMetrics() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const posts = useQuery(postCountsQuery)
  const draftCounts = useQuery(draftCountsQuery)
  const translations = useQuery(translationCoverageQuery)
  const failed = useQuery(failedTasksQuery)
  const active = useQuery(activeTasksQuery)

  const value = (count: number | undefined) =>
    count === undefined ? '--' : format.number(count)
  const publishedCount = posts.data?.published
  const latestPublishedAt = posts.data?.latestPublishedAt
  const draftCount = draftCounts.data?.drafts
  const changesCount = draftCounts.data?.changes
  const unpublishedCount =
    draftCount === undefined || changesCount === undefined
      ? undefined
      : draftCount + changesCount
  const translationGaps = translations.data
    ? translationGapSummary(translations.data)
    : undefined
  const activeCount = active.data?.total
  const failedCount = failed.data?.total
  const taskValue =
    activeCount === undefined || failedCount === undefined ? (
      '--'
    ) : (
      <>
        <span className={activeCount ? styles.info : undefined}>
          {format.number(activeCount)}
        </span>
        {' · '}
        <span className={failedCount ? styles.danger : undefined}>
          {format.number(failedCount)}
        </span>
      </>
    )
  const translationHint = !translationGaps
    ? undefined
    : translationGaps.items > 0
      ? copy('metricTranslationItems', { count: translationGaps.items })
      : translationGaps.applicable > 0
        ? copy('metricTranslationDone')
        : translations.data?.length
          ? copy('metricTranslationUnset')
          : undefined

  return (
    <MetricStrip
      items={[
        {
          hint: latestPublishedAt
            ? format.dateTime(latestPublishedAt)
            : undefined,
          href: postsPath,
          label: copy('metricPublished'),
          loading: posts.isPending,
          mark: CircleCheck,
          value: (
            <span className={publishedCount ? styles.success : undefined}>
              {value(publishedCount)}
            </span>
          ),
        },
        {
          hint:
            draftCount === undefined || changesCount === undefined
              ? undefined
              : copy('metricUnpublishedHint', {
                  changes: changesCount,
                  drafts: draftCount,
                }),
          href: draftsPath,
          label: copy('metricUnpublished'),
          loading: draftCounts.isPending,
          mark: FilePen,
          value: value(unpublishedCount),
          valueTone: unpublishedCount ? 'warning' : undefined,
        },
        {
          hint: translationHint,
          href: translationGapsPath,
          label: copy('metricTranslationGaps'),
          loading: translations.isPending,
          mark: Languages,
          value: value(translationGaps?.posts),
          valueTone: translationGaps?.posts ? 'warning' : undefined,
        },
        {
          hint: copy('metricTasksHint'),
          href: tasksPath,
          label: copy('metricTasks'),
          loading: active.isPending || failed.isPending,
          mark: ListTodo,
          value: taskValue,
        },
      ]}
    />
  )
}

export function DashboardRouteViewContent() {
  const { t } = useI18n()
  const copy = useDashboardCopy()

  return (
    <Page
      description={copy('pageDescription')}
      title={t('routes.dashboard.title')}
      width="wide"
    >
      <OnboardingResumeBanner />
      <DeskMetrics />
      <div className={styles.charts}>
        <CreationHeatmap />
        <CategoryShare />
      </div>
      <LatestPublished />
      <div className={styles.pair}>
        <RecentPublished />
        <PendingSection />
      </div>
      <ActiveTasks />
      <DeskFooter />
    </Page>
  )
}
