import { createFeatureCopy } from '~/i18n/feature-copy'

export const customOauthCopy = createFeatureCopy({
  title: { 'en-US': 'Custom clients', 'zh-CN': '自定义客户端' },
  desc: {
    'en-US': 'Add third-party sign-in methods with their own names and icons.',
    'zh-CN': '接入第三方账号，为每个登录入口配置名称与图标。',
  },
  add: { 'en-US': 'Add client', 'zh-CN': '添加客户端' },
  edit: { 'en-US': 'Edit', 'zh-CN': '编辑' },
  editTitle: { 'en-US': 'Edit client', 'zh-CN': '编辑客户端' },
  empty: { 'en-US': 'No custom clients', 'zh-CN': '还没有自定义客户端' },
  name: { 'en-US': 'Display name', 'zh-CN': '显示名称' },
  id: { 'en-US': 'Client identifier', 'zh-CN': '客户端标识' },
  idHelp: {
    'en-US':
      'Lowercase letters, numbers and hyphens. Cannot be changed after creation.',
    'zh-CN': '使用小写字母、数字和连字符。创建后不可修改。',
  },
  icon: { 'en-US': 'Icon URL', 'zh-CN': '图标地址' },
  upload: { 'en-US': 'Upload icon', 'zh-CN': '上传图标' },
  iconHelp: {
    'en-US': 'Upload a square image or paste a public image URL.',
    'zh-CN': '上传正方形图片，或粘贴可公开访问的图片地址。',
  },
  preview: { 'en-US': 'Sign-in button preview', 'zh-CN': '登录按钮预览' },
  enabled: { 'en-US': 'Enabled', 'zh-CN': '已启用' },
  disabled: { 'en-US': 'Disabled', 'zh-CN': '已停用' },
  incomplete: { 'en-US': 'Needs configuration', 'zh-CN': '待完善' },
  enable: { 'en-US': 'Enable client', 'zh-CN': '启用客户端' },
  status: { 'en-US': 'Status', 'zh-CN': '状态' },
  actions: { 'en-US': 'Actions', 'zh-CN': '操作' },
  protocol: { 'en-US': 'Protocol', 'zh-CN': '协议' },
  discovery: { 'en-US': 'Discovery URL', 'zh-CN': '发现地址' },
  authorization: { 'en-US': 'Authorization URL', 'zh-CN': '授权地址' },
  token: { 'en-US': 'Token URL', 'zh-CN': '令牌地址' },
  userInfo: { 'en-US': 'User info URL', 'zh-CN': '用户信息地址' },
  scopes: { 'en-US': 'Scopes', 'zh-CN': 'Scopes' },
  scopesHelp: {
    'en-US': 'Separate scopes with spaces or commas.',
    'zh-CN': '用空格或逗号分隔。',
  },
  callback: { 'en-US': 'Callback URL', 'zh-CN': '回调地址' },
  callbackHelp: {
    'en-US': 'Add this URL to the provider’s allowed callback URLs.',
    'zh-CN': '将此地址加入授权方的回调白名单。',
  },
  copy: { 'en-US': 'Copy callback URL', 'zh-CN': '复制回调地址' },
  copied: { 'en-US': 'Copied', 'zh-CN': '已复制' },
  advanced: { 'en-US': 'Advanced settings', 'zh-CN': '高级设置' },
  authentication: {
    'en-US': 'Token authentication',
    'zh-CN': '令牌请求认证方式',
  },
  profileHelp: {
    'en-US':
      'Optional JSON paths in the returned profile, such as user.email. Defaults to standard OAuth/OIDC fields.',
    'zh-CN':
      '可选的用户信息 JSON 字段路径，如 user.email。留空使用 OAuth / OIDC 标准字段。',
  },
  subject: { 'en-US': 'User identifier field', 'zh-CN': '用户标识字段' },
  email: { 'en-US': 'Email field', 'zh-CN': '邮箱字段' },
  profileName: { 'en-US': 'Name field', 'zh-CN': '姓名字段' },
  image: { 'en-US': 'Avatar field', 'zh-CN': '头像字段' },
  emailVerified: {
    'en-US': 'Verified email field',
    'zh-CN': '邮箱验证状态字段',
  },
  inviteOnly: {
    'en-US':
      'Invited accounts only. Enabling a client does not open registration.',
    'zh-CN': '仅受邀账号可登录。启用客户端不会开放注册。',
  },
  save: { 'en-US': 'Save client', 'zh-CN': '保存客户端' },
  cancel: { 'en-US': 'Cancel', 'zh-CN': '取消' },
  saved: { 'en-US': 'Client saved', 'zh-CN': '客户端已保存' },
  saveFailed: {
    'en-US': 'Could not save the client',
    'zh-CN': '无法保存客户端',
  },
  invalid: {
    'en-US': 'Check the highlighted fields.',
    'zh-CN': '检查标出的字段后再保存。',
  },
  required: { 'en-US': 'Required', 'zh-CN': '请填写此项' },
  invalidId: {
    'en-US':
      'Use a unique identifier beginning with a lowercase letter. Built-in provider identifiers are reserved.',
    'zh-CN': '使用以小写字母开头的唯一标识，内置服务商的标识不可使用。',
  },
  invalidUrl: {
    'en-US': 'Enter a valid HTTP or HTTPS URL.',
    'zh-CN': '填写有效的 HTTP 或 HTTPS 地址。',
  },
  uploadFailed: {
    'en-US': 'Could not upload the icon',
    'zh-CN': '无法上传图标',
  },
  verify: { 'en-US': 'Verify sign-in', 'zh-CN': '验证登录' },
  verifyHint: {
    'en-US': 'Save and enable this client before verification.',
    'zh-CN': '保存并启用客户端后可验证登录。',
  },
  verifyFailed: {
    'en-US': 'Could not open provider verification',
    'zh-CN': '无法打开登录验证',
  },
  remove: { 'en-US': 'Delete client', 'zh-CN': '删除客户端' },
  removeTitle: { 'en-US': 'Delete {name}?', 'zh-CN': '删除 {name}？' },
  removeBody: {
    'en-US':
      'The sign-in method and client secret will be removed. Existing accounts and bylines are kept.',
    'zh-CN': '移除此登录入口与客户端密钥，已绑定的账号和署名会保留。',
  },
  discardTitle: { 'en-US': 'Discard changes?', 'zh-CN': '放弃修改？' },
  discardBody: {
    'en-US': 'Unsaved client changes will be lost.',
    'zh-CN': '此客户端尚未保存的修改会丢失。',
  },
  discard: { 'en-US': 'Discard changes', 'zh-CN': '放弃修改' },
  keepEditing: { 'en-US': 'Keep editing', 'zh-CN': '继续编辑' },
  completeHint: {
    'en-US':
      'Complete the credentials and endpoints before enabling this client.',
    'zh-CN': '完善凭据和连接地址后才能启用。',
  },
})
