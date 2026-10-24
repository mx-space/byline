import { getOverviewGrouped } from '~/api/ai-overview'
import { getDrafts } from '~/api/drafts'
import { getPosts } from '~/api/posts'
import { getAppInfo } from '~/api/system'
import { type AITask, AITaskStatus, getTasks } from '~/api/tasks'
import {
  coverageListKey,
  fetchAllCoverage,
} from '~/features/ai/overview/use-coverage-data'
import { loadInboxDrafts } from '~/features/drafts/utils/load-inbox-drafts'
import { DraftRefType } from '~/models/draft'
import type { PostModel } from '~/models/post'
import { adminQueryKeys } from '~/query/keys'

import {
  dashboardQueryKeys,
  deskAiCoverageSize,
  deskLatestPublishedLimit,
  deskQueuePreviewLimit,
} from './constants'
import {
  countPublishStates,
  countUnpublishedDrafts,
  takePublishedPosts,
} from './utils/desk'

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

const postCountPageSize = 50
const postCountMaxPages = 40

async function fetchPublishCounts() {
  let published = 0
  let unpublished = 0
  let latestPublishedAt: string | null = null
  const createdAts: string[] = []
  const categoryNames: Array<string | null> = []
  for (let page = 1; page <= postCountMaxPages; page++) {
    const result = await getPosts({
      page,
      size: postCountPageSize,
      truncate: 1,
    })
    const counts = countPublishStates(result.data)
    published += counts.published
    unpublished += counts.unpublished
    for (const post of result.data) {
      if (post.createdAt) createdAts.push(post.createdAt)
      categoryNames.push(post.category?.name ?? null)
    }
    if (
      counts.latestPublishedAt &&
      (!latestPublishedAt ||
        Date.parse(counts.latestPublishedAt) > Date.parse(latestPublishedAt))
    ) {
      latestPublishedAt = counts.latestPublishedAt
    }
    const totalPages =
      result.pagination.totalPages ||
      Math.ceil(result.pagination.total / postCountPageSize) ||
      page
    if (page >= totalPages) break
  }
  return {
    categoryNames,
    createdAts,
    latestPublishedAt,
    published,
    unpublished,
  }
}

async function fetchDraftCounts() {
  const rows = await loadInboxDrafts({ refType: DraftRefType.Post })
  return countUnpublishedDrafts(rows)
}

export const postCountsQuery = {
  queryFn: fetchPublishCounts,
  queryKey: dashboardQueryKeys.postCounts,
}

export const draftCountsQuery = {
  queryFn: fetchDraftCounts,
  queryKey: dashboardQueryKeys.draftCounts,
}

export const translationCoverageQuery = {
  queryFn: fetchAllCoverage,
  queryKey: coverageListKey,
}

async function fetchLatestPublished() {
  const picked: PostModel[] = []
  for (let page = 1; page <= postCountMaxPages; page++) {
    const result = await getPosts({
      page,
      size: postCountPageSize,
      sort_by: 'createdAt',
      sort_order: 'desc',
      truncate: 1,
    })
    picked.push(
      ...takePublishedPosts(
        result.data,
        deskLatestPublishedLimit - picked.length,
      ),
    )
    if (picked.length >= deskLatestPublishedLimit) break
    const totalPages =
      result.pagination.totalPages ||
      Math.ceil(result.pagination.total / postCountPageSize) ||
      page
    if (page >= totalPages) break
  }
  return picked
}

export const latestPublishedQuery = {
  queryFn: fetchLatestPublished,
  queryKey: [...dashboardQueryKeys.latestPublished, deskLatestPublishedLimit],
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
