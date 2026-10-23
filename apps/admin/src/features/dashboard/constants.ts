import { adminQueryKeys } from '~/query/keys'

export const dashboardQueryKeys = {
  aiCoverage: [...adminQueryKeys.ai.overviewListRoot, 'dashboard'] as const,
  appInfo: adminQueryKeys.dashboard.appInfo(),
  drafts: adminQueryKeys.dashboard.drafts(),
  recentPosts: adminQueryKeys.dashboard.recentPosts(),
}

export const deskWritingItemLimit = 5

export const deskRecentPostLimit = 6

export const deskAiCoverageSize = 20

export const deskAiGapPreviewLimit = 3

export const deskQueuePreviewLimit = 5
