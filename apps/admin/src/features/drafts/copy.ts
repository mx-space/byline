import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

export const draftCopy = createFeatureCopy({
  authorJoin: {
    'en-US': ', ',
    'zh-CN': '、',
  },
  backToList: {
    'en-US': 'Back to list',
    'zh-CN': '返回列表',
  },
  behindDetail: {
    'en-US':
      'The published post is newer than this draft. Check the diff before you continue.',
    'zh-CN': '已发布版比这篇草稿新。继续编辑前先看正文差异。',
  },
  bodyTitle: {
    'en-US': 'Body',
    'zh-CN': '正文',
  },
  bulkDelete: {
    'en-US': 'Delete',
    'zh-CN': '删除',
  },
  cancel: {
    'en-US': 'Cancel',
    'zh-CN': '取消',
  },
  changeBehind: {
    'en-US': 'Behind published',
    'zh-CN': '落后于已发布版',
  },
  changeChanged: {
    'en-US': 'Unpublished changes',
    'zh-CN': '有未发布改动',
  },
  changeNew: {
    'en-US': 'New post',
    'zh-CN': '新博文',
  },
  changeSame: {
    'en-US': 'Matches published',
    'zh-CN': '与已发布版相同',
  },
  changesNone: {
    'en-US': 'Nothing differs from the published post.',
    'zh-CN': '与已发布版相同，没有未发布改动。',
  },
  changesTitle: {
    'en-US': 'Changes since published',
    'zh-CN': '相对已发布版的改动',
  },
  checkboxAria: {
    'en-US': 'Select draft "{title}"',
    'zh-CN': '选择草稿「{title}」',
  },
  clearSearch: {
    'en-US': 'Clear search',
    'zh-CN': '清除搜索',
  },
  clearSelection: {
    'en-US': 'Clear selection',
    'zh-CN': '取消选择',
  },
  conflict: {
    'en-US': 'Conflict',
    'zh-CN': '冲突',
  },
  conflictDetail: {
    'en-US':
      'This draft and the published post both changed. Continue editing to merge them. Deleting the draft leaves the published post unchanged.',
    'zh-CN':
      '草稿和已发布版各自有改动。继续编辑可在写作页合并。删除草稿不会改动已发布的博文。',
  },
  confirmBatchBody: {
    'en-US': 'This cannot be undone. Published posts stay.',
    'zh-CN': '删除后无法恢复。已发布的博文不会被删除。',
  },
  confirmBatchConfirm: {
    'en-US': 'Delete {count} drafts',
    'zh-CN': '删除 {count} 篇草稿',
  },
  confirmBatchTitle: {
    'en-US': 'Delete {count} drafts?',
    'zh-CN': '删除 {count} 篇草稿？',
  },
  confirmDeleteBody: {
    'en-US': 'This cannot be undone. The published post stays.',
    'zh-CN': '删除后无法恢复。已发布的博文不会被删除。',
  },
  confirmDeleteConfirm: {
    'en-US': 'Delete draft',
    'zh-CN': '删除草稿',
  },
  confirmDeleteTitle: {
    'en-US': 'Delete draft "{title}"?',
    'zh-CN': '删除草稿「{title}」？',
  },
  continueWriting: {
    'en-US': 'Continue editing',
    'zh-CN': '继续编辑',
  },
  currentVersion: {
    'en-US': 'Current',
    'zh-CN': '当前',
  },
  deleteDraft: {
    'en-US': 'Delete draft',
    'zh-CN': '删除草稿',
  },
  deleteFailed: {
    'en-US': 'The draft was not deleted. Try again.',
    'zh-CN': '草稿未删除。请重试。',
  },
  deleted: {
    'en-US': 'Draft deleted',
    'zh-CN': '已删除草稿',
  },
  deletedPartial: {
    'en-US': 'Deleted {success}. {failed} failed',
    'zh-CN': '已删除 {success} 篇，{failed} 篇失败',
  },
  detailErrorBody: {
    'en-US': 'The network or service is unavailable.',
    'zh-CN': '网络或服务暂时不可用。',
  },
  detailErrorTitle: {
    'en-US': 'This draft did not load',
    'zh-CN': '这篇草稿没有加载',
  },
  detailIdleTitle: {
    'en-US': 'Select a draft',
    'zh-CN': '选择一篇草稿',
  },
  detailMissingBody: {
    'en-US': 'It may have been deleted or published.',
    'zh-CN': '它可能已被删除或发布。',
  },
  detailMissingTitle: {
    'en-US': 'Draft not found',
    'zh-CN': '未找到这篇草稿',
  },
  diffDirectionPublished: {
    'en-US': 'Published to current draft',
    'zh-CN': '已发布版 → 当前草稿',
  },
  diffDraftFile: {
    'en-US': 'Current draft',
    'zh-CN': '当前草稿',
  },
  diffEmpty: {
    'en-US': 'Both sides have no body.',
    'zh-CN': '两边都没有正文。',
  },
  diffFailed: {
    'en-US': 'The diff did not render. You can still continue this draft.',
    'zh-CN': '正文差异没有显示。可继续编辑这篇草稿。',
  },
  diffHistoryDirection: {
    'en-US': 'Selected version to current draft',
    'zh-CN': '所选版本 → 当前草稿',
  },
  diffHistoryFile: {
    'en-US': 'Selected version',
    'zh-CN': '所选版本',
  },
  diffLoading: {
    'en-US': 'Comparing the body',
    'zh-CN': '正在对比正文',
  },
  diffMarkdownTitle: {
    'en-US': 'Body diff',
    'zh-CN': '正文差异',
  },
  diffPublishedFile: {
    'en-US': 'Published',
    'zh-CN': '已发布版',
  },
  diffRichFailed: {
    'en-US': 'The rich text did not parse. You can still continue this draft.',
    'zh-CN': '富文本没有解析。可继续编辑这篇草稿。',
  },
  diffRichTitle: {
    'en-US': 'Body diff',
    'zh-CN': '正文差异',
  },
  emptyValue: {
    'en-US': '--',
    'zh-CN': '--',
  },
  fieldAuthors: {
    'en-US': 'Byline',
    'zh-CN': '署名',
  },
  fieldBody: {
    'en-US': 'Body',
    'zh-CN': '正文',
  },
  fieldCategory: {
    'en-US': 'Category',
    'zh-CN': '分类',
  },
  fieldCover: {
    'en-US': 'Cover',
    'zh-CN': '封面',
  },
  fieldSlug: {
    'en-US': 'Slug',
    'zh-CN': 'Slug',
  },
  fieldSummary: {
    'en-US': 'Summary',
    'zh-CN': '摘要',
  },
  fieldTags: {
    'en-US': 'Tags',
    'zh-CN': '标签',
  },
  fieldTitle: {
    'en-US': 'Title',
    'zh-CN': '标题',
  },
  fieldWords: {
    'en-US': 'Length',
    'zh-CN': '字数',
  },
  filterAll: {
    'en-US': 'All',
    'zh-CN': '全部',
  },
  filterChanged: {
    'en-US': 'Changes',
    'zh-CN': '改动',
  },
  filterEmptyBody: {
    'en-US': 'Try another title or phrase.',
    'zh-CN': '换一个标题或正文再搜。',
  },
  filterEmptyTitle: {
    'en-US': 'No matching drafts',
    'zh-CN': '没有符合条件的草稿',
  },
  filterLabel: {
    'en-US': 'Draft type',
    'zh-CN': '草稿类型',
  },
  filterNew: {
    'en-US': 'New posts',
    'zh-CN': '新博文',
  },
  historyCount: {
    'en-US': 'History · {count}',
    'zh-CN': '历史版本 · {count}',
  },
  historyEmpty: {
    'en-US': 'No earlier versions.',
    'zh-CN': '没有更早的版本。',
  },
  historyError: {
    'en-US': 'History did not load.',
    'zh-CN': '历史版本没有加载。',
  },
  historyShowAll: {
    'en-US': 'Show all {count}',
    'zh-CN': '显示全部 {count} 个',
  },
  historyTitle: {
    'en-US': 'History',
    'zh-CN': '历史版本',
  },
  listEmptyAction: {
    'en-US': 'Write a post',
    'zh-CN': '写博文',
  },
  listEmptyBody: {
    'en-US': 'The editor saves drafts here as you write.',
    'zh-CN': '写作时会自动保存到这里。',
  },
  listEmptyTitle: {
    'en-US': 'No drafts',
    'zh-CN': '没有草稿',
  },
  listErrorBody: {
    'en-US': 'The network or service is unavailable.',
    'zh-CN': '网络或服务暂时不可用。',
  },
  listErrorTitle: {
    'en-US': 'Drafts did not load',
    'zh-CN': '草稿列表没有加载',
  },
  noBody: {
    'en-US': 'This draft has no body yet.',
    'zh-CN': '这篇草稿还没有正文。',
  },
  openDetail: {
    'en-US': 'Open',
    'zh-CN': '查看',
  },
  overviewTitle: {
    'en-US': 'Overview',
    'zh-CN': '概况',
  },
  refresh: {
    'en-US': 'Refresh',
    'zh-CN': '刷新',
  },
  restore: {
    'en-US': 'Continue from this version',
    'zh-CN': '从此版本继续',
  },
  retry: {
    'en-US': 'Retry',
    'zh-CN': '重试',
  },
  savedAt: {
    'en-US': 'Saved {time}',
    'zh-CN': '保存于 {time}',
  },
  searchLabel: {
    'en-US': 'Search drafts',
    'zh-CN': '搜索草稿',
  },
  searchPlaceholder: {
    'en-US': 'Search title or body',
    'zh-CN': '搜索标题或正文',
  },
  selectAll: {
    'en-US': 'Select page',
    'zh-CN': '全选当前页',
  },
  selectedCount: {
    'en-US': '{count} selected',
    'zh-CN': '已选 {count} 篇',
  },
  sortLabel: {
    'en-US': 'Sort',
    'zh-CN': '排序',
  },
  sortOldest: {
    'en-US': 'Oldest saved',
    'zh-CN': '最早保存',
  },
  sortSaved: {
    'en-US': 'Last saved',
    'zh-CN': '最近保存',
  },
  sortTitle: {
    'en-US': 'Title',
    'zh-CN': '标题',
  },
  statusSaved: {
    'en-US': 'Saved · {time}',
    'zh-CN': '已保存 · {time}',
  },
  statusSavedTooltip: {
    'en-US': 'Saved {time}',
    'zh-CN': '已保存 {time}',
  },
  statusSaving: {
    'en-US': 'Saving',
    'zh-CN': '保存中',
  },
  statusUnsaved: {
    'en-US': 'Unsaved',
    'zh-CN': '未保存',
  },
  tabDiff: {
    'en-US': 'Diff',
    'zh-CN': '差异',
  },
  tabPreview: {
    'en-US': 'Preview',
    'zh-CN': '预览',
  },
  title: {
    'en-US': 'Drafts',
    'zh-CN': '草稿',
  },
  untitled: {
    'en-US': 'Untitled',
    'zh-CN': '无标题',
  },
  versionSame: {
    'en-US': 'Same body',
    'zh-CN': '正文相同',
  },
  wordCount: {
    'en-US': '{count} words',
    'zh-CN': '{count} 字',
  },
  wordDelta: {
    'en-US': '{delta} words',
    'zh-CN': '{delta} 字',
  },
})

export type DraftCopyKey = Parameters<typeof draftCopy>[1]

export type DraftCopyFn = (
  key: DraftCopyKey,
  values?: Record<string, number | string>,
) => string

export function useDraftCopy() {
  const { format, locale } = useI18n()
  const copy = useCallback<DraftCopyFn>(
    (key, values) => draftCopy(locale, key, values),
    [locale],
  )
  return { copy, format, locale }
}
