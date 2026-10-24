import { useI18n } from '~/i18n'
import { createFeatureCopy, type FeatureCatalog } from '~/i18n/feature-copy'
import type { Locale } from '~/i18n/types'

const catalog = {
  allCategories: { 'en-US': 'All categories', 'zh-CN': '全部分类' },
  authorSeparator: { 'en-US': ', ', 'zh-CN': '、' },
  backToFirst: { 'en-US': 'Back to page 1', 'zh-CN': '回到第 1 页' },
  batchDeleted: {
    'en-US': 'Deleted {count} posts',
    'zh-CN': '已删除 {count} 篇博文',
  },
  batchPartialDescription: {
    'en-US': 'Deleted posts leave the list. Retry only the failed ones.',
    'zh-CN': '已删除的会从列表消失。可以只重试失败的。',
  },
  batchPartialTitle: {
    'en-US': '{failed} posts were not deleted',
    'zh-CN': '{failed} 篇没有删除',
  },
  batchPartialTitleOne: {
    'en-US': '1 post was not deleted',
    'zh-CN': '1 篇没有删除',
  },
  bulkDelete: { 'en-US': 'Delete selected', 'zh-CN': '删除所选' },
  byline: { 'en-US': 'Byline', 'zh-CN': '署名' },
  cancel: { 'en-US': 'Cancel', 'zh-CN': '取消' },
  categoriesFailedDescription: {
    'en-US': 'The post list is still available. Retry category loading.',
    'zh-CN': '博文列表仍可用。分类筛选可以重试。',
  },
  categoriesFailedTitle: {
    'en-US': 'Categories did not load',
    'zh-CN': '分类没有载入',
  },
  categoryFailed: {
    'en-US': 'Category did not change. Retry.',
    'zh-CN': '分类没有改成。可以重试。',
  },
  categoryLabel: { 'en-US': 'Category', 'zh-CN': '分类' },
  changeCategory: { 'en-US': 'Change category', 'zh-CN': '修改分类' },
  checkbox: { 'en-US': 'Select "{title}"', 'zh-CN': '选择「{title}」' },
  clearFilters: { 'en-US': 'Clear filters', 'zh-CN': '清除筛选' },
  clearSelection: { 'en-US': 'Clear selection', 'zh-CN': '取消选择' },
  columnTitle: { 'en-US': 'Title', 'zh-CN': '标题' },
  copyFailed: {
    'en-US': 'Nothing was written to the clipboard. Copy again.',
    'zh-CN': '没有写入剪贴板。可以再复制一次。',
  },
  copyId: { 'en-US': 'Copy ID', 'zh-CN': '复制 ID' },
  copyLabelId: { 'en-US': 'ID', 'zh-CN': 'ID' },
  copyLabelLink: { 'en-US': 'link', 'zh-CN': '链接' },
  copyLabelSlug: { 'en-US': 'slug', 'zh-CN': 'slug' },
  copyLink: { 'en-US': 'Copy link', 'zh-CN': '复制链接' },
  copyMissing: {
    'en-US': 'No {label} to copy',
    'zh-CN': '没有可复制的 {label}',
  },
  copySlug: { 'en-US': 'Copy slug', 'zh-CN': '复制 slug' },
  copySucceeded: { 'en-US': 'Copied {label}', 'zh-CN': '已复制 {label}' },
  countOne: { 'en-US': '1 post', 'zh-CN': '1 篇' },
  countOther: { 'en-US': '{count} posts', 'zh-CN': '{count} 篇' },
  deleteBatchOk: {
    'en-US': 'Delete {count} posts',
    'zh-CN': '删除 {count} 篇博文',
  },
  deleteBatchTitle: {
    'en-US': 'Delete {count} posts?',
    'zh-CN': '删除 {count} 篇博文？',
  },
  deleteBody: {
    'en-US':
      'This cannot be undone. Published content disappears from the API.',
    'zh-CN': '删除后无法恢复。已发布内容会从 API 消失。',
  },
  deleteFailed: {
    'en-US': 'Delete did not finish. Retry.',
    'zh-CN': '删除没有完成。可以重试。',
  },
  deleteOk: { 'en-US': 'Delete post', 'zh-CN': '删除博文' },
  deletePost: { 'en-US': 'Delete post', 'zh-CN': '删除博文' },
  deleteTitle: { 'en-US': 'Delete "{title}"?', 'zh-CN': '删除「{title}」？' },
  deleted: { 'en-US': 'Post deleted', 'zh-CN': '已删除博文' },
  draft: { 'en-US': 'Draft', 'zh-CN': '草稿' },
  scheduled: { 'en-US': 'Scheduled', 'zh-CN': '待公开' },
  edit: { 'en-US': 'Edit', 'zh-CN': '编辑' },
  emptyValue: { 'en-US': '--', 'zh-CN': '--' },
  errorDescription: {
    'en-US': 'The service did not return the list. Retry.',
    'zh-CN': '服务暂时没有返回列表。可以重试。',
  },
  errorTitle: { 'en-US': 'Posts did not load', 'zh-CN': '博文没有载入' },
  filterDisabled: {
    'en-US': 'Category and sort stay off during keyword search.',
    'zh-CN': '正在按关键词搜索，分类和排序暂不生效。',
  },
  filterEmptyDescription: {
    'en-US': 'Try another keyword or category, or clear the filters.',
    'zh-CN': '换关键词或分类，或清除当前筛选。',
  },
  filterEmptyTitle: {
    'en-US': 'No posts match',
    'zh-CN': '没有符合条件的博文',
  },
  firstEmptyDescription: {
    'en-US':
      'After you write one, decide here whether to edit it or check the byline and updated time.',
    'zh-CN': '写一篇之后，从这里决定修改，或先看署名和更新时间。',
  },
  firstEmptyTitle: { 'en-US': 'No posts yet', 'zh-CN': '还没有博文' },
  id: { 'en-US': 'ID', 'zh-CN': 'ID' },
  more: { 'en-US': 'More actions', 'zh-CN': '更多操作' },
  openLink: { 'en-US': 'Open link', 'zh-CN': '打开链接' },
  pageEmptyDescription: {
    'en-US': 'Go back to page 1.',
    'zh-CN': '回到第 1 页继续查看。',
  },
  pageEmptyTitle: {
    'en-US': 'This page has no posts',
    'zh-CN': '这一页没有博文',
  },
  pinFailed: {
    'en-US': 'Pin did not change. Retry.',
    'zh-CN': '置顶没有改成。可以重试。',
  },
  pinToggle: { 'en-US': 'Pin', 'zh-CN': '置顶' },
  pinned: { 'en-US': 'Pinned', 'zh-CN': '已置顶' },
  publishFailed: {
    'en-US': 'Publish state did not change. Retry.',
    'zh-CN': '发布状态没有改成。可以重试。',
  },
  publishToggle: { 'en-US': 'Published', 'zh-CN': '已发布' },
  published: { 'en-US': 'Published', 'zh-CN': '已发布' },
  refresh: { 'en-US': 'Refresh list', 'zh-CN': '刷新列表' },
  retry: { 'en-US': 'Retry', 'zh-CN': '重试' },
  retryFailed: { 'en-US': 'Retry delete', 'zh-CN': '重试删除' },
  searchLabel: { 'en-US': 'Search posts', 'zh-CN': '搜索博文' },
  searchPlaceholder: { 'en-US': 'Title or byline', 'zh-CN': '标题或署名' },
  selectAll: { 'en-US': 'Select page', 'zh-CN': '选择本页' },
  selected: { 'en-US': '{count} selected', 'zh-CN': '已选 {count} 项' },
  slowDescription: {
    'en-US': 'Still waiting on the service. Retry, or keep waiting.',
    'zh-CN': '仍在等待服务返回。可以重试，或继续等待。',
  },
  slowTitle: {
    'en-US': 'Loading is past 10 seconds',
    'zh-CN': '载入已超过 10 秒',
  },
  slug: { 'en-US': 'slug', 'zh-CN': 'slug' },
  sortCreatedAsc: { 'en-US': 'Oldest created', 'zh-CN': '最早创建' },
  sortCreatedDesc: { 'en-US': 'Newest created', 'zh-CN': '最近创建' },
  sortLabel: { 'en-US': 'Sort', 'zh-CN': '排序' },
  sortModifiedAsc: {
    'en-US': 'Least recently updated',
    'zh-CN': '最早更新',
  },
  sortModifiedDesc: { 'en-US': 'Recently updated', 'zh-CN': '最近更新' },
  sortPinnedAsc: { 'en-US': 'Least recently pinned', 'zh-CN': '最早置顶' },
  sortPinnedDesc: { 'en-US': 'Recently pinned', 'zh-CN': '最近置顶' },
  staleDescription: {
    'en-US': 'This is still the previous list. Retry.',
    'zh-CN': '当前仍是上次载入的列表。可以重试。',
  },
  staleTitle: { 'en-US': 'Refresh did not finish', 'zh-CN': '刷新没有成功' },
  status: { 'en-US': 'Status', 'zh-CN': '状态' },
  title: { 'en-US': 'Posts', 'zh-CN': '博文' },
  uncategorized: { 'en-US': 'Uncategorized', 'zh-CN': '未分类' },
  untitled: { 'en-US': 'Untitled', 'zh-CN': '无标题' },
  updated: { 'en-US': 'Updated', 'zh-CN': '更新时间' },
  write: { 'en-US': 'Write post', 'zh-CN': '写博文' },
} satisfies FeatureCatalog<string>

export const postCopy = createFeatureCopy(catalog)

export type PostCopyKey = keyof typeof catalog

export type PostCopy = (
  key: PostCopyKey,
  values?: Record<string, number | string>,
) => string

export function formatPostCount(copy: PostCopy, count: number) {
  return count === 1 ? copy('countOne') : copy('countOther', { count })
}

export function usePostCopy(): PostCopy {
  const { locale } = useI18n()
  return (key, values) => postCopy(locale as Locale, key, values)
}
