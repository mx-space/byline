import { createFeatureCopy } from '~/i18n/feature-copy'

export const writeCopy = createFeatureCopy({
  publicAt: { 'en-US': 'Public time', 'zh-CN': '定时公开' },
  publicAtPlaceholder: {
    'en-US': 'Publish immediately',
    'zh-CN': '留空则立即公开',
  },
  publicAtHint: {
    'en-US':
      'Complete publishing to schedule visibility. Uses your local time. Clear and publish again to make it public now.',
    'zh-CN': '完成发布后才会按本地时间定时公开。清空时间并再次发布可立即公开。',
  },
  scheduled: { 'en-US': 'Scheduled', 'zh-CN': '定时发布' },
  scheduledFor: { 'en-US': 'Public at {time}', 'zh-CN': '将于 {time} 公开' },
  aiTitle: {
    'en-US': 'AI chat',
    'zh-CN': 'AI 对话',
  },
  back: {
    'en-US': 'Back to posts',
    'zh-CN': '返回文章',
  },
  byline: {
    'en-US': 'Byline',
    'zh-CN': '署名',
  },
  category: {
    'en-US': 'Category',
    'zh-CN': '分类',
  },
  categoryEmpty: {
    'en-US': 'No categories yet. Create one before publishing.',
    'zh-CN': '还没有分类。先创建分类，再发布。',
  },
  categoryFailed: {
    'en-US': 'Categories did not load. Refresh and try again.',
    'zh-CN': '分类没有载入。刷新后重试。',
  },
  categoryPlaceholder: {
    'en-US': 'Choose a category',
    'zh-CN': '选择分类',
  },
  closeAi: {
    'en-US': 'Close AI chat',
    'zh-CN': '关闭 AI 对话',
  },
  cover: {
    'en-US': 'Cover',
    'zh-CN': '封面',
  },
  coverAlt: {
    'en-US': 'Cover',
    'zh-CN': '封面',
  },
  coverUnset: {
    'en-US': 'Not set',
    'zh-CN': '未配置',
  },
  createCategory: {
    'en-US': 'Create category',
    'zh-CN': '创建分类',
  },
  details: {
    'en-US': 'Details',
    'zh-CN': '文稿信息',
  },
  draft: {
    'en-US': 'Draft',
    'zh-CN': '草稿',
  },
  fresh: {
    'en-US': 'New draft',
    'zh-CN': '新草稿',
  },
  generateSlug: {
    'en-US': 'Generate slug',
    'zh-CN': '生成 Slug',
  },
  generateTitleSlug: {
    'en-US': 'Generate title and slug',
    'zh-CN': '生成标题和 Slug',
  },
  loadFailed: {
    'en-US': 'This post did not load. Refresh and try again.',
    'zh-CN': '文章没有载入。刷新后重试。',
  },
  matchesLive: {
    'en-US': 'Matches the live post. Nothing new to publish.',
    'zh-CN': '与线上一致，没有可发布的改动。',
  },
  more: {
    'en-US': 'More',
    'zh-CN': '更多',
  },
  moreTags: {
    'en-US': '{count} more tags',
    'zh-CN': '还有 {count} 个标签',
  },
  needContent: {
    'en-US': 'Write a title or body before saving.',
    'zh-CN': '先写标题或正文，再保存。',
  },
  offline: {
    'en-US': 'Not published',
    'zh-CN': '未发布',
  },
  openAi: {
    'en-US': 'Open AI chat',
    'zh-CN': '打开 AI 对话',
  },
  pin: {
    'en-US': 'Pin',
    'zh-CN': '置顶',
  },
  publishDate: {
    'en-US': 'Publish date',
    'zh-CN': '发布日期',
  },
  pinOrder: {
    'en-US': 'Pin order',
    'zh-CN': '置顶顺序',
  },
  post: {
    'en-US': 'Post',
    'zh-CN': '文章',
  },
  publicPath: {
    'en-US': 'Public path',
    'zh-CN': '公开路径',
  },
  publish: {
    'en-US': 'Publish',
    'zh-CN': '发布',
  },
  publishing: {
    'en-US': 'Publishing. The draft stays until this finishes.',
    'zh-CN': '发布中。完成前草稿会保留。',
  },
  republish: {
    'en-US': 'Publish again',
    'zh-CN': '重新发布',
  },
  retry: {
    'en-US': 'Retry',
    'zh-CN': '重试',
  },
  save: {
    'en-US': 'Save',
    'zh-CN': '保存',
  },
  saved: {
    'en-US': 'Saved',
    'zh-CN': '已保存',
  },
  saving: {
    'en-US': 'Saving',
    'zh-CN': '保存中',
  },
  slug: {
    'en-US': 'URL',
    'zh-CN': '路径',
  },
  copyPath: {
    'en-US': 'Copy path',
    'zh-CN': '复制路径',
  },
  copied: {
    'en-US': 'Copied',
    'zh-CN': '已复制',
  },
  coverEmpty: {
    'en-US': 'None',
    'zh-CN': '未设置',
  },
  coverSet: {
    'en-US': 'Set',
    'zh-CN': '已设置',
  },
  notConfigured: {
    'en-US': 'Not configured',
    'zh-CN': '未配置',
  },
  configured: {
    'en-US': 'Configured',
    'zh-CN': '已配置',
  },
  itemCountOne: {
    'en-US': '1 item',
    'zh-CN': '1 条',
  },
  itemCount: {
    'en-US': '{count} items',
    'zh-CN': '{count} 条',
  },
  backToSettings: {
    'en-US': 'Back',
    'zh-CN': '返回',
  },
  slugPlaceholder: {
    'en-US': 'post-title',
    'zh-CN': 'post-title',
  },
  submitted: {
    'en-US': 'Submitted. The task is still running.',
    'zh-CN': '已提交，任务还在跑。',
  },
  summary: {
    'en-US': 'Summary',
    'zh-CN': '摘要',
  },
  tags: {
    'en-US': 'Tags',
    'zh-CN': '标签',
  },
  title: {
    'en-US': 'Title',
    'zh-CN': '标题',
  },
  titlePlaceholder: {
    'en-US': 'Post title',
    'zh-CN': '文章标题',
  },
  unpublish: {
    'en-US': 'Unpublish',
    'zh-CN': '撤回发布',
  },
  deletePost: {
    'en-US': 'Delete post',
    'zh-CN': '删除文章',
  },
  unsaved: {
    'en-US': 'Unsaved',
    'zh-CN': '未保存',
  },
  untitled: {
    'en-US': 'Untitled',
    'zh-CN': '未命名',
  },
  updateOnline: {
    'en-US': 'Update live post',
    'zh-CN': '更新线上',
  },
  viewTask: {
    'en-US': 'View task',
    'zh-CN': '查看任务',
  },
  hideSettings: {
    'en-US': 'Hide post settings',
    'zh-CN': '收起文章设置',
  },
  liveAt: {
    'en-US': 'Live at',
    'zh-CN': '线上地址',
  },
  matchesLiveShort: {
    'en-US': 'Matches live',
    'zh-CN': '与线上一致',
  },
  noByline: {
    'en-US': 'No byline',
    'zh-CN': '未署名',
  },
  notPublished: {
    'en-US': 'Not published yet. Publish to get a public URL.',
    'zh-CN': '还没有发布。发布后会生成公开地址。',
  },
  publishingShort: {
    'en-US': 'Publishing',
    'zh-CN': '发布中',
  },
  savedAt: {
    'en-US': 'Saved {time}',
    'zh-CN': '已保存 · {time}',
  },
  sectionAdvanced: {
    'en-US': 'Advanced',
    'zh-CN': '高级',
  },
  sectionBasics: {
    'en-US': 'Basics',
    'zh-CN': '基本信息',
  },
  sectionCover: {
    'en-US': 'Cover',
    'zh-CN': '封面',
  },
  sectionPublish: {
    'en-US': 'Publishing',
    'zh-CN': '发布',
  },
  sectionSeo: {
    'en-US': 'SEO',
    'zh-CN': 'SEO',
  },
  viewAllLocales: {
    'en-US': 'View all languages',
    'zh-CN': '查看全部语言',
  },
  sectionSummary: {
    'en-US': 'Summary and tags',
    'zh-CN': '摘要与标签',
  },
  settings: {
    'en-US': 'Post settings',
    'zh-CN': '文章设置',
  },
  showSettings: {
    'en-US': 'Show post settings',
    'zh-CN': '展开文章设置',
  },
  submittedShort: {
    'en-US': 'Publish submitted',
    'zh-CN': '已提交发布',
  },
  tagsPlaceholder: {
    'en-US': 'Type or pick tags',
    'zh-CN': '输入或选择标签',
  },
  unsavedChanges: {
    'en-US': 'Unsaved changes',
    'zh-CN': '有未保存的改动',
  },
  openLive: {
    'en-US': 'Open live post',
    'zh-CN': '打开线上页面',
  },
  published: {
    'en-US': 'Published',
    'zh-CN': '已发布',
  },
})
