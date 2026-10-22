import { adminQueryKeys } from '~/query/keys'

export const dashboardQueryKeys = {
  appInfo: adminQueryKeys.dashboard.appInfo(),
  drafts: adminQueryKeys.dashboard.drafts(),
  recentPosts: adminQueryKeys.dashboard.recentPosts(),
}

export const deskWritingItemLimit = 5

export const deskRecentPostLimit = 6

export const deskSplitMediaQuery = '(min-width: 1280px)'
