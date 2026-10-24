import { adminQueryKeys } from '~/query/keys'

export const dashboardQueryKeys = {
  aiCoverage: [...adminQueryKeys.ai.overviewListRoot, 'dashboard'] as const,
  appInfo: adminQueryKeys.dashboard.appInfo(),
  drafts: adminQueryKeys.dashboard.drafts(),
  draftCounts: [...adminQueryKeys.dashboard.drafts(), 'counts'] as const,
  latestPublished: [
    ...adminQueryKeys.posts.root,
    'dashboard-latest-published',
  ] as const,
  postCounts: [...adminQueryKeys.posts.root, 'dashboard-counts'] as const,
}

export const deskWritingItemLimit = 5

export const deskLatestPublishedLimit = 7

export const deskAiCoverageSize = 20

export const deskAiGapPreviewLimit = 3

export const deskQueuePreviewLimit = 5
