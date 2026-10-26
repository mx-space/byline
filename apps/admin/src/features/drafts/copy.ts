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
  aheadDetail: {
    'en-US':
      'This draft has changes against the published article. Reverting leaves the published article as it is.',
    'zh-CN': '这篇相对已发布版有改动。撤销后，已发布的文章保持不变。',
  },
  cancel: {
    'en-US': 'Cancel',
    'zh-CN': '取消',
  },
  changeChanged: {
    'en-US': 'Changed',
    'zh-CN': '有改动',
  },
  changeChangedDetail: {
    'en-US': 'This draft has changes that are not published yet.',
    'zh-CN': '这篇草稿有还没发布的改动。',
  },
  changeNew: {
    'en-US': 'New',
    'zh-CN': '新文章',
  },
  changeNewDetail: {
    'en-US': 'This article has never been published.',
    'zh-CN': '这篇文章还没有发布过。',
  },
  changeSame: {
    'en-US': 'Same',
    'zh-CN': '相同',
  },
  changesNone: {
    'en-US': 'Nothing differs from the published article.',
    'zh-CN': '与已发布文章相同，没有未发布的改动。',
  },
  checkCoverMissing: {
    'en-US': 'No cover yet.',
    'zh-CN': '还没有封面。',
  },
  checkCoverOk: {
    'en-US': 'Cover is set ({source}).',
    'zh-CN': '已有封面（{source}）。',
  },
  checkLabelCover: { 'en-US': 'Cover', 'zh-CN': '封面' },
  checkLabelDescription: { 'en-US': 'Description', 'zh-CN': '描述' },
  checkLabelTitle: { 'en-US': 'Title', 'zh-CN': '标题' },
  checkLabelTranslation: { 'en-US': 'Translation', 'zh-CN': '翻译' },
  checkLengthLong: {
    'en-US': 'Too long, {used} of {limit} characters ({source}).',
    'zh-CN': '过长，已用 {used} 字，建议不超过 {limit} 字（{source}）。',
  },
  checkLengthOk: {
    'en-US': '{used} of {limit} characters ({source}).',
    'zh-CN': '已用 {used} 字，建议不超过 {limit} 字（{source}）。',
  },
  checkSectionTitle: { 'en-US': 'Checks', 'zh-CN': '检查' },
  checkSourceCover: { 'en-US': 'article cover', 'zh-CN': '文章封面' },
  checkSourceSeoImage: { 'en-US': 'SEO image', 'zh-CN': 'SEO 图片' },
  checkDescriptionMissing: {
    'en-US': 'No description yet.',
    'zh-CN': '还没有描述。',
  },
  checkSourceSeoDescription: {
    'en-US': 'SEO description',
    'zh-CN': 'SEO 描述',
  },
  checkSourceSeoTitle: { 'en-US': 'SEO title', 'zh-CN': 'SEO 标题' },
  checkSourceSummary: { 'en-US': 'summary', 'zh-CN': '摘要' },
  checkSourceTitle: { 'en-US': 'article title', 'zh-CN': '文章标题' },
  checkTitleMissing: {
    'en-US': 'No title yet.',
    'zh-CN': '还没有标题。',
  },
  checkTranslationDone: {
    'en-US': 'All {total} languages are in.',
    'zh-CN': '{total} 种语言都已齐。',
  },
  checkTranslationGap: {
    'en-US': 'Missing {langs}. {done} of {total} are in.',
    'zh-CN': '缺 {langs}，已有 {done}/{total}。',
  },
  checkTranslationLoading: {
    'en-US': 'Translation coverage is still loading.',
    'zh-CN': '翻译覆盖还在加载。',
  },
  checkTranslationNew: {
    'en-US': 'Not published yet, so translation is not checked.',
    'zh-CN': '还没发布，发布后才检查翻译。',
  },
  checkTranslationUnset: {
    'en-US': 'Translation is not set up.',
    'zh-CN': '还没有配置翻译。',
  },
  checkViewTranslation: {
    'en-US': 'View translations',
    'zh-CN': '查看译文',
  },
  changesTitle: {
    'en-US': 'Changes since published',
    'zh-CN': '相对已发布版的改动',
  },
  clearSearch: {
    'en-US': 'Clear search',
    'zh-CN': '清除搜索',
  },
  confirmDeleteBody: {
    'en-US': 'This cannot be undone. The published post stays.',
    'zh-CN': '删除后无法恢复。已发布的文章不会被删除。',
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
  revertChanges: {
    'en-US': 'Revert changes',
    'zh-CN': '撤销改动',
  },
  revertFailed: {
    'en-US': 'The changes were not reverted. Try again.',
    'zh-CN': '改动未撤销。请重试。',
  },
  reverted: {
    'en-US': 'Changes reverted',
    'zh-CN': '已撤销改动',
  },
  confirmRevertBody: {
    'en-US': 'Unpublished changes are discarded. The published article stays.',
    'zh-CN': '未发布的改动会被丢掉。已发布的文章保持不变。',
  },
  confirmRevertConfirm: {
    'en-US': 'Revert changes',
    'zh-CN': '撤销改动',
  },
  confirmRevertTitle: {
    'en-US': 'Revert changes to "{title}"?',
    'zh-CN': '撤销「{title}」的改动？',
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
  diffHistoryDirection: {
    'en-US': 'Selected version to current draft',
    'zh-CN': '所选版本 → 当前草稿',
  },
  diffLoading: {
    'en-US': 'Comparing the body',
    'zh-CN': '正在对比正文',
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
    'zh-CN': '新文章',
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
    'zh-CN': '写文章',
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
