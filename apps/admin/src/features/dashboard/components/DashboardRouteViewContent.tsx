import { useQuery } from '@tanstack/react-query'
import { Leaf } from 'lucide-react'
import { useMemo } from 'react'

import { getDrafts } from '~/api/drafts'
import { getPosts } from '~/api/posts'
import { getAppInfo } from '~/api/system'
import { OnboardingResumeBanner } from '~/features/setup/components/OnboardingResumeBanner'
import { useI18n } from '~/i18n'
import { DraftRefType } from '~/models/draft'
import { EmptyState } from '~/ui/patterns/EmptyState'

import { dashboardQueryKeys, deskRecentPostLimit } from '../constants'
import { buildWritingItems } from '../utils/desk'
import { DeskFooter } from './DeskFooter'
import { DeskGreeting } from './DeskGreeting'
import { DeskLayout } from './DeskLayout'
import { DeskLoadError } from './DeskLoadError'
import { DeskRecentPostsCard } from './DeskRecentPostsCard'
import { DeskResumeCard } from './DeskResumeCard'
import { DeskPrimarySkeleton, DeskRailSkeleton } from './DeskSkeleton'
import { DeskWritingCard } from './DeskWritingCard'

export function DashboardRouteViewContent() {
  const { t } = useI18n()

  const draftsQuery = useQuery({
    queryFn: () =>
      getDrafts({
        page: 1,
        refType: DraftRefType.Post,
        size: 50,
        sort_by: 'updatedAt',
        sort_order: 'desc',
      }),
    queryKey: dashboardQueryKeys.drafts,
  })
  const postsQuery = useQuery({
    queryFn: () =>
      getPosts({
        page: 1,
        size: deskRecentPostLimit,
        sort_by: 'modifiedAt',
        sort_order: 'desc',
      }),
    queryKey: dashboardQueryKeys.recentPosts,
  })
  const appInfoQuery = useQuery({
    queryFn: getAppInfo,
    queryKey: dashboardQueryKeys.appInfo,
    retry: false,
  })

  const adminVersion = __DEV__ ? 'dev mode' : window.version || 'N/A'
  const systemVersion = appInfoQuery.data?.version || 'N/A'
  const writingItems = useMemo(
    () => buildWritingItems(draftsQuery.data?.data ?? []),
    [draftsQuery.data],
  )

  if (!draftsQuery.data || !postsQuery.data) {
    const failed = draftsQuery.isError || postsQuery.isError
    return (
      <DeskLayout
        primary={
          failed ? (
            <DeskLoadError
              onRetry={() => {
                void draftsQuery.refetch()
                void postsQuery.refetch()
              }}
              retrying={draftsQuery.isFetching || postsQuery.isFetching}
            />
          ) : (
            <DeskPrimarySkeleton />
          )
        }
        rail={failed ? null : <DeskRailSkeleton />}
      />
    )
  }

  const [resumeItem, ...restItems] = writingItems

  return (
    <DeskLayout
      primary={
        <>
          <DeskGreeting className="phone:order-1" />

          <OnboardingResumeBanner className="mb-6 phone:order-2" />

          {resumeItem ? (
            <DeskResumeCard className="phone:order-2" item={resumeItem} />
          ) : (
            <div className="border-t border-border py-7 phone:order-2 phone:py-6">
              <EmptyState icon={Leaf} title={t('dashboard.desk.zen.title')} />
            </div>
          )}
          {restItems.length > 0 ? (
            <DeskWritingCard
              className="phone:order-3"
              items={restItems}
              total={writingItems.length}
            />
          ) : null}

          <DeskFooter
            adminVersion={adminVersion}
            className="phone:order-5"
            systemVersion={systemVersion}
          />
        </>
      }
      rail={
        <DeskRecentPostsCard
          className="phone:order-4"
          posts={postsQuery.data.data}
        />
      }
    />
  )
}
