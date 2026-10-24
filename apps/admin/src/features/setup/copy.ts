import { useCallback } from 'react'

import { useI18n } from '~/i18n'
import { createFeatureCopy } from '~/i18n/feature-copy'

const catalog = {
  accountAvatar: {
    'en-US': 'Avatar',
    'zh-CN': '头像',
  },
  accountAvatarError: {
    'en-US':
      'The avatar was not uploaded. The account was created and the avatar can be added later in account settings.',
    'zh-CN': '头像没有上传。账号已创建，可稍后在账号设置里补。',
  },
  accountAvatarHint: {
    'en-US': 'It can be added later in account settings.',
    'zh-CN': '可稍后在账号设置里补。',
  },
  accountAvatarUpload: {
    'en-US': 'Upload avatar',
    'zh-CN': '上传头像',
  },
  accountBlocked: {
    'en-US':
      'Fill a valid username, email, and password before creating the account',
    'zh-CN': '用户名、邮箱和密码填对之后才能创建',
  },
  accountCreateError: {
    'en-US':
      'The account was not created. Check the username and email, then try again.',
    'zh-CN': '账号没有创建成功。检查用户名和邮箱后重试。',
  },
  accountDescription: {
    'en-US': 'Sign in with this account and write the first post.',
    'zh-CN': '用这个账号登录，并写第一篇文章。',
  },
  accountEmail: {
    'en-US': 'Email',
    'zh-CN': '邮箱',
  },
  accountEmailHint: {
    'en-US':
      'Used to reset the password. A wrong address will not receive the reset mail.',
    'zh-CN': '用于找回密码。写错后收不到重置邮件。',
  },
  accountLaterLogin: {
    'en-US':
      'Passkey, GitHub, or Google can be added later in account settings.',
    'zh-CN': '稍后可在账号设置里添加 Passkey，或用 GitHub、Google 登录。',
  },
  accountPassword: {
    'en-US': 'Password',
    'zh-CN': '密码',
  },
  accountPasswordHint: {
    'en-US': 'At least 8 characters. This page does not reveal the password.',
    'zh-CN': '至少 8 位。此页不回显密码。',
  },
  accountSignInError: {
    'en-US':
      'The account was created, but sign-in did not finish. Sign in with the username and password just entered.',
    'zh-CN': '账号已创建，但登录没有完成。用刚填写的用户名和密码登录。',
  },
  accountSubmit: {
    'en-US': 'Create account',
    'zh-CN': '创建账号',
  },
  accountTitle: {
    'en-US': 'Create the admin account',
    'zh-CN': '创建管理员账号',
  },
  accountUsername: {
    'en-US': 'Username',
    'zh-CN': '用户名',
  },
  accountUsernameHint: {
    'en-US':
      'Use 3 to 30 letters, digits, underscores, dots, or hyphens. A wrong username cannot be used to sign in.',
    'zh-CN':
      '只能用 3 至 30 位字母、数字、下划线、点或连字符。写错后无法用这个名字登录。',
  },
  apiClear: {
    'en-US': 'Clear saved addresses',
    'zh-CN': '清除已保存地址',
  },
  apiClearHint: {
    'en-US':
      "After clearing, this visit returns to the page's default addresses.",
    'zh-CN': '清除后，这次打开会回到当前页面的默认地址。',
  },
  apiDescription: {
    'en-US':
      'Point this admin at a Byline API. A wrong address makes sign-in and posts fail.',
    'zh-CN': '把这个后台接到 Byline 的 API。地址写错后，登录和文章都会失败。',
  },
  apiGateway: {
    'en-US': 'Gateway URL',
    'zh-CN': 'Gateway 地址',
  },
  apiGatewayHint: {
    'en-US':
      'Live updates use this address. A wrong address means the admin misses content changes.',
    'zh-CN': '实时更新用这个地址。写错后，后台收不到内容变更。',
  },
  apiLocal: {
    'en-US': 'Fill local addresses',
    'zh-CN': '填入本地地址',
  },
  apiPersist: {
    'en-US': 'Remember the addresses in this browser',
    'zh-CN': '在这台浏览器记住地址',
  },
  apiPersistHint: {
    'en-US':
      'While this is off, the addresses last only for this session and are dropped when the page closes.',
    'zh-CN': '关闭后只留在本次会话，关掉页面即失效。',
  },
  apiPlaceholder: {
    'en-US': 'https://api.example.com',
    'zh-CN': 'https://api.example.com',
  },
  apiSaveError: {
    'en-US':
      'The addresses were not saved. Check whether the browser blocks local storage, then try again.',
    'zh-CN': '地址没有保存。检查浏览器是否禁止了本地存储后重试。',
  },
  apiSubmit: {
    'en-US': 'Save and open admin',
    'zh-CN': '保存并进入后台',
  },
  apiTitle: {
    'en-US': 'Connect the API',
    'zh-CN': '连接 API',
  },
  apiUrl: {
    'en-US': 'API URL',
    'zh-CN': 'API 地址',
  },
  apiUrlHint: {
    'en-US':
      'The admin reads and writes posts at this address. A wrong address makes sign-in and posts fail.',
    'zh-CN': '后台用这个地址读写文章。写错后，登录和文章都会失败。',
  },
  back: {
    'en-US': 'Back',
    'zh-CN': '返回',
  },
  boot: {
    'en-US': 'Checking whether the site is already initialized',
    'zh-CN': '正在检查站点是否已初始化',
  },
  docs: {
    'en-US': 'Deployment docs',
    'zh-CN': '部署文档',
  },
  featuresBlocked: {
    'en-US': 'Loading AI settings',
    'zh-CN': '正在读取 AI 设置',
  },
  featuresContinue: {
    'en-US': 'Save features and continue',
    'zh-CN': '保存能力并继续',
  },
  featuresDescription: {
    'en-US':
      'Publishing runs these tasks. They can be changed later in settings.',
    'zh-CN': '发布文章时按这些开关生成产物。可稍后在设置里改。',
  },
  featuresInsights: {
    'en-US': 'Insights',
    'zh-CN': '精读',
  },
  featuresInsightsHint: {
    'en-US':
      'Builds a close reading for a long post. While this is off, publishing does not generate one.',
    'zh-CN': '为长文生成精读。关闭后，发布不会生成精读。',
  },
  featuresLanguageBlocked: {
    'en-US': 'Turn translation on before choosing a target language',
    'zh-CN': '先打开翻译，再选目标语言',
  },
  featuresLanguages: {
    'en-US': 'Target languages',
    'zh-CN': '目标语言',
  },
  featuresSaveError: {
    'en-US': 'Features were not saved. The switches are still here. Try again.',
    'zh-CN': '能力没有保存。开关还在，可再试一次。',
  },
  featuresSummary: {
    'en-US': 'Summary',
    'zh-CN': '摘要',
  },
  featuresSummaryHint: {
    'en-US':
      'Builds a summary on publish. Summary languages follow the translation targets.',
    'zh-CN': '发布时生成摘要。摘要语言跟随翻译的目标语言。',
  },
  featuresTitle: {
    'en-US': 'Choose what runs when a post is published',
    'zh-CN': '选择发布时要跑的能力',
  },
  featuresTranslation: {
    'en-US': 'Translation',
    'zh-CN': '翻译',
  },
  featuresTranslationHint: {
    'en-US':
      'Translates the post so readers can switch language. With no target language, publishing does not produce a translation.',
    'zh-CN':
      '把文章翻成其他语言，读者可以切换。不选目标语言时，发布不会生成译文。',
  },
  featuresTts: {
    'en-US': 'Speech',
    'zh-CN': '朗读',
  },
  featuresTtsHint: {
    'en-US': 'Builds spoken audio for the post.',
    'zh-CN': '为文章生成朗读音频。',
  },
  featuresTtsUnavailable: {
    'en-US':
      'Speech has no model from the previous step, so it cannot be turned on.',
    'zh-CN': '上一步没有指定朗读模型，这里不能打开。',
  },
  later: {
    'en-US': 'Fill the rest in settings',
    'zh-CN': '稍后在设置里补',
  },
  modelsBlocked: {
    'en-US': 'The model list is still loading, so this cannot be saved',
    'zh-CN': '模型列表还没读完，不能保存',
  },
  modelsContinue: {
    'en-US': 'Save models and continue',
    'zh-CN': '保存模型并继续',
  },
  modelsDefault: {
    'en-US': 'Default text model',
    'zh-CN': '默认文本模型',
  },
  modelsDefaultHint: {
    'en-US':
      'Writing uses this model. Summary and translation run often and can use a faster model below.',
    'zh-CN':
      '写作对话用这个模型。摘要和翻译调用多，可在下面单独换成更快的模型。',
  },
  modelsDescription: {
    'en-US':
      'Text features without their own model use the default. A wrong choice can be changed later in settings, including reasoning effort.',
    'zh-CN':
      '未单独指定的文本能力使用默认模型。选错可稍后在设置里改，包括推理强度。',
  },
  modelsFollow: {
    'en-US': 'Use the default model',
    'zh-CN': '跟随默认模型',
  },
  modelsImage: {
    'en-US': 'Image',
    'zh-CN': '图片生成',
  },
  modelsImageHint: {
    'en-US':
      'Builds a cover. Without a model, publishing does not generate an image.',
    'zh-CN': '生成封面。没有模型时，发布不会生成图片。',
  },
  modelsInsights: {
    'en-US': 'Insights',
    'zh-CN': '精读',
  },
  modelsInsightsHint: {
    'en-US':
      'Builds the reading notes for a long post. A wrong model writes those notes.',
    'zh-CN': '长文的要点。选错后，精读由这个模型生成。',
  },
  modelsLater: {
    'en-US': 'Image and speech can stay empty and be filled later in settings.',
    'zh-CN': '图片和朗读可以留空，稍后在设置里补。',
  },
  modelsLoadError: {
    'en-US':
      'The model list was not loaded. Load it again before assigning models.',
    'zh-CN': '没有读到模型列表。重新读取后再指定。',
  },
  modelsLoading: {
    'en-US': 'Loading the model list',
    'zh-CN': '正在读取模型列表',
  },
  modelsMissing: {
    'en-US': 'No model available',
    'zh-CN': '没有可用模型',
  },
  modelsNone: {
    'en-US': 'Do not use',
    'zh-CN': '不使用',
  },
  modelsReview: {
    'en-US': 'Translation review',
    'zh-CN': '翻译审稿',
  },
  modelsReviewHint: {
    'en-US': 'Checks the translation. A wrong model is what runs that check.',
    'zh-CN': '检查译文。选错后，审稿由这个模型完成。',
  },
  modelsSaveError: {
    'en-US': 'Models were not saved. The selection is still here. Try again.',
    'zh-CN': '模型没有保存。选择还在，可再试一次。',
  },
  modelsSummary: {
    'en-US': 'Summary',
    'zh-CN': '摘要',
  },
  modelsSummaryHint: {
    'en-US':
      'Builds the summary when a post is published. A wrong model writes that summary.',
    'zh-CN': '发布文章时生成摘要。选错后，摘要由这个模型生成。',
  },
  modelsTitle: {
    'en-US': 'Assign a model to each feature',
    'zh-CN': '指定各能力的模型',
  },
  modelsTranslation: {
    'en-US': 'Translation',
    'zh-CN': '翻译',
  },
  modelsTranslationHint: {
    'en-US':
      'Translates the body and title. A wrong model writes the translation.',
    'zh-CN': '正文和标题的翻译。选错后，译文由这个模型生成。',
  },
  modelsTts: {
    'en-US': 'Speech',
    'zh-CN': '朗读',
  },
  modelsTtsHint: {
    'en-US':
      'Needs a provider that can speak. Without a model, speech stays off on the next step.',
    'zh-CN': '需要支持朗读的供应商。没有模型时，下一步不能开朗读。',
  },
  modelsWriter: {
    'en-US': 'Writing assistant',
    'zh-CN': '写作助手',
  },
  modelsWriterHint: {
    'en-US':
      'AI chat and rewrites in the editor. A wrong model is what the writing chat uses.',
    'zh-CN': '编辑器里的 AI 对话和改写。选错后，写作对话会用错模型。',
  },
  progress: {
    'en-US': '{name} · Step {current} of {total}, {remaining} left',
    'zh-CN': '{name} · 第 {current} 步，共 {total} 步，还剩 {remaining} 步',
  },
  progressLast: {
    'en-US': '{name} · Step {current} of {total}, last step',
    'zh-CN': '{name} · 第 {current} 步，共 {total} 步，这是最后一步',
  },
  providersAdd: {
    'en-US': 'Verify and add provider',
    'zh-CN': '验证并添加供应商',
  },
  providersAddBlocked: {
    'en-US': 'Enter an API key first',
    'zh-CN': '先填写 API 密钥',
  },
  providersAsideHint: {
    'en-US':
      'Speech and images need a provider that supports them, such as OpenAI or Gemini. This can be changed later in settings.',
    'zh-CN':
      '朗读和图片需要支持对应能力的供应商，例如 OpenAI 或 Gemini。可稍后在设置里改。',
  },
  providersCompatible: {
    'en-US': 'OpenAI-compatible',
    'zh-CN': 'OpenAI 兼容',
  },
  providersContinue: {
    'en-US': 'Continue to models',
    'zh-CN': '继续配置模型',
  },
  providersContinueBlocked: {
    'en-US': 'Add a provider first, or skip AI',
    'zh-CN': '先添加一个供应商，或跳过 AI',
  },
  providersDescription: {
    'en-US':
      'Posts can be written without AI. A key is saved only after it verifies, and this page does not reveal it.',
    'zh-CN': '不接入也能写文章。密钥验证通过后才保存，此页不回显。',
  },
  providersEmpty: {
    'en-US': 'No provider yet. Add a key, or skip AI.',
    'zh-CN': '还没有供应商。添加一把密钥，或跳过 AI。',
  },
  providersEndpoint: {
    'en-US': 'Endpoint',
    'zh-CN': '接口地址',
  },
  providersEndpointHint: {
    'en-US':
      'Change this only for a proxy. A wrong address fails verification and the key is not saved.',
    'zh-CN': '走代理时再改。地址错误时验证不会通过，密钥不会写入。',
  },
  providersEndpointPlaceholder: {
    'en-US': 'https://api.example.com',
    'zh-CN': 'https://api.example.com',
  },
  providersKey: {
    'en-US': 'API key',
    'zh-CN': 'API 密钥',
  },
  providersKeyHint: {
    'en-US':
      'A wrong key is not saved. If verification fails, try another key.',
    'zh-CN': '密钥错误时不会保存。验证失败可换一把再试。',
  },
  providersList: {
    'en-US': 'Added providers',
    'zh-CN': '已添加的供应商',
  },
  providersLoadError: {
    'en-US':
      'AI settings were not loaded. Load them again before adding a provider.',
    'zh-CN': '没有读到 AI 设置。重新读取后再添加供应商。',
  },
  providersLoading: {
    'en-US': 'Loading AI settings',
    'zh-CN': '正在读取 AI 设置',
  },
  providersModels: {
    'en-US': '{count} models',
    'zh-CN': '{count} 个模型',
  },
  providersRemove: {
    'en-US': 'Remove {name}',
    'zh-CN': '移除 {name}',
  },
  providersSaveError: {
    'en-US':
      'The provider was not saved. The key is still in the field. Try again.',
    'zh-CN': '供应商没有保存。密钥仍在输入框里，可再试一次。',
  },
  providersSkip: {
    'en-US': 'Skip AI',
    'zh-CN': '跳过 AI',
  },
  providersTestFailed: {
    'en-US':
      'The key or endpoint did not verify. Check them and try again. The key was not saved.',
    'zh-CN': '密钥或接口地址没有通过验证。检查后再试，密钥不会被保存。',
  },
  providersTestOk: {
    'en-US': 'Connected. {count} models were read.',
    'zh-CN': '已连上，读到 {count} 个模型',
  },
  providersTitle: {
    'en-US': 'Decide whether to connect AI',
    'zh-CN': '决定是否接入 AI',
  },
  railLabel: {
    'en-US': 'Setup steps',
    'zh-CN': '初始化步骤',
  },
  readyAccount: {
    'en-US': 'Account',
    'zh-CN': '账号',
  },
  readyAi: {
    'en-US': 'AI',
    'zh-CN': 'AI',
  },
  readyConnect: {
    'en-US': 'Connect a frontend',
    'zh-CN': '接入前台',
  },
  readyConnectHint: {
    'en-US': 'Read posts with @mx-space/byline-api-client',
    'zh-CN': '用 @mx-space/byline-api-client 读取文章',
  },
  readyDescription: {
    'en-US':
      'This is what was saved. The first post can be written after entering the admin.',
    'zh-CN': '下面是这次保存的结果。进入后台后即可写第一篇。',
  },
  readyEdit: {
    'en-US': 'Edit',
    'zh-CN': '修改',
  },
  readyEmpty: {
    'en-US': '--',
    'zh-CN': '--',
  },
  readyEnter: {
    'en-US': 'Enter admin',
    'zh-CN': '进入后台',
  },
  readyInvite: {
    'en-US': 'Invite an author',
    'zh-CN': '邀请作者',
  },
  readyInviteHint: {
    'en-US': 'The byline follows author order',
    'zh-CN': '署名按作者顺序排列',
  },
  readyLanguages: {
    'en-US': 'Target languages',
    'zh-CN': '目标语言',
  },
  readyLoadError: {
    'en-US': 'Saved results were not loaded. The admin can still be opened.',
    'zh-CN': '没有读到已保存的结果。仍可进入后台。',
  },
  readyLoading: {
    'en-US': 'Loading what was saved',
    'zh-CN': '正在读取已保存的结果',
  },
  readySeparator: {
    'en-US': ', ',
    'zh-CN': '、',
  },
  readySite: {
    'en-US': 'Site URL',
    'zh-CN': '前台地址',
  },
  readyTitle: {
    'en-US': 'The site is ready for a first post',
    'zh-CN': '可以开始写文章',
  },
  readyWrite: {
    'en-US': 'Write the first post',
    'zh-CN': '写第一篇文章',
  },
  readyWriteHint: {
    'en-US': 'Opens the editor',
    'zh-CN': '打开编辑器',
  },
  resumeContinue: {
    'en-US': 'Continue setup',
    'zh-CN': '继续初始化',
  },
  resumeDescription: {
    'en-US': 'Site or AI steps are still unsaved.',
    'zh-CN': '站点或 AI 还有步骤没保存。',
  },
  resumeDismiss: {
    'en-US': 'Dismiss',
    'zh-CN': '不再提示',
  },
  resumeTitle: {
    'en-US': 'Setup is not finished',
    'zh-CN': '初始化还没做完',
  },
  retry: {
    'en-US': 'Load again',
    'zh-CN': '重新读取',
  },
  siteAdmin: {
    'en-US': 'Admin URL',
    'zh-CN': '后台地址',
  },
  siteContinue: {
    'en-US': 'Save site and continue',
    'zh-CN': '保存站点并继续',
  },
  siteDescription: {
    'en-US':
      'The source language sets the translation direction. The public site URL can stay empty for now.',
    'zh-CN': '原文语言决定翻译方向。前台地址可以先留空。',
  },
  siteLoadError: {
    'en-US': 'Saved site settings were not loaded',
    'zh-CN': '没有读到已保存的站点设置',
  },
  siteLoadErrorDetail: {
    'en-US': 'Continue with the detected addresses, or load them again.',
    'zh-CN': '可以按当前识别到的地址继续，或重新读取。',
  },
  siteLoading: {
    'en-US': 'Loading the saved site settings',
    'zh-CN': '正在读取已保存的站点设置',
  },
  siteSaveError: {
    'en-US':
      'The site was not saved. What you entered is still here. Check the addresses and try again.',
    'zh-CN': '站点没有保存。已填写的内容还在，检查地址后重试。',
  },
  siteServer: {
    'en-US': 'API URL',
    'zh-CN': 'API 地址',
  },
  siteServices: {
    'en-US': 'Service URLs',
    'zh-CN': '服务地址',
  },
  siteServicesHint: {
    'en-US':
      'Leave these unless they are wrong. A wrong URL disconnects the admin from the API.',
    'zh-CN': '一般不用改。改错后，后台会连不上 API。',
  },
  siteSource: {
    'en-US': 'Source language',
    'zh-CN': '原文语言',
  },
  siteSourceHint: {
    'en-US':
      'If this is wrong, translation treats the source as the target. It can be changed later in site settings.',
    'zh-CN': '选错后，翻译会把原文当成译文。可稍后在站点设置里改。',
  },
  siteTitle: {
    'en-US': 'Set the source language and site URL',
    'zh-CN': '设置原文和前台地址',
  },
  siteWeb: {
    'en-US': 'Site URL',
    'zh-CN': '前台地址',
  },
  siteWebHint: {
    'en-US':
      'The address readers open. Leave it empty to fill it later in site settings. A wrong address makes shared links fail.',
    'zh-CN':
      '读者访问的网址。留空则稍后在站点设置里补。写错后，分享出去的链接打不开。',
  },
  siteWebPlaceholder: {
    'en-US': 'https://blog.example.com',
    'zh-CN': 'https://blog.example.com',
  },
  siteWs: {
    'en-US': 'Gateway URL',
    'zh-CN': 'Gateway 地址',
  },
  stepAccount: {
    'en-US': 'Account',
    'zh-CN': '账号',
  },
  stepAi: {
    'en-US': 'AI',
    'zh-CN': 'AI',
  },
  stepFeatures: {
    'en-US': 'Features',
    'zh-CN': '能力',
  },
  stepModels: {
    'en-US': 'Models',
    'zh-CN': '模型',
  },
  stepProviders: {
    'en-US': 'Providers',
    'zh-CN': '供应商',
  },
  stepReady: {
    'en-US': 'Done',
    'zh-CN': '完成',
  },
  stepSite: {
    'en-US': 'Site',
    'zh-CN': '站点',
  },
  stepWelcome: {
    'en-US': 'Connection',
    'zh-CN': '连接',
  },
  welcomeContinue: {
    'en-US': 'Continue to the account',
    'zh-CN': '继续创建账号',
  },
  welcomeBlocked: {
    'en-US': 'The API is unreachable, so the account cannot be created',
    'zh-CN': '还没有连上 API，不能创建账号',
  },
  welcomeChange: {
    'en-US': 'Change API address',
    'zh-CN': '更换 API 地址',
  },
  welcomeConnected: {
    'en-US': 'Connected to {url}',
    'zh-CN': '已连上 {url}',
  },
  welcomeDescription: {
    'en-US':
      'The first admin account can be created after the API is reachable.',
    'zh-CN': '连通之后才能创建第一个管理员账号。',
  },
  welcomeDisconnected: {
    'en-US': 'Cannot reach {url}',
    'zh-CN': '连不上 {url}',
  },
  welcomeDisconnectedDetail: {
    'en-US':
      'Check the network, or point this admin at another API before creating an account.',
    'zh-CN': '检查网络，或更换 API 地址后再创建账号。',
  },
  welcomeLoading: {
    'en-US': 'Loading the version',
    'zh-CN': '正在读取版本',
  },
  welcomeLoadError: {
    'en-US': 'The version was not loaded. The connection itself is usable.',
    'zh-CN': '没有读到版本号。连接本身可用。',
  },
  welcomeTitle: {
    'en-US': 'Confirm the API is reachable',
    'zh-CN': '确认 API 已连通',
  },
  welcomeVersion: {
    'en-US': 'Version {version}',
    'zh-CN': '版本 {version}',
  },
}

export const setupCopy = createFeatureCopy(catalog)

export type SetupCopyKey = keyof typeof catalog

export function useSetupCopy() {
  const { locale } = useI18n()
  return useCallback(
    (key: SetupCopyKey, values?: Record<string, number | string>) =>
      setupCopy(locale, key, values),
    [locale],
  )
}
