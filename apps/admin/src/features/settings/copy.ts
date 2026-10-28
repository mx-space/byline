import type { FeatureCatalog } from '~/i18n/feature-copy'
import { createFeatureCopy } from '~/i18n/feature-copy'
import type { Locale } from '~/i18n/types'

function createOptionalCopy<K extends string>(catalog: FeatureCatalog<K>) {
  const copy = createFeatureCopy(catalog)
  return (locale: Locale, key: string): string | undefined =>
    Object.hasOwn(catalog, key) ? copy(locale, key as K) : undefined
}

export const settingsCopy = createFeatureCopy({
  backToList: {
    'en-US': 'Back to settings',
    'zh-CN': '返回设置',
  },
  cancel: {
    'en-US': 'Cancel',
    'zh-CN': '取消',
  },
  discard: {
    'en-US': 'Discard',
    'zh-CN': '放弃',
  },
  emptyDetail: {
    'en-US': 'Pick a section on the left to change its settings.',
    'zh-CN': '从左侧选择一个分区来修改设置。',
  },
  leaveBody: {
    'en-US':
      'Unsaved changes in this section will be lost. The site keeps the last saved values.',
    'zh-CN': '这一页未保存的更改会丢失，站点继续使用上次保存的值。',
  },
  leaveCancel: {
    'en-US': 'Keep editing',
    'zh-CN': '继续编辑',
  },
  leaveConfirm: {
    'en-US': 'Discard changes',
    'zh-CN': '放弃更改',
  },
  leaveTitle: {
    'en-US': 'Discard unsaved changes?',
    'zh-CN': '放弃未保存的更改？',
  },
  loadFailed: {
    'en-US': 'Settings did not load',
    'zh-CN': '设置没有加载出来',
  },
  loadFailedDetail: {
    'en-US': 'Retry to load the current values.',
    'zh-CN': '重试以读取当前值。',
  },
  navAccount: {
    'en-US': 'My account',
    'zh-CN': '我的账号',
  },
  navSystem: {
    'en-US': 'Site',
    'zh-CN': '站点',
  },
  removeProviderBody: {
    'en-US':
      'After you save, features assigned to this provider stop working. Discard before saving to keep it.',
    'zh-CN': '保存后，使用该服务商的功能会停止。保存前可以放弃更改来保留它。',
  },
  removeProviderConfirm: {
    'en-US': 'Remove provider',
    'zh-CN': '移除服务商',
  },
  removeProviderTitle: {
    'en-US': 'Remove provider "{name}"?',
    'zh-CN': '移除服务商「{name}」？',
  },
  resetToDefault: {
    'en-US': 'Reset to default',
    'zh-CN': '恢复默认',
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
    'en-US': 'Saved {count} changes',
    'zh-CN': '已保存 {count} 项更改',
  },
  saveFailed: {
    'en-US': 'Could not save',
    'zh-CN': '保存失败',
  },
  saveFailedFields: {
    'en-US': 'Fix the highlighted fields, then save again.',
    'zh-CN': '修正标出的字段后再保存。',
  },
  secretHidden: {
    'en-US': 'Hidden',
    'zh-CN': '不回显',
  },
  secretReplace: {
    'en-US': 'Replace',
    'zh-CN': '替换',
  },
  secretReplacePlaceholder: {
    'en-US': 'Enter a new value',
    'zh-CN': '输入新值',
  },
  sendTestEmail: {
    'en-US': 'Send test email',
    'zh-CN': '发送测试邮件',
  },
  stagedInDrawer: {
    'en-US': 'Changes here apply after you save the page.',
    'zh-CN': '这里的改动在保存页面后生效。',
  },
  unsavedCount: {
    'en-US': '{count} unsaved',
    'zh-CN': '{count} 项未保存',
  },
})

export const settingsGroupCopy = createOptionalCopy({
  'account.description': {
    'en-US': 'Sign-in methods, sessions and access tokens',
    'zh-CN': '登录方式、会话与访问令牌',
  },
  'account.title': {
    'en-US': 'Account & security',
    'zh-CN': '账号与安全',
  },
  'ai.description': {
    'en-US': 'Model providers and the AI features that use them',
    'zh-CN': '模型服务商，以及使用它们的 AI 功能',
  },
  'ai.title': {
    'en-US': 'AI',
    'zh-CN': 'AI',
  },
  'notification.description': {
    'en-US': 'How invite and password reset email is sent',
    'zh-CN': '邀请和重置密码邮件的发送方式',
  },
  'notification.title': {
    'en-US': 'Email',
    'zh-CN': '邮件',
  },
  'site.description': {
    'en-US': 'Public addresses and content defaults',
    'zh-CN': '对外地址与内容默认值',
  },
  'site.title': {
    'en-US': 'Site',
    'zh-CN': '站点',
  },
  'storage.description': {
    'en-US': 'Where uploads are stored, how they are named and converted',
    'zh-CN': '上传文件存放在哪里、如何命名与转码',
  },
  'storage.title': {
    'en-US': 'Storage',
    'zh-CN': '存储',
  },
  'user.description': {
    'en-US': 'Name, avatar and bio shown on your bylines',
    'zh-CN': '署名里显示的名称、头像与简介',
  },
  'user.title': {
    'en-US': 'Profile',
    'zh-CN': '个人资料',
  },
})

export const settingsSectionCopy = createOptionalCopy({
  fileUploadOptions: {
    'en-US': 'File naming',
    'zh-CN': '文件命名',
  },
  imageStorageOptions: {
    'en-US': 'S3 image storage',
    'zh-CN': 'S3 图片存储',
  },
  mediaProcessingOptions: {
    'en-US': 'Media processing',
    'zh-CN': '媒体处理',
  },
  mailOptions: {
    'en-US': 'Sending',
    'zh-CN': '发送',
  },
  'mailOptions.resend': {
    'en-US': 'Resend',
    'zh-CN': 'Resend',
  },
  'mailOptions.smtp': {
    'en-US': 'SMTP server',
    'zh-CN': 'SMTP 服务器',
  },
  site: {
    'en-US': 'Content',
    'zh-CN': '内容',
  },
  url: {
    'en-US': 'Public addresses',
    'zh-CN': '对外地址',
  },
})

export const settingsFieldCopy = createOptionalCopy({
  'fileUploadOptions.enableCustomNaming': {
    'en-US': 'Name uploaded files with the templates below.',
    'zh-CN': '开启后，按下面的模板为上传的文件命名。',
  },
  'fileUploadOptions.filenameTemplate': {
    'en-US':
      'Placeholders include {Y}, {m}, {d}, {md5}, {uuid}, {name} and {ext}.',
    'zh-CN': '可用 {Y}、{m}、{d}、{md5}、{uuid}、{name}、{ext} 等占位符。',
  },
  'fileUploadOptions.pathTemplate': {
    'en-US': 'Same placeholders as the file name, plus {type}.',
    'zh-CN': '占位符同文件名模板，另支持 {type}。',
  },
  'fileUploadOptions.videoMaxSize': {
    'en-US':
      'Defaults to 100 MB. S3 has no limit unless video conversion is on.',
    'zh-CN': '默认 100 MB。S3 不限制，开启视频转 WebM 后也受此限制。',
  },
  'mediaProcessingOptions.imageEffort': {
    'en-US': '0–6, default 4. Higher is smaller but slower.',
    'zh-CN': '0–6，默认 4。越大文件越小，但越慢。',
  },
  'mediaProcessingOptions.imageLossless': {
    'en-US': 'Encode without quality loss; quality is ignored.',
    'zh-CN': '无损编码，开启后忽略质量设置。',
  },
  'mediaProcessingOptions.imageMaxDimension': {
    'en-US': 'Scale down so the longest edge fits; empty keeps the size.',
    'zh-CN': '最长边超过时按比例缩小；留空不缩放。',
  },
  'mediaProcessingOptions.imageQuality': {
    'en-US': '1–100, default 80.',
    'zh-CN': '1–100，默认 80。',
  },
  'mediaProcessingOptions.imageToWebp': {
    'en-US': 'Re-encode uploaded images as WebP. SVG and WebP are kept as-is.',
    'zh-CN': '开启后，上传的图片会转成 WebP 再存储。SVG 和 WebP 保持原样。',
  },
  'mediaProcessingOptions.videoAudioBitrate': {
    'en-US': 'Default 128 kbps.',
    'zh-CN': '默认 128 kbps。',
  },
  'mediaProcessingOptions.videoCpuUsed': {
    'en-US': '0–8, default 4. Higher is faster with lower quality.',
    'zh-CN': '0–8，默认 4。越大越快，画质越低。',
  },
  'mediaProcessingOptions.videoCrf': {
    'en-US': '0–63, default 32. Lower is better quality and larger.',
    'zh-CN': '0–63，默认 32。越小画质越好，文件越大。',
  },
  'mediaProcessingOptions.videoMaxHeight': {
    'en-US': 'Scale down taller videos; empty keeps the size.',
    'zh-CN': '超过时按比例缩小；留空不缩放。',
  },
  'mediaProcessingOptions.videoToWebm': {
    'en-US':
      'Transcode uploaded videos to WebM (VP9 + Opus) with ffmpeg. The upload waits for the transcode, and S3 video uploads are then capped by the video size limit.',
    'zh-CN':
      '开启后，上传的视频会用 ffmpeg 转成 WebM（VP9 + Opus）再存储。上传会等转码完成；S3 上的视频也改为受视频大小上限限制。',
  },
  'imageStorageOptions.bucket': {
    'en-US': 'The bucket that stores images.',
    'zh-CN': '存放图片的存储桶名称。',
  },
  'imageStorageOptions.customDomain': {
    'en-US': 'Serve image links from this domain, such as a CDN.',
    'zh-CN': '图片链接改用这个域名，例如 CDN。',
  },
  'imageStorageOptions.enable': {
    'en-US': 'Store uploaded images in S3-compatible storage.',
    'zh-CN': '开启后，上传的图片存到 S3 兼容存储。',
  },
  'imageStorageOptions.endpoint': {
    'en-US': 'Endpoint of the S3-compatible service.',
    'zh-CN': 'S3 兼容服务的接入地址。',
  },
  'imageStorageOptions.prefix': {
    'en-US': 'Path prefix for uploads; supports {Y}, {m}, {d} and {md5}.',
    'zh-CN': '上传路径前缀，可用 {Y}、{m}、{d}、{md5} 等占位符。',
  },
  'imageStorageOptions.region': {
    'en-US': 'Region of the bucket; use auto if unsure.',
    'zh-CN': '存储桶所在区域，不确定时填 auto。',
  },
  'imageStorageOptions.secretId': {
    'en-US': 'Access key ID for the bucket.',
    'zh-CN': '访问存储桶的密钥 ID。',
  },
  'imageStorageOptions.secretKey': {
    'en-US': 'Secret paired with the access key ID.',
    'zh-CN': '与密钥 ID 配对的访问密钥。',
  },
  'mailOptions.enable': {
    'en-US': 'When off, no email is sent.',
    'zh-CN': '关闭后不发送任何邮件。',
  },
  'mailOptions.from': {
    'en-US': 'The address recipients see; required for Resend.',
    'zh-CN': '收件人看到的发件地址，使用 Resend 时必填。',
  },
  'mailOptions.provider': {
    'en-US': 'Send through your own SMTP server or Resend.',
    'zh-CN': '通过自己的 SMTP 服务器或 Resend 发信。',
  },
  'mailOptions.rateLimit': {
    'en-US': 'Maximum emails sent per second.',
    'zh-CN': '每秒最多发送的邮件数。',
  },
  'mailOptions.resend.apiKey': {
    'en-US': 'An API key created in the Resend dashboard.',
    'zh-CN': '在 Resend 控制台创建的 API 密钥。',
  },
  'mailOptions.retryCount': {
    'en-US': 'How many times a failed send is retried.',
    'zh-CN': '发送失败后最多重试的次数。',
  },
  'mailOptions.smtp.host': {
    'en-US': 'Host name of the mail server.',
    'zh-CN': '邮件服务器的主机名。',
  },
  'mailOptions.smtp.pass': {
    'en-US': 'Password for the mail server.',
    'zh-CN': '登录邮件服务器的密码。',
  },
  'mailOptions.smtp.port': {
    'en-US': 'Usually 465 with SSL, or 587.',
    'zh-CN': '通常为 465（SSL）或 587。',
  },
  'mailOptions.smtp.secure': {
    'en-US': 'Usually on when the port is 465.',
    'zh-CN': '端口为 465 时通常需要开启。',
  },
  'mailOptions.smtp.user': {
    'en-US': 'Username for the mail server.',
    'zh-CN': '登录邮件服务器的用户名。',
  },
  'site.defaultSourceLang': {
    'en-US': 'The language posts are written in unless a post sets its own.',
    'zh-CN': '文章没有单独设置时使用的写作语言。',
  },
  'url.adminUrl': {
    'en-US': 'Where this admin lives; invite and reset links point here.',
    'zh-CN': '管理端地址，邀请和重置密码邮件的链接指向这里。',
  },
  'url.postPermalink': {
    'en-US':
      'Path after the frontend URL. Use {slug}, {category} and {id}, such as /posts/{category}/{slug} or /{slug}.',
    'zh-CN':
      '拼在前端 URL 后面的路径，可用 {slug}、{category}、{id}，例如 /posts/{category}/{slug} 或 /{slug}。',
  },
  'url.serverUrl': {
    'en-US': 'Public address of the API.',
    'zh-CN': 'API 的公开地址。',
  },
  'url.webUrl': {
    'en-US': 'The site readers visit, used to build post links.',
    'zh-CN': '读者访问的站点地址，用于生成文章链接。',
  },
  'url.wsUrl': {
    'en-US': 'Gateway address for real-time updates.',
    'zh-CN': '实时推送使用的网关地址。',
  },
})

export const settingsAiCopy = createFeatureCopy({
  autoTranslateInsightsDesc: {
    'en-US': 'Translate Insights into the target languages once generated.',
    'zh-CN': '精读生成后自动翻译到目标语言。',
  },
  decisionDesc: {
    'en-US': 'A fast model for quick yes/no decisions inside AI tasks.',
    'zh-CN': 'AI 任务中做快速判断时使用的轻量模型。',
  },
  decisionLabel: {
    'en-US': 'Decision model',
    'zh-CN': '决策模型',
  },
  fieldTranslationDesc: {
    'en-US':
      'Translates short fields like category names; falls back to the translation model.',
    'zh-CN': '翻译分类名等短字段，留空时使用翻译模型。',
  },
  fieldTranslationLabel: {
    'en-US': 'Field translation model',
    'zh-CN': '字段翻译模型',
  },
  imageAspectDesc: {
    'en-US': 'Used when a request does not set an aspect ratio.',
    'zh-CN': '请求没有指定比例时使用。',
  },
  imageEnableDesc: {
    'en-US': 'Allow generating cover and inline images.',
    'zh-CN': '允许生成封面图和正文配图。',
  },
  imageFormatDesc: {
    'en-US': 'File format of generated images.',
    'zh-CN': '生成图片的文件格式。',
  },
  imageModelDesc: {
    'en-US': 'Needs a provider with image generation enabled.',
    'zh-CN': '需要已开启图片生成能力的服务商。',
  },
  imageModelLabel: {
    'en-US': 'Image model',
    'zh-CN': '图片模型',
  },
  imageQualityDesc: {
    'en-US': 'Higher quality costs more and takes longer.',
    'zh-CN': '质量越高，费用越多、耗时越长。',
  },
  imageTitle: {
    'en-US': 'Image generation',
    'zh-CN': '图片生成',
  },
  insightsDesc: {
    'en-US': 'Generate a close reading of each post.',
    'zh-CN': '为文章生成精读。',
  },
  insightsLanguagesDesc: {
    'en-US': 'The source language is skipped automatically.',
    'zh-CN': '会自动跳过原文语言。',
  },
  insightsModelLabel: {
    'en-US': 'Insights model',
    'zh-CN': '精读模型',
  },
  insightsModelDesc: {
    'en-US': 'Writes the Insights.',
    'zh-CN': '负责撰写精读。',
  },
  insightsTitle: {
    'en-US': 'Insights',
    'zh-CN': '精读',
  },
  insightsTranslationDesc: {
    'en-US': 'Translates Insights; falls back to the translation model.',
    'zh-CN': '翻译精读，留空时使用翻译模型。',
  },
  insightsTranslationLabel: {
    'en-US': 'Insights translation model',
    'zh-CN': '精读翻译模型',
  },
  modelsDesc: {
    'en-US': 'Models used outside the features above.',
    'zh-CN': '上述功能之外使用的模型。',
  },
  modelsTitle: {
    'en-US': 'Other models',
    'zh-CN': '其他模型',
  },
  providerCapabilityNone: {
    'en-US': 'No capability enabled',
    'zh-CN': '未开启任何能力',
  },
  providerDisabled: {
    'en-US': 'Off',
    'zh-CN': '已停用',
  },
  providersDesc: {
    'en-US': 'Keys stay on the server and are never shown again.',
    'zh-CN': '密钥只保存在服务端，不会再次显示。',
  },
  providersEmpty: {
    'en-US': 'Add a provider before turning on AI features.',
    'zh-CN': '先添加服务商，再开启 AI 功能。',
  },
  providersTitle: {
    'en-US': 'Providers',
    'zh-CN': '服务商',
  },
  summaryDesc: {
    'en-US': 'Generate a summary for each post.',
    'zh-CN': '为文章生成摘要。',
  },
  summaryLanguagesDesc: {
    'en-US': 'One summary is generated per language.',
    'zh-CN': '每种语言各生成一份摘要。',
  },
  summaryModelDesc: {
    'en-US': 'Writes the summaries.',
    'zh-CN': '负责撰写摘要。',
  },
  summaryModelLabel: {
    'en-US': 'Summary model',
    'zh-CN': '摘要模型',
  },
  summaryTitle: {
    'en-US': 'Summary',
    'zh-CN': '摘要',
  },
  targetLanguages: {
    'en-US': 'Target languages',
    'zh-CN': '目标语言',
  },
  translationDesc: {
    'en-US': 'Translate posts into the target languages when publishing.',
    'zh-CN': '发布时把文章翻译到目标语言。',
  },
  translationLanguagesDesc: {
    'en-US': 'Regional locales such as zh-TW and pt-BR are separate targets.',
    'zh-CN': 'zh-TW、pt-BR 等地区语言算作独立目标。',
  },
  translationModelDesc: {
    'en-US': 'Translates the post body.',
    'zh-CN': '负责翻译正文。',
  },
  translationModelLabel: {
    'en-US': 'Translation model',
    'zh-CN': '翻译模型',
  },
  translationReviewDesc: {
    'en-US': 'A reviewer checks each translation and asks for fixes.',
    'zh-CN': '由审稿模型检查译文并要求修改。',
  },
  translationReviewModelDesc: {
    'en-US': 'Reviews translations; falls back to the translation model.',
    'zh-CN': '负责审稿，留空时使用翻译模型。',
  },
  translationReviewModelLabel: {
    'en-US': 'Review model',
    'zh-CN': '审稿模型',
  },
  translationTitle: {
    'en-US': 'Translation',
    'zh-CN': '翻译',
  },
  ttsChunkDesc: {
    'en-US': 'Longer posts are split into requests of this size.',
    'zh-CN': '长文按这个长度拆成多次请求。',
  },
  ttsConcurrencyDesc: {
    'en-US': 'Requests sent in parallel for one post.',
    'zh-CN': '同一篇文章并行发送的请求数。',
  },
  ttsEnableDesc: {
    'en-US': 'Allow generating narrated audio for posts.',
    'zh-CN': '允许为文章生成朗读音频。',
  },
  ttsModelDesc: {
    'en-US': 'Needs a provider with speech enabled.',
    'zh-CN': '需要已开启语音能力的服务商。',
  },
  ttsModelLabel: {
    'en-US': 'Speech model',
    'zh-CN': '语音模型',
  },
  ttsRunDesc: {
    'en-US': 'Posts longer than this are not narrated.',
    'zh-CN': '超过这个长度的文章不生成朗读。',
  },
  ttsSpeedDesc: {
    'en-US': 'From 0.25 to 4; 1 is normal speed.',
    'zh-CN': '范围 0.25 到 4，1 为正常语速。',
  },
  ttsTitle: {
    'en-US': 'Narration',
    'zh-CN': '朗读',
  },
  ttsVoiceDesc: {
    'en-US': 'Available voices depend on the model.',
    'zh-CN': '可用音色取决于模型。',
  },
  writerDesc: {
    'en-US': 'Powers the writing assistant in the editor.',
    'zh-CN': '编辑器里的写作助手使用这个模型。',
  },
  writerLabel: {
    'en-US': 'Writing assistant',
    'zh-CN': '写作助手',
  },
})

export const settingsAccountCopy = createFeatureCopy({
  current: {
    'en-US': 'This device',
    'zh-CN': '当前设备',
  },
  enableProvider: {
    'en-US': 'Enable {name} sign-in',
    'zh-CN': '启用 {name} 登录',
  },
  manage: {
    'en-US': 'Manage',
    'zh-CN': '管理',
  },
  oauthDesc: {
    'en-US':
      'Let people sign in with a third-party account. Credentials come from each provider’s developer console.',
    'zh-CN': '允许使用第三方账号登录。凭证在各服务商的开发者后台获取。',
  },
  oauthMissing: {
    'en-US': 'Required',
    'zh-CN': '必填',
  },
  oauthSaved: {
    'en-US': 'Sign-in settings saved',
    'zh-CN': '登录设置已保存',
  },
  othersRevoked: {
    'en-US': 'Other devices signed out',
    'zh-CN': '其他设备已退出登录',
  },
  passkeyDesc: {
    'en-US': 'Sign in with a fingerprint, face or security key.',
    'zh-CN': '用指纹、面容或安全密钥登录。',
  },
  passwordAction: {
    'en-US': 'Change password',
    'zh-CN': '修改密码',
  },
  passwordDesc: {
    'en-US': 'Takes effect immediately for this account.',
    'zh-CN': '修改后立即对当前账号生效。',
  },
  passwordLabel: {
    'en-US': 'Password',
    'zh-CN': '密码',
  },
  revoke: {
    'en-US': 'Sign out',
    'zh-CN': '下线',
  },
  revokeConfirmBody: {
    'en-US': 'That device will need to sign in again.',
    'zh-CN': '这台设备需要重新登录。',
  },
  revokeConfirmTitle: {
    'en-US': 'Sign out this device?',
    'zh-CN': '让这台设备下线？',
  },
  revokeOthers: {
    'en-US': 'Sign out other devices',
    'zh-CN': '下线其他设备',
  },
  revokeOthersConfirmBody: {
    'en-US': 'Every device except this one will need to sign in again.',
    'zh-CN': '除当前设备外，其他设备都需要重新登录。',
  },
  revokeOthersConfirmTitle: {
    'en-US': 'Sign out all other devices?',
    'zh-CN': '下线其他所有设备？',
  },
  sessionRevoked: {
    'en-US': 'Device signed out',
    'zh-CN': '设备已下线',
  },
  sessionsDesc: {
    'en-US': 'Devices currently signed in to this account.',
    'zh-CN': '当前登录了这个账号的设备。',
  },
  signedOut: {
    'en-US': 'Signed out',
    'zh-CN': '已退出登录',
  },
  signInTitle: {
    'en-US': 'Sign-in and access',
    'zh-CN': '登录与访问',
  },
  signOut: {
    'en-US': 'Sign out',
    'zh-CN': '退出登录',
  },
  signOutConfirmBody: {
    'en-US': 'You will return to the sign-in page.',
    'zh-CN': '退出后回到登录页。',
  },
  signOutConfirmTitle: {
    'en-US': 'Sign out of this device?',
    'zh-CN': '退出当前设备的登录？',
  },
  tokenDesc: {
    'en-US': 'Tokens let scripts and the CLI call the API.',
    'zh-CN': '脚本和命令行工具通过令牌调用 API。',
  },
  unknownDevice: {
    'en-US': 'Unknown device',
    'zh-CN': '未知设备',
  },
  verify: {
    'en-US': 'Test sign-in',
    'zh-CN': '测试登录',
  },
})
