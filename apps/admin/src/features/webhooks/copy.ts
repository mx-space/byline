import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

const catalog = {
  allEvents: { 'en-US': 'All events', 'zh-CN': '全部事件' },
  allEventsHint: {
    'en-US': 'Includes events added later.',
    'zh-CN': '包括以后新增的事件。',
  },
  backToList: { 'en-US': 'Back to webhooks', 'zh-CN': '返回 Webhook 列表' },
  cancel: { 'en-US': 'Cancel', 'zh-CN': '取消' },
  close: { 'en-US': 'Close', 'zh-CN': '关闭' },
  columnDuration: { 'en-US': 'Duration', 'zh-CN': '耗时' },
  columnEvent: { 'en-US': 'Event', 'zh-CN': '事件' },
  columnStatus: { 'en-US': 'Status', 'zh-CN': '状态' },
  columnTime: { 'en-US': 'Time', 'zh-CN': '时间' },
  copySecret: { 'en-US': 'Copy secret', 'zh-CN': '复制密钥' },
  create: { 'en-US': 'Add webhook', 'zh-CN': '添加 Webhook' },
  created: {
    'en-US': 'Webhook added. A test delivery was sent.',
    'zh-CN': '已添加 Webhook，并发送了一次测试。',
  },
  delete: { 'en-US': 'Delete', 'zh-CN': '删除' },
  deleteBody: {
    'en-US':
      '{url} stops receiving events and its delivery log is removed. This cannot be undone.',
    'zh-CN': '{url} 将不再接收事件，投递记录也会一并删除，且无法恢复。',
  },
  deleteFailed: {
    'en-US': 'The webhook was not deleted. {message}',
    'zh-CN': '没有删除这个 Webhook。{message}',
  },
  deleteTitle: {
    'en-US': 'Delete this webhook?',
    'zh-CN': '删除这个 Webhook？',
  },
  deleted: { 'en-US': 'Webhook deleted', 'zh-CN': '已删除 Webhook' },
  deliveryCount: {
    'en-US': '{count} deliveries',
    'zh-CN': '共 {count} 次投递',
  },
  deliveryEmptyDescription: {
    'en-US': 'Send a test, or publish a post, and the result shows up here.',
    'zh-CN': '发送一次测试或发布博文后，结果会出现在这里。',
  },
  deliveryEmptyTitle: {
    'en-US': 'No deliveries yet',
    'zh-CN': '还没有投递记录',
  },
  deliveryErrorTitle: {
    'en-US': 'Deliveries did not load',
    'zh-CN': '投递记录没有加载出来',
  },
  deliveryTitle: { 'en-US': 'Delivery', 'zh-CN': '投递详情' },
  disabled: { 'en-US': 'Disabled', 'zh-CN': '已停用' },
  discard: { 'en-US': 'Discard', 'zh-CN': '放弃' },
  discardBody: {
    'en-US': 'What you entered is not saved.',
    'zh-CN': '已填写的内容还没保存。',
  },
  discardOk: { 'en-US': 'Discard changes', 'zh-CN': '放弃修改' },
  discardTitle: {
    'en-US': 'Discard unsaved changes?',
    'zh-CN': '放弃未保存的修改？',
  },
  emptyDescription: {
    'en-US':
      'Webhooks POST a signed request to your endpoint whenever content changes.',
    'zh-CN': '内容变化时，Webhook 会向你的地址发送一条带签名的 POST 请求。',
  },
  emptyMark: { 'en-US': '--', 'zh-CN': '--' },
  emptyTitle: { 'en-US': 'No webhooks yet', 'zh-CN': '还没有 Webhook' },
  enable: { 'en-US': 'Enabled', 'zh-CN': '启用' },
  enableFailed: {
    'en-US': 'The enabled state was not changed. {message}',
    'zh-CN': '没有改启用状态。{message}',
  },
  eventCount: { 'en-US': '{count} events', 'zh-CN': '{count} 个事件' },
  eventsEmptyCatalog: {
    'en-US': 'The server returned no events to subscribe to.',
    'zh-CN': '服务端没有返回可订阅的事件。',
  },
  eventsLoadFailed: {
    'en-US': 'Events did not load',
    'zh-CN': '事件列表没有加载出来',
  },
  fieldEvents: { 'en-US': 'Events', 'zh-CN': '事件' },
  fieldScope: { 'en-US': 'Sources', 'zh-CN': '来源' },
  fieldScopeHint: {
    'en-US': 'Only events triggered from these sources are sent.',
    'zh-CN': '只发送由这些来源触发的事件。',
  },
  fieldSecret: { 'en-US': 'Signing secret', 'zh-CN': '签名密钥' },
  fieldSecretCreate: {
    'en-US':
      'Requests are signed with HMAC in X-Webhook-Signature256. Copy it now; it cannot be shown again.',
    'zh-CN':
      '请求会用 HMAC 签名，放在 X-Webhook-Signature256 头中。请现在复制，保存后无法再查看。',
  },
  fieldSecretEdit: {
    'en-US':
      'The current secret is hidden. Leave blank to keep it, or regenerate a new one.',
    'zh-CN': '现有密钥不会显示。留空则保持不变，也可以重新生成。',
  },
  fieldSecretPlaceholder: { 'en-US': 'Unchanged', 'zh-CN': '保持不变' },
  fieldUrl: { 'en-US': 'Endpoint URL', 'zh-CN': '地址' },
  healthCheck: { 'en-US': 'Test', 'zh-CN': '测试' },
  hideSecret: { 'en-US': 'Hide secret', 'zh-CN': '隐藏密钥' },
  httpStatus: {
    'en-US': 'The receiver returned HTTP {status}',
    'zh-CN': '对方返回 HTTP {status}',
  },
  httpStatusDetail: {
    'en-US': 'The receiver returned HTTP {status}. {detail}',
    'zh-CN': '对方返回 HTTP {status}。{detail}',
  },
  keepEditing: { 'en-US': 'Keep editing', 'zh-CN': '继续编辑' },
  lastDelivery: { 'en-US': 'Last delivery {time}', 'zh-CN': '最近投递 {time}' },
  lastFailed: { 'en-US': 'Last delivery failed', 'zh-CN': '最近一次投递失败' },
  lastNone: { 'en-US': 'No deliveries', 'zh-CN': '暂无投递' },
  lastSucceeded: {
    'en-US': 'Last delivery succeeded',
    'zh-CN': '最近一次投递成功',
  },
  listErrorDescription: {
    'en-US': 'Check the network, then retry.',
    'zh-CN': '检查网络后重试。',
  },
  listErrorTitle: {
    'en-US': 'Webhooks did not load',
    'zh-CN': 'Webhook 列表没有加载出来',
  },
  listTitle: { 'en-US': 'Webhooks', 'zh-CN': 'Webhooks' },
  noResponse: { 'en-US': 'No response received', 'zh-CN': '没有收到响应' },
  notDelivered: { 'en-US': 'Not delivered', 'zh-CN': '未送达' },
  notFoundDescription: {
    'en-US': 'It may have been deleted.',
    'zh-CN': '它可能已被删除。',
  },
  notFoundTitle: {
    'en-US': 'Webhook not found',
    'zh-CN': '未找到这个 Webhook',
  },
  redispatch: { 'en-US': 'Redeliver', 'zh-CN': '重新投递' },
  redispatchFailed: {
    'en-US': 'Not redelivered. {message}',
    'zh-CN': '没有重新投递。{message}',
  },
  redispatched: { 'en-US': 'Redelivered', 'zh-CN': '已重新投递' },
  refresh: { 'en-US': 'Refresh', 'zh-CN': '刷新' },
  regenerateSecret: { 'en-US': 'Regenerate', 'zh-CN': '重新生成' },
  requestBody: { 'en-US': 'Request body', 'zh-CN': '请求体' },
  requestHeaders: { 'en-US': 'Request headers', 'zh-CN': '请求头' },
  responseBody: { 'en-US': 'Response body', 'zh-CN': '响应体' },
  responseHeaders: { 'en-US': 'Response headers', 'zh-CN': '响应头' },
  retry: { 'en-US': 'Retry', 'zh-CN': '重试' },
  retryLater: { 'en-US': 'Try again in a moment.', 'zh-CN': '请稍后重试。' },
  save: { 'en-US': 'Save', 'zh-CN': '保存' },
  saveFailed: {
    'en-US': 'The webhook was not saved. {message}',
    'zh-CN': '没有保存这个 Webhook。{message}',
  },
  saved: {
    'en-US': 'Saved. A test delivery was sent.',
    'zh-CN': '已保存，并发送了一次测试。',
  },
  scopeAdmin: { 'en-US': 'Admin', 'zh-CN': '管理员' },
  scopeLine: { 'en-US': 'Sources: {value}', 'zh-CN': '来源：{value}' },
  scopeNone: { 'en-US': 'No source', 'zh-CN': '未指定来源' },
  scopeSeparator: { 'en-US': ', ', 'zh-CN': '、' },
  scopeSystem: { 'en-US': 'System', 'zh-CN': '系统' },
  scopeVisitor: { 'en-US': 'Visitor', 'zh-CN': '访客' },
  selectedEvents: {
    'en-US': '{selected} of {total} selected',
    'zh-CN': '已选 {selected} / {total}',
  },
  sendTest: { 'en-US': 'Send test', 'zh-CN': '发送测试' },
  showSecret: { 'en-US': 'Show secret', 'zh-CN': '显示密钥' },
  ssrf: { 'en-US': 'This address was rejected', 'zh-CN': '目标地址被拒绝' },
  ssrfDetail: {
    'en-US': 'This address was rejected. {message}',
    'zh-CN': '目标地址被拒绝。{message}',
  },
  succeeded: { 'en-US': 'Succeeded', 'zh-CN': '成功' },
  tabConfig: { 'en-US': 'Configuration', 'zh-CN': '配置' },
  tabDeliveries: { 'en-US': 'Deliveries', 'zh-CN': '投递记录' },
  testFailed: {
    'en-US': 'The test was not sent. {message}',
    'zh-CN': '没有发送测试。{message}',
  },
  testSent: {
    'en-US': 'Test sent. See the result in Deliveries.',
    'zh-CN': '已发送测试，可在投递记录中查看结果。',
  },
  turnedOff: { 'en-US': 'Webhook disabled', 'zh-CN': '已停用这个 Webhook' },
  turnedOn: { 'en-US': 'Webhook enabled', 'zh-CN': '已启用这个 Webhook' },
  unsaved: { 'en-US': 'Unsaved changes', 'zh-CN': '有未保存的修改' },
  urlPlaceholder: {
    'en-US': 'https://example.com/hooks/byline',
    'zh-CN': 'https://example.com/hooks/byline',
  },
  validateEvents: {
    'en-US': 'Choose at least one event.',
    'zh-CN': '至少选择一个事件。',
  },
  validateScope: {
    'en-US': 'Choose at least one source.',
    'zh-CN': '至少选择一个来源。',
  },
  validateUrl: {
    'en-US': 'Enter an http(s) URL that receives events.',
    'zh-CN': '填写接收事件的 http(s) 地址。',
  },
} as const

export const webhookCopy = createFeatureCopy(catalog)

export type WebhookCopyKey = keyof typeof catalog

export function useWebhookCopy() {
  const { locale } = useI18n()
  return (key: WebhookCopyKey, values?: Record<string, number | string>) =>
    webhookCopy(locale, key, values)
}
