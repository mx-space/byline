import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

const catalog = {
  hubTitle: { 'zh-CN': '产物', 'en-US': 'Outputs' },
  hubDescription: {
    'zh-CN': '查看每篇文章的译文、摘要、精读和朗读是否齐全，并补齐缺口。',
    'en-US':
      'See which posts lack translations, summaries, close readings, or narration, and fill the gaps.',
  },
  hubTabs: { 'zh-CN': '产物', 'en-US': 'Outputs' },
  tabOverview: { 'zh-CN': '概览', 'en-US': 'Overview' },
  tabTranslation: { 'zh-CN': '翻译', 'en-US': 'Translation' },
  tabSummary: { 'zh-CN': '摘要', 'en-US': 'Summary' },
  tabInsights: { 'zh-CN': '精读', 'en-US': 'Close reading' },
  tabTts: { 'zh-CN': '朗读', 'en-US': 'Narration' },
  untitled: { 'zh-CN': '无标题', 'en-US': 'Untitled' },
  columnPost: { 'zh-CN': '文章', 'en-US': 'Post' },
  columnStatus: { 'zh-CN': '状态', 'en-US': 'Status' },
  columnUpdated: { 'zh-CN': '更新', 'en-US': 'Updated' },
  sourceUnknown: {
    'zh-CN': '未声明原文语言',
    'en-US': 'Source language not set',
  },
  stateDone: { 'zh-CN': '已齐', 'en-US': 'Complete' },
  stateMissingLangs: { 'zh-CN': '缺 {langs}', 'en-US': 'Missing {langs}' },
  stateMissingCount: {
    'zh-CN': '缺 {count} 种语言',
    'en-US': '{count} languages missing',
  },
  stateNa: { 'zh-CN': '不适用', 'en-US': 'Not applicable' },
  stateNone: { 'zh-CN': '未配置', 'en-US': 'Not set up' },
  stateNoneHint: {
    'zh-CN': '在 AI 设置里为它选择目标语言后才会计入缺口。',
    'en-US': 'Pick target languages in AI settings to track gaps.',
  },
  langCount: { 'zh-CN': '{count} 种语言', 'en-US': '{count} languages' },
  anchorNav: { 'zh-CN': '快速导航', 'en-US': 'On this page' },
  langProgress: { 'zh-CN': '{done}/{total}', 'en-US': '{done}/{total}' },
  langDone: { 'zh-CN': '已生成', 'en-US': 'Generated' },
  filterAllPosts: { 'zh-CN': '全部', 'en-US': 'All' },
  filterGaps: { 'zh-CN': '只看有缺口', 'en-US': 'With gaps' },
  filterGapsLabel: { 'zh-CN': '缺口筛选', 'en-US': 'Gap filter' },
  filterCapabilityLabel: { 'zh-CN': '内容类型', 'en-US': 'Content type' },
  capabilityAll: { 'zh-CN': '全部类型', 'en-US': 'All types' },
  metricCapabilityGaps: {
    'zh-CN': '{capability}缺口',
    'en-US': '{capability} gaps',
  },
  metricItems: { 'zh-CN': '缺 {count} 项', 'en-US': '{count} missing' },
  fillGaps: { 'zh-CN': '补齐缺失', 'en-US': 'Fill gaps' },
  fillAll: { 'zh-CN': '补齐全部缺口', 'en-US': 'Fill all gaps' },
  fillTitle: {
    'zh-CN': '补齐 {count} 篇文章的缺口',
    'en-US': 'Fill gaps in {count} posts',
  },
  fillLine: {
    'zh-CN': '{posts} 篇 · {items} 项',
    'en-US': '{posts} posts · {items} items',
  },
  fillHint: {
    'zh-CN': '只生成缺失的语言，不替换已有内容。目标语言来自 AI 设置。',
    'en-US':
      'Only missing languages are generated; existing output is kept. Target languages come from AI settings.',
  },
  fillNothing: {
    'zh-CN': '选中的文章没有可补的缺口。',
    'en-US': 'The selected posts have no gaps to fill.',
  },
  fillConfirm: { 'zh-CN': '开始补齐', 'en-US': 'Start' },
  fillStarted: {
    'zh-CN': '已提交 {count} 个任务',
    'en-US': '{count} tasks submitted',
  },
  fillPartial: {
    'zh-CN': '已提交 {created} 个任务，{failed} 个没有创建',
    'en-US': '{created} tasks submitted, {failed} not created',
  },
  fillSomeFailed: {
    'zh-CN': '有 {count} 个任务没有创建',
    'en-US': '{count} tasks were not created',
  },
  selectedPosts: { 'zh-CN': '已选 {count} 篇', 'en-US': '{count} selected' },
  clearSelection: { 'zh-CN': '取消选择', 'en-US': 'Clear selection' },
  openPostOverview: { 'zh-CN': '打开文章概览', 'en-US': 'Open post overview' },
  more: { 'zh-CN': '更多', 'en-US': 'More' },
  showAllPosts: { 'zh-CN': '查看全部文章', 'en-US': 'Show all posts' },
  noGapsTitle: { 'zh-CN': '没有缺口', 'en-US': 'No gaps' },
  noGapsBody: {
    'zh-CN': '符合条件的文章都已齐全。',
    'en-US': 'Every matching post is complete.',
  },
  listStale: {
    'zh-CN': '列表没有刷新，显示的是上次加载的内容',
    'en-US': 'The list did not refresh; showing the last loaded data',
  },
  close: { 'zh-CN': '关闭', 'en-US': 'Close' },
  loadingPost: { 'zh-CN': '正在加载', 'en-US': 'Loading' },
  editPost: { 'zh-CN': '编辑文章', 'en-US': 'Edit post' },
  view: { 'zh-CN': '查看', 'en-US': 'View' },
  regenerate: { 'zh-CN': '重新生成', 'en-US': 'Regenerate' },
  delete: { 'zh-CN': '删除', 'en-US': 'Delete' },
  generateKind: { 'zh-CN': '生成{kind}', 'en-US': 'Generate {kind}' },
  sectionEmpty: { 'zh-CN': '还没有生成', 'en-US': 'Nothing generated yet' },
  translationPair: { 'zh-CN': '{from} → {to}', 'en-US': '{from} → {to}' },
  totalPosts: { 'zh-CN': '共 {count} 篇文章', 'en-US': '{count} posts' },
  searchPosts: { 'zh-CN': '搜索文章', 'en-US': 'Search posts' },
  refresh: { 'zh-CN': '刷新', 'en-US': 'Refresh' },
  retryLoad: { 'zh-CN': '重试', 'en-US': 'Retry' },
  cancel: { 'zh-CN': '取消', 'en-US': 'Cancel' },
  back: { 'zh-CN': '返回列表', 'en-US': 'Back to list' },
  emptyPostsTitle: { 'zh-CN': '还没有文章', 'en-US': 'No posts yet' },
  emptyPostsBody: {
    'zh-CN': '发布后，文章会列在这里。',
    'en-US': 'Posts appear here after they are published.',
  },
  filterEmptyTitle: {
    'zh-CN': '没有符合条件的文章',
    'en-US': 'No posts match',
  },
  filterEmptyBody: {
    'zh-CN': '换个标题再搜，或清除搜索。',
    'en-US': 'Try another title, or clear the search.',
  },
  clearSearch: { 'zh-CN': '清除搜索', 'en-US': 'Clear search' },
  listFailedTitle: {
    'zh-CN': '文章列表没有加载出来',
    'en-US': 'The post list did not load',
  },
  listFailedBody: {
    'zh-CN': '网络或服务暂时不可用。',
    'en-US': 'The network or service is unavailable.',
  },
  post: { 'zh-CN': '文章', 'en-US': 'Post' },
  locked: { 'zh-CN': '不覆盖', 'en-US': 'Kept' },
  localeMetaTitle: { 'zh-CN': 'SEO 与摘要', 'en-US': 'SEO and summary' },
  localeMetaDescription: {
    'zh-CN':
      '每种语言实际使用的 SEO 标题、SEO 描述和 AI 摘要。点一行打开该语言的编辑。',
    'en-US':
      'The SEO title, SEO description and AI summary each language uses. Click a row to edit that language.',
  },
  localeMetaLang: { 'zh-CN': '语言', 'en-US': 'Language' },
  localeMetaSeoTitle: { 'zh-CN': 'SEO 标题', 'en-US': 'SEO title' },
  localeMetaSeoDescription: { 'zh-CN': 'SEO 描述', 'en-US': 'SEO description' },
  localeMetaSummary: { 'zh-CN': 'AI 摘要', 'en-US': 'AI summary' },
  localeMetaSourceLang: { 'zh-CN': '原文', 'en-US': 'Source' },
  localeMetaHuman: { 'zh-CN': '人工', 'en-US': 'Human' },
  localeMetaLocked: { 'zh-CN': '人工 · 已锁定', 'en-US': 'Human · Locked' },
  localeMetaAi: { 'zh-CN': 'AI', 'en-US': 'AI' },
  localeMetaInherited: { 'zh-CN': '沿用原文', 'en-US': 'From source' },
  localeMetaEmpty: { 'zh-CN': '空', 'en-US': 'Empty' },
  localeMetaShowMore: {
    'zh-CN': '展开其余 {count} 种语言',
    'en-US': 'Show {count} more languages',
  },
  localeMetaShowLess: { 'zh-CN': '收起', 'en-US': 'Show less' },
  lockedHint: {
    'zh-CN': '重新生成和发布不会替换这条译文。改过或导入的译文可以这样保住。',
    'en-US':
      'Regeneration and publishing leave this translation in place. Use it for edited or imported text.',
  },
  generating: { 'zh-CN': '生成中', 'en-US': 'Generating' },
  failed: { 'zh-CN': '失败', 'en-US': 'Failed' },
  missing: { 'zh-CN': '缺失', 'en-US': 'Missing' },
  ready: { 'zh-CN': '已有', 'en-US': 'Ready' },
  incomplete: { 'zh-CN': '未读完', 'en-US': 'Incomplete' },
  gapCount: { 'zh-CN': '缺 {count}', 'en-US': '{count} missing' },
  complete: { 'zh-CN': '已齐', 'en-US': 'Complete' },
  kindTranslation: { 'zh-CN': '译文', 'en-US': 'Translation' },
  kindSummary: { 'zh-CN': '摘要', 'en-US': 'Summary' },
  kindInsights: { 'zh-CN': '精读', 'en-US': 'Close reading' },
  kindTts: { 'zh-CN': '朗读', 'en-US': 'Narration' },
  retry: { 'zh-CN': '重试', 'en-US': 'Retry' },
  fillOne: { 'zh-CN': '补齐{kind}', 'en-US': 'Fill {kind}' },
  replaceTitle: {
    'zh-CN': '替换这些译文？',
    'en-US': 'Replace these translations?',
  },
  replaceBody: {
    'zh-CN': '这些译文会重新生成。标成「不覆盖」的语言会跳过。',
    'en-US':
      'These translations are generated again. Languages marked Kept are skipped.',
  },
  replaceConfirm: {
    'zh-CN': '替换译文',
    'en-US': 'Replace translations',
  },
  overwriteTitle: {
    'zh-CN': '连不覆盖的译文也替换？',
    'en-US': 'Replace kept translations too?',
  },
  overwriteBody: {
    'zh-CN': '{langs} 标成了不覆盖。继续的话，这些译文也会被替换。',
    'en-US':
      '{langs} are marked Kept. Continuing replaces those translations too.',
  },
  overwriteLocked: {
    'zh-CN': '仍然替换',
    'en-US': 'Replace anyway',
  },
  summaryLocked: { 'zh-CN': '已锁定', 'en-US': 'Locked' },
  overwriteLockedSummaryTitle: {
    'zh-CN': '替换已锁定的摘要？',
    'en-US': 'Replace a locked summary?',
  },
  overwriteLockedSummaryBody: {
    'zh-CN':
      '{lang} 的摘要是人写的，已锁定。重新生成会用 AI 摘要替换它，并解除锁定。',
    'en-US':
      'The {lang} summary was written by a person and is locked. Regenerating replaces it with an AI summary and unlocks it.',
  },
  skipLocked: {
    'zh-CN': '跳过不覆盖的语言',
    'en-US': 'Skip kept languages',
  },
  skippedLocked: {
    'zh-CN': '已跳过不覆盖的语言',
    'en-US': 'Kept languages were skipped',
  },
  lockedBefore: { 'zh-CN': '不覆盖', 'en-US': 'Kept' },
  noLocked: {
    'zh-CN': '没有要保住的译文',
    'en-US': 'No translations are kept',
  },
  openKind: { 'zh-CN': '打开{kind}', 'en-US': 'Open {kind}' },
  stale: { 'zh-CN': '旧版', 'en-US': 'Stale' },
  sourceLang: { 'zh-CN': '原文语言 {lang}', 'en-US': 'Source language {lang}' },
  costLine: {
    'zh-CN': '费用 {usd} USD · {count} 次',
    'en-US': 'Cost {usd} USD · {count} runs',
  },
  addLang: { 'zh-CN': '补一个语言', 'en-US': 'Add a language' },
  addLangPlaceholder: { 'zh-CN': '例如 ja', 'en-US': 'e.g. ja' },
  addLangAction: { 'zh-CN': '加入语言', 'en-US': 'Add language' },
  addLangInvalid: {
    'zh-CN': '语言代码无效。使用 zh-CN、en、ja 这类写法。',
    'en-US':
      'That language code is invalid. Use a code such as zh-CN, en, or ja.',
  },
  detailFailedTitle: {
    'zh-CN': '这篇文章的产物没有加载出来',
    'en-US': 'This post’s products did not load',
  },
  detailFailedBody: {
    'zh-CN': '可以重试加载。已填写的确认不会丢失，因为还没有提交。',
    'en-US': 'Retry the load. Nothing was submitted.',
  },
  generatingLine: {
    'zh-CN': '{kind}生成中{langs}',
    'en-US': 'Generating {kind}{langs}',
  },
  deleteAssetTitle: {
    'zh-CN': '删除这条{kind}？',
    'en-US': 'Delete this {kind}?',
  },
  deleteAssetBody: {
    'zh-CN': '删除后，这篇文章不再有该语言的{kind}。',
    'en-US': 'This post will no longer have that {kind} for the language.',
  },
  deleteAsset: { 'zh-CN': '删除{kind}', 'en-US': 'Delete {kind}' },
  taskCreated: { 'zh-CN': '已开始生成', 'en-US': 'Generation started' },
  taskExists: {
    'zh-CN': '已有相同任务，未重复创建',
    'en-US': 'The same task already exists',
  },
  taskFailed: {
    'zh-CN': '没有创建生成任务',
    'en-US': 'The generation task was not created',
  },
  saved: { 'zh-CN': '已保存', 'en-US': 'Saved' },
  unsaved: { 'zh-CN': '未保存', 'en-US': 'Unsaved' },
  leaveUnsavedTitle: {
    'zh-CN': '离开当前页面？',
    'en-US': 'Leave this page?',
  },
  leaveUnsavedBody: {
    'zh-CN': '还有未保存的修改。',
    'en-US': 'There are unsaved changes.',
  },
  translationNoBody: { 'zh-CN': '还没有正文', 'en-US': 'No body yet' },
  translationMissingTitle: {
    'zh-CN': '没有找到这篇译文',
    'en-US': 'This translation was not found',
  },
  deleted: { 'zh-CN': '已删除', 'en-US': 'Deleted' },
  saveFailed: { 'zh-CN': '没有保存', 'en-US': 'Not saved' },
  deleteFailed: { 'zh-CN': '没有删除', 'en-US': 'Not deleted' },
  generateTranslation: { 'zh-CN': '生成译文', 'en-US': 'Generate translation' },
  editTranslation: { 'zh-CN': '修改译文', 'en-US': 'Edit translation' },
  saveTranslation: { 'zh-CN': '保存译文', 'en-US': 'Save translation' },
  viewOriginal: { 'zh-CN': '查看原文', 'en-US': 'View original' },
  retryTranslation: { 'zh-CN': '重试译文', 'en-US': 'Retry translation' },
  lockTranslation: { 'zh-CN': '生成时不覆盖', 'en-US': 'Keep on regenerate' },
  unlockTranslation: { 'zh-CN': '允许覆盖', 'en-US': 'Allow overwrite' },
  translateAll: { 'zh-CN': '全量翻译', 'en-US': 'Translate all' },
  translateAllCreated: {
    'zh-CN': '已开始全量翻译',
    'en-US': 'Full translation started',
  },
  translateAllExists: {
    'zh-CN': '全量翻译已在队列中',
    'en-US': 'A full translation is already queued',
  },
  translateAllFailed: {
    'zh-CN': '没有创建全量翻译',
    'en-US': 'The full translation was not created',
  },
  deleteTranslationTitle: {
    'zh-CN': '删除这条译文？',
    'en-US': 'Delete this translation?',
  },
  deleteTranslationBody: {
    'zh-CN': '删除后，这篇文章不再有该语言的译文。',
    'en-US': 'This post will no longer have a translation in that language.',
  },
  deleteTranslation: { 'zh-CN': '删除译文', 'en-US': 'Delete translation' },
  translationEmptyTitle: {
    'zh-CN': '这篇文章还没有译文',
    'en-US': 'This post has no translation',
  },
  translationEmptyBody: {
    'zh-CN':
      '生成后可以在这里阅读，再选一篇进入编辑页。改过的译文可以标成生成时不覆盖。',
    'en-US':
      'After generation, read them here, then open one in the editor. Mark an edited translation so regeneration leaves it in place.',
  },
  fieldTitle: { 'zh-CN': '标题', 'en-US': 'Title' },
  fieldSummary: { 'zh-CN': '摘要', 'en-US': 'Summary' },
  fieldBody: { 'zh-CN': '正文', 'en-US': 'Body' },
  fieldSeo: { 'zh-CN': '搜索摘要', 'en-US': 'Search summary' },
  langLabel: { 'zh-CN': '语言', 'en-US': 'Language' },
  generateSummary: { 'zh-CN': '生成摘要', 'en-US': 'Generate summary' },
  editSummary: { 'zh-CN': '修改摘要', 'en-US': 'Edit summary' },
  saveSummary: { 'zh-CN': '保存摘要', 'en-US': 'Save summary' },
  deleteSummaryTitle: {
    'zh-CN': '删除这条摘要？',
    'en-US': 'Delete this summary?',
  },
  deleteSummaryBody: {
    'zh-CN': '删除后，这篇文章不再有该语言的摘要。',
    'en-US': 'This post will no longer have a summary in that language.',
  },
  deleteSummary: { 'zh-CN': '删除摘要', 'en-US': 'Delete summary' },
  summaryEmptyTitle: {
    'zh-CN': '这篇文章还没有摘要',
    'en-US': 'This post has no summary',
  },
  summaryEmptyBody: {
    'zh-CN': '生成后可以在这里阅读，再选一篇进入编辑页。',
    'en-US': 'After generation, read them here, then open one in the editor.',
  },
  summaryMissingTitle: {
    'zh-CN': '没有找到这篇摘要',
    'en-US': 'This summary was not found',
  },
  summaryRequired: {
    'zh-CN': '摘要不能为空',
    'en-US': 'The summary cannot be empty',
  },
  generateInsights: { 'zh-CN': '生成精读', 'en-US': 'Generate close reading' },
  editInsights: { 'zh-CN': '修改精读', 'en-US': 'Edit close reading' },
  saveInsights: { 'zh-CN': '保存精读', 'en-US': 'Save close reading' },
  retryInsights: { 'zh-CN': '重试精读', 'en-US': 'Retry close reading' },
  translateInsights: {
    'zh-CN': '翻译精读',
    'en-US': 'Translate close reading',
  },
  retryInsightsTranslation: {
    'zh-CN': '重试精读译文',
    'en-US': 'Retry close-reading translation',
  },
  deleteInsightsTitle: {
    'zh-CN': '删除这条精读？',
    'en-US': 'Delete this close reading?',
  },
  deleteInsightsBody: {
    'zh-CN': '删除后，这篇文章不再有该语言的精读。',
    'en-US': 'This post will no longer have a close reading in that language.',
  },
  deleteInsights: { 'zh-CN': '删除精读', 'en-US': 'Delete close reading' },
  insightsEmptyTitle: {
    'zh-CN': '这篇文章还没有精读',
    'en-US': 'This post has no close reading',
  },
  insightsEmptyBody: {
    'zh-CN': '生成后可以在这里阅读，再选一篇进入编辑页。',
    'en-US': 'After generation, read them here, then open one in the editor.',
  },
  insightsMissingTitle: {
    'zh-CN': '没有找到这篇精读',
    'en-US': 'This close reading was not found',
  },
  insightsRequired: {
    'zh-CN': '精读不能为空',
    'en-US': 'The close reading cannot be empty',
  },
  translatedFrom: {
    'zh-CN': '由 {lang} 译出',
    'en-US': 'Translated from {lang}',
  },
  generateTts: { 'zh-CN': '生成朗读', 'en-US': 'Generate narration' },
  resumeTts: { 'zh-CN': '继续朗读', 'en-US': 'Resume narration' },
  retryTts: { 'zh-CN': '重试朗读', 'en-US': 'Retry narration' },
  playAll: { 'zh-CN': '播放全文', 'en-US': 'Play all' },
  playSegment: { 'zh-CN': '播放这一段', 'en-US': 'Play this segment' },
  stopPlayback: { 'zh-CN': '停止', 'en-US': 'Stop' },
  ttsIncomplete: {
    'zh-CN': '朗读还没读完。继续朗读会接着已有片段，不从头替换。',
    'en-US':
      'Narration is incomplete. Resume continues from the segments already made.',
  },
  ttsEmptyTitle: {
    'zh-CN': '这篇文章还没有朗读',
    'en-US': 'This post has no narration',
  },
  ttsEmptyBody: {
    'zh-CN': '生成后，各语言的朗读会列在这里，可以分别播放或重新生成。',
    'en-US':
      'After generation, every language is listed here to play or regenerate.',
  },
  ttsNoAudio: {
    'zh-CN': '这一条还没有可播放的片段。',
    'en-US': 'This narration has no playable segments yet.',
  },
  deleteTtsTitle: {
    'zh-CN': '删除这条朗读？',
    'en-US': 'Delete this narration?',
  },
  deleteTtsBody: {
    'zh-CN': '删除后，这篇文章不再有该语言的朗读。',
    'en-US': 'This post will no longer have a narration in that language.',
  },
  deleteTts: { 'zh-CN': '删除朗读', 'en-US': 'Delete narration' },
  voiceMeta: {
    'zh-CN': '{model} · {voice} · {speed} 倍',
    'en-US': '{model} · {voice} · {speed}×',
  },
  itemFailedTitle: {
    'zh-CN': '这一条没有加载出来',
    'en-US': 'This item did not load',
  },
  itemFailedBody: {
    'zh-CN': '可以重试加载。',
    'en-US': 'Retry the load.',
  },
  langsLabel: { 'zh-CN': '目标语言', 'en-US': 'Target languages' },
  langsHint: {
    'zh-CN': '用逗号分隔，例如 zh-CN、en、ja。留空则使用站点配置。',
    'en-US':
      'Separate with commas, for example zh-CN, en, ja. Leave empty to use site settings.',
  },
  langsCount: { 'zh-CN': '{count} 种语言', 'en-US': '{count} languages' },
  forceLabel: { 'zh-CN': '替换已有产物', 'en-US': 'Replace existing output' },
  forceHintTranslation: {
    'zh-CN': '已有译文会被替换。标成「不覆盖」的语言会跳过，除非勾选覆盖。',
    'en-US':
      'Existing translations are replaced. Languages marked Kept are skipped unless overwrite is checked.',
  },
  forceHintOther: {
    'zh-CN': '已有产物会被替换。',
    'en-US': 'Existing output will be replaced.',
  },
  titleRequired: {
    'zh-CN': '标题不能为空',
    'en-US': 'The title cannot be empty',
  },
  bodyRequired: {
    'zh-CN': '正文不能为空',
    'en-US': 'The body cannot be empty',
  },
  menuOverview: { 'zh-CN': '查看产物', 'en-US': 'Open outputs' },
  glossaryTitle: { 'zh-CN': '翻译词表', 'en-US': 'Translation glossary' },
  glossaryCount: { 'zh-CN': '{count} 条', 'en-US': '{count}' },
  generateEntries: { 'zh-CN': '生成词条', 'en-US': 'Generate entries' },
  columnSource: { 'zh-CN': '源词', 'en-US': 'Source' },
  columnTranslated: { 'zh-CN': '译文', 'en-US': 'Translation' },
  columnUsage: { 'zh-CN': '使用位置', 'en-US': 'Used in' },
  columnLang: { 'zh-CN': '语言', 'en-US': 'Language' },
  usageCategory: { 'zh-CN': '分类名称', 'en-US': 'Category name' },
  usageTag: { 'zh-CN': '文章标签', 'en-US': 'Post tag' },
  allUsage: { 'zh-CN': '全部位置', 'en-US': 'All locations' },
  langPlaceholder: { 'zh-CN': '语言', 'en-US': 'Language' },
  editEntry: { 'zh-CN': '修改译文', 'en-US': 'Edit translation' },
  saveEntry: { 'zh-CN': '保存译文', 'en-US': 'Save translation' },
  deleteEntryTitle: {
    'zh-CN': '删除这条词条？',
    'en-US': 'Delete this entry?',
  },
  deleteEntryBody: {
    'zh-CN': '删除后，后续翻译不再使用这条译名。已经生成的译文不会自动改回。',
    'en-US':
      'Later translations will no longer use this name. Translations already generated are left as they are.',
  },
  deleteEntry: { 'zh-CN': '删除词条', 'en-US': 'Delete entry' },
  glossaryEmptyTitle: { 'zh-CN': '还没有词条', 'en-US': 'No entries yet' },
  glossaryEmptyBody: {
    'zh-CN': '生成词条后，后续翻译会按这里的源词和译文处理。',
    'en-US':
      'After you generate entries, later translations follow these source and translated names.',
  },
  glossaryFilterTitle: {
    'zh-CN': '没有符合条件的词条',
    'en-US': 'No entries match',
  },
  glossaryFilterBody: {
    'zh-CN': '换个语言或使用位置，或清除筛选。',
    'en-US': 'Try another language or location, or clear the filters.',
  },
  clearFilters: { 'zh-CN': '清除筛选', 'en-US': 'Clear filters' },
  glossaryFailedTitle: {
    'zh-CN': '词表没有加载出来',
    'en-US': 'The glossary did not load',
  },
  glossaryFailedBody: {
    'zh-CN': '网络或服务暂时不可用。',
    'en-US': 'The network or service is unavailable.',
  },
  glossaryLoading: { 'zh-CN': '正在加载词表', 'en-US': 'Loading glossary' },
  entryGenerated: {
    'zh-CN': '已生成 {created} 条，跳过 {skipped} 条',
    'en-US': 'Generated {created}, skipped {skipped}',
  },
  entryGenerateFailed: {
    'zh-CN': '没有生成词条',
    'en-US': 'Entries were not generated',
  },
  entrySaved: { 'zh-CN': '已保存译文', 'en-US': 'Translation saved' },
  entrySaveFailed: {
    'zh-CN': '没有保存译文',
    'en-US': 'Translation was not saved',
  },
  entryDeleted: { 'zh-CN': '已删除词条', 'en-US': 'Entry deleted' },
  entryDeleteFailed: {
    'zh-CN': '没有删除词条',
    'en-US': 'Entry was not deleted',
  },
  pageIndex: { 'zh-CN': '第 {page} 页', 'en-US': 'Page {page}' },
  emptyValue: { 'zh-CN': '--', 'en-US': '--' },
} as const

export const aiCopy = createFeatureCopy(catalog)

export type AiCopyKey = keyof typeof catalog

export function useAiCopy() {
  const { locale } = useI18n()
  return (key: AiCopyKey, values?: Record<string, number | string>) =>
    aiCopy(locale, key, values)
}
