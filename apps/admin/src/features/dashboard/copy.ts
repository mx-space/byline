import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

export const dashboardCopy = createFeatureCopy({
  pageDescription: {
    'en-US':
      'Handle failed tasks and unpublished changes first, then catch up on recent posts.',
    'zh-CN': '先处理失败的任务和未发布的修改，再看最近更新。',
  },
  metricFailed: { 'en-US': 'Failed tasks', 'zh-CN': '失败的任务' },
  metricActive: { 'en-US': 'In progress', 'zh-CN': '进行中' },
  metricWriting: { 'en-US': 'Unpublished changes', 'zh-CN': '未发布的修改' },
  metricAiGaps: { 'en-US': 'Missing AI content', 'zh-CN': '缺 AI 内容' },
  metricAiGapsHint: {
    'en-US': 'Posts among the latest {count}',
    'zh-CN': '近 {count} 篇博文里',
  },
  pendingTitle: { 'en-US': 'Needs you', 'zh-CN': '待处理' },
  pendingEmptyTitle: {
    'en-US': 'Nothing needs you right now',
    'zh-CN': '现在没有要处理的事',
  },
  failuresTitle: { 'en-US': 'Failed tasks', 'zh-CN': '失败的任务' },
  failureNoReason: {
    'en-US': 'No reason recorded. Open it to read the log.',
    'zh-CN': '没有记录原因，打开看日志',
  },
  failuresError: {
    'en-US': 'Failed tasks did not load.',
    'zh-CN': '失败的任务没有加载出来。',
  },
  retry: { 'en-US': 'Retry', 'zh-CN': '重试' },
  viewAllFailed: { 'en-US': 'View all failed', 'zh-CN': '查看全部失败' },
  writingTitle: { 'en-US': 'Unpublished changes', 'zh-CN': '未发布的修改' },
  writingModified: {
    'en-US': 'Changed since publish',
    'zh-CN': '有未发布的修改',
  },
  writingUnpublished: { 'en-US': 'Never published', 'zh-CN': '从未发布' },
  writingBranches: { 'en-US': '{count} branches', 'zh-CN': '{count} 个分支' },
  draftsError: {
    'en-US': 'Drafts did not load.',
    'zh-CN': '草稿没有加载出来。',
  },
  viewDrafts: { 'en-US': 'View drafts', 'zh-CN': '查看草稿' },
  aiGapsTitle: { 'en-US': 'Missing AI content', 'zh-CN': '缺 AI 内容' },
  aiGapCount: { 'en-US': '{count} missing', 'zh-CN': '缺 {count} 项' },
  aiGapsError: {
    'en-US': 'AI coverage did not load.',
    'zh-CN': 'AI 产物覆盖情况没有加载出来。',
  },
  viewAiOverview: { 'en-US': 'Open AI content', 'zh-CN': '查看 AI 内容' },
  activeTitle: { 'en-US': 'In progress', 'zh-CN': '进行中' },
  activeError: {
    'en-US': 'Tasks in progress did not load.',
    'zh-CN': '进行中的任务没有加载出来。',
  },
  viewAllActive: { 'en-US': 'View all in progress', 'zh-CN': '查看全部进行中' },
  recentTitle: { 'en-US': 'Recently updated', 'zh-CN': '最近更新' },
  recentEmptyTitle: { 'en-US': 'No posts yet', 'zh-CN': '还没有博文' },
  recentError: {
    'en-US': 'Recent posts did not load.',
    'zh-CN': '最近更新的博文没有加载出来。',
  },
  unpublished: { 'en-US': 'Unpublished', 'zh-CN': '未发布' },
  viewPosts: { 'en-US': 'All {count} posts', 'zh-CN': '全部 {count} 篇' },
  untitled: { 'en-US': 'Untitled', 'zh-CN': '无标题' },
  writePost: { 'en-US': 'Write a post', 'zh-CN': '写博文' },
  refreshStale: {
    'en-US': 'Refresh failed. Showing the last loaded data.',
    'zh-CN': '刷新失败，显示的是上次的数据。',
  },
  slowLoading: {
    'en-US': 'Loading is taking more than 10 seconds.',
    'zh-CN': '加载超过 10 秒。',
  },
  versionError: {
    'en-US': 'The server version did not load.',
    'zh-CN': '服务端版本没有加载出来。',
  },
})

export function useDashboardCopy() {
  const { locale } = useI18n()
  return useCallback(
    (
      key: Parameters<typeof dashboardCopy>[1],
      values?: Parameters<typeof dashboardCopy>[2],
    ) => dashboardCopy(locale, key, values),
    [locale],
  )
}
