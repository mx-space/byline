import { createStaticStyles } from '@lobehub/ui'
import { MetricStrip } from '@lobehub/ui/dashboard'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, FilePen, Loader, Sparkles } from 'lucide-react'

import { OnboardingResumeBanner } from '~/features/setup/components/OnboardingResumeBanner'
import { useI18n } from '~/i18n'
import { Page } from '~/ui/page'

import { deskAiCoverageSize } from '../constants'
import { useDashboardCopy } from '../copy'
import {
  activeTasksQuery,
  aiCoverageQuery,
  draftsQuery,
  failedTasksQuery,
} from '../queries'
import {
  activeTasksPath,
  aiGapRows,
  aiOverviewPath,
  buildWritingItems,
  draftsPath,
  failedTasksPath,
} from '../utils/desk'
import { ActiveTasks } from './ActiveTasks'
import { DeskFooter } from './DeskFooter'
import { PendingSection } from './PendingSection'
import { RecentPostsSection } from './RecentPostsSection'

const styles = createStaticStyles(({ css, responsive }) => ({
  columns: css`
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: 16px;
    align-items: start;

    ${responsive.lg} {
      grid-template-columns: minmax(0, 1fr);
    }
  `,
  stack: css`
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  `,
}))

function DeskMetrics() {
  const { format } = useI18n()
  const copy = useDashboardCopy()
  const failed = useQuery(failedTasksQuery)
  const active = useQuery(activeTasksQuery)
  const drafts = useQuery(draftsQuery)
  const ai = useQuery(aiCoverageQuery)

  const value = (count: number | undefined) =>
    count === undefined ? '--' : format.number(count)
  const failedCount = failed.data?.total
  const writingCount = drafts.data
    ? buildWritingItems(drafts.data.data).length
    : undefined
  const gapCount = ai.data ? aiGapRows(ai.data.data).length : undefined

  return (
    <MetricStrip
      items={[
        {
          href: failedTasksPath,
          label: copy('metricFailed'),
          loading: failed.isPending,
          mark: CircleAlert,
          value: value(failedCount),
          valueTone: failedCount ? 'danger' : undefined,
        },
        {
          href: activeTasksPath,
          label: copy('metricActive'),
          loading: active.isPending,
          mark: Loader,
          value: value(active.data?.total),
        },
        {
          href: draftsPath,
          label: copy('metricWriting'),
          loading: drafts.isPending,
          mark: FilePen,
          value: value(writingCount),
          valueTone: writingCount ? 'warning' : undefined,
        },
        {
          hint: copy('metricAiGapsHint', { count: deskAiCoverageSize }),
          href: aiOverviewPath,
          label: copy('metricAiGaps'),
          loading: ai.isPending,
          mark: Sparkles,
          value: value(gapCount),
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
      <div className={styles.columns}>
        <div className={styles.stack}>
          <PendingSection />
          <ActiveTasks />
        </div>
        <RecentPostsSection />
      </div>
      <DeskFooter />
    </Page>
  )
}
