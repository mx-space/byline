import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

export const dashboardCopy = createFeatureCopy({
  pageDescription: {
    'en-US':
      'See published and unpublished posts, missing translations, and tasks in progress or failed.',
    'zh-CN': '看已发布和未发布的文章、缺翻译，以及进行中和失败的任务。',
  },
  metricPublished: { 'en-US': 'Published', 'zh-CN': '已发布' },
  metricUnpublished: { 'en-US': 'Unpublished', 'zh-CN': '未发布' },
  metricUnpublishedHint: {
    'en-US': '{drafts} drafts · {changes} changes',
    'zh-CN': '{drafts} 篇草稿 · {changes} 篇改动',
  },
  metricTranslationGaps: {
    'en-US': 'Missing translations',
    'zh-CN': '缺翻译',
  },
  metricTranslationDone: { 'en-US': 'Complete', 'zh-CN': '已齐' },
  metricTranslationUnset: { 'en-US': 'Not set up', 'zh-CN': '未配置' },
  metricTranslationItems: {
    'en-US': '{count} missing',
    'zh-CN': '缺 {count} 项',
  },
  metricTasks: { 'en-US': 'Tasks', 'zh-CN': '任务' },
  metricTasksHint: {
    'en-US': 'In progress · Failed',
    'zh-CN': '进行中 · 失败',
  },
  heatmapTitle: { 'en-US': 'Creation', 'zh-CN': '创作热力图' },
  heatmapDesc: {
    'en-US': 'Posts created each day this year.',
    'zh-CN': '今年每天新建的文章。',
  },
  heatmapLess: { 'en-US': 'Less', 'zh-CN': '少' },
  heatmapMore: { 'en-US': 'More', 'zh-CN': '多' },
  heatmapTotal: {
    'en-US': '{{count}} posts created in {{year}}',
    'zh-CN': '{{year}} 年创作 {{count}} 篇',
  },
  heatmapDay: {
    'en-US': '{count} posts on {date}',
    'zh-CN': '{date} · {count} 篇',
  },
  heatmapEmptyDay: {
    'en-US': 'No posts on {date}',
    'zh-CN': '{date} · 没有新文章',
  },
  heatmapError: {
    'en-US': 'The creation history did not load.',
    'zh-CN': '创作记录没有加载出来。',
  },
  categoryShareTitle: { 'en-US': 'Categories', 'zh-CN': '分类占比' },
  categoryShareDesc: {
    'en-US': 'Share of posts by category.',
    'zh-CN': '全部文章按分类。',
  },
  categoryUncategorized: { 'en-US': 'Uncategorized', 'zh-CN': '未分类' },
  categoryShareValue: {
    'en-US': '{count} posts · {percent}%',
    'zh-CN': '{count} 篇 · {percent}%',
  },
  categoryShareTotal: { 'en-US': '{count} posts', 'zh-CN': '{count} 篇' },
  categoryShareError: {
    'en-US': 'Category shares did not load.',
    'zh-CN': '分类占比没有加载出来。',
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
    'en-US': 'Changed',
    'zh-CN': '有改动',
  },
  writingUnpublished: { 'en-US': 'New', 'zh-CN': '新文章' },
  draftsError: {
    'en-US': 'Drafts did not load.',
    'zh-CN': '草稿没有加载出来。',
  },
  viewDrafts: { 'en-US': 'View drafts', 'zh-CN': '查看草稿' },
  aiGapsTitle: { 'en-US': 'Missing outputs', 'zh-CN': '缺产物' },
  aiGapCount: { 'en-US': '{count} missing', 'zh-CN': '缺 {count} 项' },
  aiGapsError: {
    'en-US': 'AI coverage did not load.',
    'zh-CN': '产物没有加载出来。',
  },
  viewAiOverview: { 'en-US': 'Open outputs', 'zh-CN': '查看产物' },
  activeTitle: { 'en-US': 'In progress', 'zh-CN': '进行中' },
  activeError: {
    'en-US': 'Tasks in progress did not load.',
    'zh-CN': '进行中的任务没有加载出来。',
  },
  viewAllActive: { 'en-US': 'View all in progress', 'zh-CN': '查看全部进行中' },
  latestPublishedTitle: { 'en-US': 'Latest published', 'zh-CN': '最新发布' },
  latestPublishedEmpty: {
    'en-US': 'Nothing published yet',
    'zh-CN': '还没有发布的文章',
  },
  latestPublishedError: {
    'en-US': 'The latest published post did not load.',
    'zh-CN': '最新发布没有加载出来。',
  },
  checkTranslation: { 'en-US': 'Translation', 'zh-CN': '翻译检查' },
  checkSeo: { 'en-US': 'SEO', 'zh-CN': 'SEO 检查' },
  checkDone: { 'en-US': 'Complete', 'zh-CN': '已齐' },
  checkProgress: { 'en-US': '{done}/{total}', 'zh-CN': '{done}/{total}' },
  checkUnset: { 'en-US': 'Not set up', 'zh-CN': '未配置' },
  checkMissing: { 'en-US': '{count} missing', 'zh-CN': '缺 {count} 项' },
  checkSeoCover: { 'en-US': 'Cover', 'zh-CN': '封面' },
  checkSeoTitle: { 'en-US': 'Title', 'zh-CN': '标题' },
  checkSeoDescription: { 'en-US': 'Description', 'zh-CN': '描述' },
  checkSeoLong: { 'en-US': 'Too long', 'zh-CN': '过长' },
  checkSeoAbsent: { 'en-US': 'Missing', 'zh-CN': '缺失' },
  share: { 'en-US': 'Share', 'zh-CN': '分享' },
  viewLive: { 'en-US': 'View', 'zh-CN': '查看' },
  sharePublished: { 'en-US': 'Published.', 'zh-CN': '已经发布' },
  shareSpread: { 'en-US': 'Share it.', 'zh-CN': '分享出去' },
  shareCopyLink: { 'en-US': 'Copy link', 'zh-CN': '复制链接' },
  shareCopied: { 'en-US': 'Link copied.', 'zh-CN': '链接已复制' },
  shareCopyFailed: {
    'en-US': 'The link was not copied.',
    'zh-CN': '链接没有复制成',
  },
  shareOnX: { 'en-US': 'Share on X', 'zh-CN': '分享到 X' },
  shareOnThreads: { 'en-US': 'Share on Threads', 'zh-CN': '分享到 Threads' },
  shareOnFacebook: { 'en-US': 'Share on Facebook', 'zh-CN': '分享到 Facebook' },
  shareOnLinkedIn: { 'en-US': 'Share on LinkedIn', 'zh-CN': '分享到 LinkedIn' },
  shareOnBluesky: { 'en-US': 'Share on Bluesky', 'zh-CN': '分享到 Bluesky' },
  recentPublishedTitle: {
    'en-US': 'Recently published',
    'zh-CN': '最近发布',
  },
  recentPublishedEmpty: {
    'en-US': 'No earlier published posts',
    'zh-CN': '没有更早发布的文章',
  },
  recentPublishedError: {
    'en-US': 'Recently published posts did not load.',
    'zh-CN': '最近发布没有加载出来。',
  },
  authorSeparator: { 'en-US': ', ', 'zh-CN': '、' },
  viewPosts: { 'en-US': 'All {count} posts', 'zh-CN': '全部 {count} 篇' },
  untitled: { 'en-US': 'Untitled', 'zh-CN': '无标题' },
  writePost: { 'en-US': 'Write a post', 'zh-CN': '写文章' },
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
