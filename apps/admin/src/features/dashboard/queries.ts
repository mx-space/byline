import { getOverviewGrouped } from '~/api/ai-overview'
import { getDrafts } from '~/api/drafts'
import { getPosts } from '~/api/posts'
import { getAppInfo } from '~/api/system'
import { type AITask, AITaskStatus, getTasks } from '~/api/tasks'
import { DraftRefType } from '~/models/draft'
import { adminQueryKeys } from '~/query/keys'

import {
  dashboardQueryKeys,
  deskAiCoverageSize,
  deskQueuePreviewLimit,
  deskRecentPostLimit,
} from './constants'

const taskListRefetchIntervalMs = 15_000

const failedTaskParams = {
  page: 1,
  size: deskQueuePreviewLimit,
  status: [AITaskStatus.Failed, AITaskStatus.PartialFailed],
}

const activeTaskParams = {
  page: 1,
  size: deskQueuePreviewLimit,
  status: [AITaskStatus.Pending, AITaskStatus.Running],
}

function keepTaskPage(previous: { data: AITask[]; total: number } | undefined) {
  return previous
}

export const failedTasksQuery = {
  placeholderData: keepTaskPage,
  queryFn: () => getTasks(failedTaskParams),
  queryKey: adminQueryKeys.tasks.tasks(failedTaskParams),
  refetchInterval: taskListRefetchIntervalMs,
}

export const activeTasksQuery = {
  placeholderData: keepTaskPage,
  queryFn: () => getTasks(activeTaskParams),
  queryKey: adminQueryKeys.tasks.tasks(activeTaskParams),
  refetchInterval: taskListRefetchIntervalMs,
}

export const draftsQuery = {
  queryFn: () =>
    getDrafts({
      page: 1,
      refType: DraftRefType.Post,
      size: 50,
      sort_by: 'updatedAt',
      sort_order: 'desc',
    }),
  queryKey: dashboardQueryKeys.drafts,
}

export const recentPostsQuery = {
  queryFn: () =>
    getPosts({
      page: 1,
      size: deskRecentPostLimit,
      sort_by: 'modifiedAt',
      sort_order: 'desc',
    }),
  queryKey: dashboardQueryKeys.recentPosts,
}

export const appInfoQuery = {
  queryFn: getAppInfo,
  queryKey: dashboardQueryKeys.appInfo,
  retry: false,
}

export const aiCoverageQuery = {
  queryFn: () =>
    getOverviewGrouped({ page: 1, size: deskAiCoverageSize, type: 'post' }),
  queryKey: dashboardQueryKeys.aiCoverage,
  retry: false,
}
