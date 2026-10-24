import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

export const taskCopy = createFeatureCopy({
  pageDescription: {
    'en-US':
      'Fix failed jobs, watch what is running, and look back at history.',
    'zh-CN': '处理失败的任务，查看进行中的任务和历史记录。',
  },
  clearCompleted: { 'en-US': 'Clear completed', 'zh-CN': '清除已完成' },
  clearTitle: {
    'en-US': 'Clear completed tasks?',
    'zh-CN': '清除已完成的任务？',
  },
  clearBodyType: {
    'en-US':
      'Deletes every completed {type} task, not only this page. Posts and generated output stay.',
    'zh-CN':
      '会删除所有已完成的「{type}」任务记录，不只是这一页。文章和产物还在。',
  },
  clearBodyAll: {
    'en-US':
      'Deletes every completed task record, not only this page. Posts and generated output stay.',
    'zh-CN': '会删除全部已完成的任务记录，不只是这一页。文章和产物还在。',
  },
  dismiss: { 'en-US': 'Cancel', 'zh-CN': '取消' },
  statusFilter: { 'en-US': 'Filter by status', 'zh-CN': '按状态筛选' },
  statusAll: { 'en-US': 'All', 'zh-CN': '全部' },
  statusActive: { 'en-US': 'In progress', 'zh-CN': '进行中' },
  statusFailed: { 'en-US': 'Failed', 'zh-CN': '失败' },
  statusCompleted: { 'en-US': 'Completed', 'zh-CN': '已完成' },
  typeAll: { 'en-US': 'All types', 'zh-CN': '全部类型' },
  typePublish: { 'en-US': 'Publish', 'zh-CN': '发布' },
  columnSubject: { 'en-US': 'Subject', 'zh-CN': '对象' },
  columnType: { 'en-US': 'Type', 'zh-CN': '类型' },
  columnStatus: { 'en-US': 'Status', 'zh-CN': '状态' },
  columnResult: { 'en-US': 'Result', 'zh-CN': '结果' },
  columnCreated: { 'en-US': 'Created', 'zh-CN': '创建' },
  columnElapsed: { 'en-US': 'Duration', 'zh-CN': '耗时' },
  untitled: { 'en-US': 'Untitled post', 'zh-CN': '无标题文章' },
  queued: { 'en-US': 'Queued', 'zh-CN': '排队中' },
  queuedBody: {
    'en-US': 'Queued. It starts when a worker is free.',
    'zh-CN': '排队中，有空闲的执行器时开始。',
  },
  noReasonShort: { 'en-US': 'No reason recorded', 'zh-CN': '没有记录原因' },
  failedItems: { 'en-US': '{count} items failed', 'zh-CN': '{count} 项失败' },
  failedTitle: { 'en-US': 'Why it failed', 'zh-CN': '失败原因' },
  partialFailedTitle: { 'en-US': 'Some items failed', 'zh-CN': '部分失败' },
  failedBanner: {
    'en-US': '{count} tasks failed. Read the reason, then retry.',
    'zh-CN': '{count} 个任务失败，看过原因后再重试。',
  },
  viewFailed: { 'en-US': 'Show failed', 'zh-CN': '只看失败' },
  emptyFailedTitle: { 'en-US': 'No failed tasks', 'zh-CN': '没有失败的任务' },
  retry: { 'en-US': 'Retry', 'zh-CN': '重试' },
  more: { 'en-US': 'More', 'zh-CN': '更多' },
  close: { 'en-US': 'Close', 'zh-CN': '关闭' },
  tokens: { 'en-US': 'Tokens', 'zh-CN': 'Token 数' },
  typeFilter: { 'en-US': 'Type', 'zh-CN': '类型' },
  livePaused: {
    'en-US': 'Live paused',
    'zh-CN': '实时暂停',
  },
  listLoadTitle: {
    'en-US': 'The task list did not load',
    'zh-CN': '任务列表没有加载出来',
  },
  listLoadBody: {
    'en-US':
      'The network or service is unavailable. Reload, then look for failed tasks.',
    'zh-CN': '网络或服务暂时不可用。重新加载后再查失败任务。',
  },
  listStale: {
    'en-US': 'The list did not refresh. Rows below are the last result.',
    'zh-CN': '列表没有刷新，下面仍是上次的结果。',
  },
  reload: { 'en-US': 'Reload', 'zh-CN': '重新加载' },
  emptyTitle: { 'en-US': 'No tasks yet', 'zh-CN': '还没有任务' },
  emptyBody: {
    'en-US':
      'Tasks show up here after you publish or generate a translation, summary, close reading, or voice.',
    'zh-CN': '发布或生成译文、摘要、精读、语音后，任务会出现在这里。',
  },
  filteredTitle: {
    'en-US': 'No tasks match these filters',
    'zh-CN': '没有符合条件的任务',
  },
  clearFilters: { 'en-US': 'Clear filters', 'zh-CN': '清除筛选' },
  drawerTitle: { 'en-US': 'Task detail', 'zh-CN': '任务详情' },
  loadingDetail: { 'en-US': 'Loading this task', 'zh-CN': '正在加载这条任务' },
  taskLoadTitle: {
    'en-US': 'This task did not load',
    'zh-CN': '这条任务没有加载出来',
  },
  taskLoadBody: {
    'en-US':
      'The task could not be opened. Reload it before deciding whether to retry.',
    'zh-CN': '打不开这条任务。重新加载后再决定要不要重试。',
  },
  taskMissingTitle: { 'en-US': 'Task not found', 'zh-CN': '找不到这条任务' },
  taskMissingBody: {
    'en-US': 'It may have been deleted. Go back to the list and pick another.',
    'zh-CN': '它可能已被删除。回到列表再选一条。',
  },
  backToList: { 'en-US': 'Back to list', 'zh-CN': '返回列表' },
  logTitle: { 'en-US': 'Log', 'zh-CN': '日志' },
  logLoadTitle: {
    'en-US': 'The log did not load',
    'zh-CN': '日志没有加载出来',
  },
  logLoadBody: {
    'en-US':
      'The task status is still here, but the log did not load. Reload the log before deciding whether to retry.',
    'zh-CN': '任务状态还在，但日志这次没读到。重新加载日志后再决定要不要重试。',
  },
  logReload: { 'en-US': 'Reload log', 'zh-CN': '重新加载日志' },
  logStale: {
    'en-US': 'Below is the log from the last successful read.',
    'zh-CN': '下面是上次读到的日志。',
  },
  logEmpty: {
    'en-US': 'This task has no log yet.',
    'zh-CN': '这条任务还没有日志。',
  },
  logLive: {
    'en-US': 'Running. The log updates as it goes.',
    'zh-CN': '进行中，日志会更新',
  },
  logError: { 'en-US': 'Error', 'zh-CN': '错误' },
  logWarn: { 'en-US': 'Warning', 'zh-CN': '警告' },
  logInfo: { 'en-US': 'Info', 'zh-CN': '信息' },
  retryTask: { 'en-US': 'Retry task', 'zh-CN': '重试任务' },
  retryTitle: { 'en-US': 'Retry this task?', 'zh-CN': '重试这条任务？' },
  retryTranslation: {
    'en-US':
      'Runs again with the same parameters and overwrites unlocked translations. Locked translations stay as they are.',
    'zh-CN':
      '会按原来的参数再跑一次，并覆盖未锁定的译文。已锁定的译文保持不变。',
  },
  retryTranslationLocked: {
    'en-US':
      'Runs again with the same parameters. Locked translations are included this time, and unlocked translations are overwritten.',
    'zh-CN':
      '会按原来的参数再跑一次。这次包含已锁定的译文，未锁定的译文也会被覆盖。',
  },
  retryPartialTranslation: {
    'en-US':
      'Retries only the languages that did not succeed, and overwrites unlocked translations in those languages. Locked translations stay as they are.',
    'zh-CN':
      '只会再跑尚未成功的语言，并覆盖这些语言里未锁定的译文。已锁定的译文保持不变。',
  },
  retryPartialTranslationLocked: {
    'en-US':
      'Retries only the languages that did not succeed. Locked and unlocked translations in those languages are generated again.',
    'zh-CN':
      '只会再跑尚未成功的语言。这些语言里已锁定和未锁定的译文都会重新生成。',
  },
  retryTts: {
    'en-US':
      'Creates another voice task with the same parameters. To resume unfinished audio, use Continue generation.',
    'zh-CN':
      '会按原来的参数再创建一条语音任务。若只要续上未完成的片段，用「继续生成」。',
  },
  retryGeneric: {
    'en-US': 'Creates another task with the same parameters and runs it again.',
    'zh-CN': '会按原来的参数再创建一条任务并再跑一次。',
  },
  continueTts: { 'en-US': 'Continue generation', 'zh-CN': '继续生成' },
  cancelTask: { 'en-US': 'Cancel task', 'zh-CN': '取消任务' },
  cancelTitle: { 'en-US': 'Cancel this task?', 'zh-CN': '取消这条任务？' },
  cancelBody: {
    'en-US': 'Cancelling stops this run.',
    'zh-CN': '取消后这次运行会停掉。',
  },
  deleteTask: { 'en-US': 'Delete task', 'zh-CN': '删除任务' },
  deleteTitle: { 'en-US': 'Delete this task?', 'zh-CN': '删除这条任务？' },
  deleteBody: {
    'en-US':
      'The task and its log are removed and cannot be restored. The post and generated output stay.',
    'zh-CN':
      '删除后这条任务和它的日志会消失，不能恢复。文章和已生成的产物还在。',
  },
  openArticle: { 'en-US': 'Open post', 'zh-CN': '打开文章' },
  openSummary: { 'en-US': 'Open summary', 'zh-CN': '打开摘要' },
  openTranslation: { 'en-US': 'Open translation', 'zh-CN': '打开译文' },
  openInsights: { 'en-US': 'Open close reading', 'zh-CN': '打开精读' },
  openTts: { 'en-US': 'Open voice', 'zh-CN': '打开语音' },
  failedNoReason: {
    'en-US': 'No failure reason is stored on the task. Read the log below.',
    'zh-CN': '失败原因没有写在任务上。看下面的日志。',
  },
  subTasks: { 'en-US': 'Subtasks', 'zh-CN': '子任务' },
  parameters: { 'en-US': 'Parameters', 'zh-CN': '参数' },
  result: { 'en-US': 'Result', 'zh-CN': '结果' },
  record: { 'en-US': 'Record', 'zh-CN': '记录' },
  timeline: { 'en-US': 'Time', 'zh-CN': '时间' },
  subtaskLoadTitle: {
    'en-US': 'Subtasks did not load',
    'zh-CN': '子任务没有加载出来',
  },
  subtaskReload: { 'en-US': 'Reload subtasks', 'zh-CN': '重新加载子任务' },
  subtaskEmpty: {
    'en-US': 'This task has no subtasks yet.',
    'zh-CN': '这条任务还没有子任务。',
  },
  subtaskLoading: { 'en-US': 'Loading subtasks', 'zh-CN': '正在加载子任务' },
  toastRetryCreated: {
    'en-US': 'Retry task created',
    'zh-CN': '已创建重试任务',
  },
  toastExists: {
    'en-US': 'An identical task already exists',
    'zh-CN': '已有相同任务，没有再创建',
  },
  toastRetryFailed: {
    'en-US': 'The retry did not finish. Try again shortly.',
    'zh-CN': '重试没有完成，稍后再试',
  },
  toastContinueCreated: {
    'en-US': 'Continue task created',
    'zh-CN': '已创建继续生成任务',
  },
  toastContinueFailed: {
    'en-US': 'Continue generation did not finish. Try again shortly.',
    'zh-CN': '继续生成没有完成，稍后再试',
  },
  toastContinueMissing: {
    'en-US': 'This voice task has no post, so it cannot continue.',
    'zh-CN': '这条语音任务没有文章，不能继续生成',
  },
  toastCancelOk: { 'en-US': 'Task cancelled', 'zh-CN': '已取消这条任务' },
  toastCancelFailed: {
    'en-US': 'Cancel did not finish. Try again shortly.',
    'zh-CN': '取消没有完成，稍后再试',
  },
  toastDeleted: { 'en-US': 'Task deleted', 'zh-CN': '已删除这条任务' },
  toastDeleteFailed: {
    'en-US': 'Delete did not finish. Try again shortly.',
    'zh-CN': '删除没有完成，稍后再试',
  },
  toastCleared: {
    'en-US': 'Cleared {count} completed tasks',
    'zh-CN': '已清除 {count} 条已完成任务',
  },
  toastClearFailed: {
    'en-US': 'Clear did not finish. Try again shortly.',
    'zh-CN': '清除没有完成，稍后再试',
  },
  streamTitle: { 'en-US': 'Live output', 'zh-CN': '实时输出' },
  streamHint: {
    'en-US': 'Live output is best-effort. Earlier text is not replayed.',
    'zh-CN': '实时输出只尽力推送，先前已生成的内容不会回放。',
  },
  streamWaiting: {
    'en-US': 'Waiting for the first output.',
    'zh-CN': '正在等待第一条输出。',
  },
  streamLive: { 'en-US': 'Receiving', 'zh-CN': '接收中' },
  streamDone: { 'en-US': 'Finished', 'zh-CN': '已结束' },
  streamLang: { 'en-US': 'Language {lang}', 'zh-CN': '语言 {lang}' },
  streamSegment: {
    'en-US': 'Segment {segmentId}',
    'zh-CN': '段落 {segmentId}',
  },
})

export function useTaskCopy() {
  const { locale } = useI18n()
  return useCallback(
    (
      key: Parameters<typeof taskCopy>[1],
      values?: Parameters<typeof taskCopy>[2],
    ) => taskCopy(locale, key, values),
    [locale],
  )
}
