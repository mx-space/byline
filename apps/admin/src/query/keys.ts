const adminTaskKeys = {
  taskDetail: (id: string) => ['tasks', 'detail', id] as const,
  tasks: (params: {
    page: number
    scope?: string
    size: number
    status?: string | string[]
    type?: string
  }) => ['tasks', params] as const,
  tasksByGroup: (groupId: string) => ['tasks', 'byGroup', groupId] as const,
  tasksRoot: ['tasks'] as const,
}

export const adminQueryKeys = {
  auth: {
    loggedStatus: () => ['auth', 'check-logged'] as const,
  },
  ai: {
    defaultLangs: (optionKey: string) =>
      ['ai', 'default-langs', optionKey] as const,
    grouped: (params: { group: string; search: string }) =>
      ['ai', params.group, 'grouped', params.search] as const,
    groupedByRef: (params: { group: string; id: string }) =>
      ['ai', params.group, 'by-ref', params.id] as const,
    groupedRoot: (group: string) => ['ai', group] as const,
    groupedListRoot: (group: string) => ['ai', group, 'grouped'] as const,
    imageGenerationOptions: () => ['ai', 'image', 'options'] as const,
    lockedTranslations: (refId: string) =>
      ['ai', 'locked-translations', refId] as const,
    imageModels: () => ['ai', 'image', 'models'] as const,
    imagePresets: () => ['ai', 'image', 'presets'] as const,
    models: (context: string) => ['ai', 'models', context] as const,
    overviewArticle: (refId: string) =>
      ['ai', 'overview', 'article', refId] as const,
    overviewList: (params: { search: string; type: string }) =>
      ['ai', 'overview', 'grouped', params] as const,
    overviewListRoot: ['ai', 'overview', 'grouped'] as const,
    overviewRoot: ['ai', 'overview'] as const,
    publishOptions: () => ['ai', 'publish-options'] as const,
    root: ['ai'] as const,
    translationEntriesRoot: ['ai', 'translation-entries'] as const,
    translationEntries: (params: {
      keyPath?: string
      lang?: string
      page: number
      size: number
    }) => ['ai', 'translation-entries', params] as const,
    ttsByRef: (refId: string) => ['ai', 'tts', 'by-ref', refId] as const,
    ttsOptions: () => ['ai', 'tts', 'options'] as const,
    ttsRoot: ['ai', 'tts'] as const,
    ttsVoices: (providerId: string, model: string) =>
      ['ai', 'tts', 'voices', providerId, model] as const,
    ttsVoicesRoot: ['ai', 'tts', 'voices'] as const,
  },
  categories: {
    detail: (id: string) => ['categories', 'detail', id] as const,
    list: () => ['categories', 'list'] as const,
    postFilter: () => ['categories', 'post-filter'] as const,
    root: ['categories'] as const,
    tags: () => ['categories', 'tags'] as const,
  },
  dashboard: {
    appInfo: () => ['dashboard', 'app-info'] as const,
    drafts: () => ['dashboard', 'drafts'] as const,
    recentPosts: () => ['dashboard', 'recent-posts'] as const,
  },
  files: {
    byType: (type: string) => ['files', 'by-type', type] as const,
    orphans: (params: { page: number; size: number }) =>
      ['files', 'orphans', params] as const,
    root: ['files'] as const,
  },
  login: {
    allowLogin: () => ['login', 'allow-login'] as const,
    init: () => ['login', 'init'] as const,
  },
  onboarding: {
    ai: () => ['onboarding', 'ai'] as const,
    info: () => ['onboarding', 'info'] as const,
    me: () => ['onboarding', 'me'] as const,
    models: (capability: string) =>
      ['onboarding', 'models', capability] as const,
    modelsRoot: ['onboarding', 'models'] as const,
    site: () => ['onboarding', 'site'] as const,
    url: () => ['onboarding', 'url'] as const,
  },
  posts: {
    categoryDetail: (id: string) => ['posts', 'category-detail', id] as const,
    list: (params: {
      categoryId: string
      keyword: string
      page: number
      size: number
      sortKey: string
      sortOrder: string
      visibility: string
    }) => ['posts', 'list', params] as const,
    relatedOptions: (context: string) =>
      ['posts', 'related-options', context] as const,
    tagDetail: (name: string) => ['posts', 'tag-detail', name] as const,
    root: ['posts'] as const,
  },
  drafts: {
    byRef: (params: { id: string; refType: string }) =>
      ['drafts', 'by-ref', params.refType, params.id] as const,
    detail: (id: string) => ['drafts', 'detail', id] as const,
    history: (id: string) => ['drafts', 'history', id] as const,
    historyVersion: (params: { id: string; version: number | null }) =>
      ['drafts', 'history-version', params.id, params.version] as const,
    listRoot: ['drafts', 'list'] as const,
    list: (filterType: string) => ['drafts', 'list', filterType] as const,
    newDraft: (refType: string) => ['drafts', 'new', refType] as const,
    recoveryHistory: (id: string) =>
      ['drafts', 'recovery-history', id] as const,
    recoveryVersion: (params: { id: string; version: number | null }) =>
      ['drafts', 'recovery-version', params.id, params.version] as const,
    root: ['drafts'] as const,
    share: (documentId: string) => ['drafts', 'share', documentId] as const,
    timeline: (id: string) => ['drafts', 'timeline', id] as const,
    archived: (id: string) => ['drafts', 'archived', id] as const,
  },
  settings: {
    accountRoot: ['settings', 'account'] as const,
    aiModels: () => ['settings', 'ai-models'] as const,
    authSecurity: () => ['settings', 'account', 'auth-security'] as const,
    oauth: () => ['settings', 'account', 'oauth'] as const,
    options: () => ['settings', 'options'] as const,
    passkeys: () => ['settings', 'account', 'passkeys'] as const,
    root: ['settings'] as const,
    schema: () => ['settings', 'schema'] as const,
    sessions: () => ['settings', 'account', 'sessions'] as const,
    site: () => ['settings', 'site'] as const,
    tokens: () => ['settings', 'account', 'tokens'] as const,
    url: () => ['settings', 'url'] as const,
  },
  users: {
    authors: () => ['users', 'authors'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    invites: () => ['users', 'invites'] as const,
    list: (params: { search: string; status: string }) =>
      ['users', 'list', params] as const,
    listRoot: ['users', 'list'] as const,
    me: () => ['users', 'me'] as const,
    root: ['users'] as const,
  },
  tasks: {
    taskDetail: adminTaskKeys.taskDetail,
    tasks: adminTaskKeys.tasks,
    tasksByGroup: adminTaskKeys.tasksByGroup,
    tasksRoot: adminTaskKeys.tasksRoot,
  },
  dynamicComponents: {
    list: () => ['dynamic-components', 'list'] as const,
    root: ['dynamic-components'] as const,
    source: (url: string) => ['dynamic-components', 'source', url] as const,
  },
  webhooks: {
    dispatchesRoot: (webhookId: string) =>
      ['webhooks', 'dispatches', webhookId] as const,
    dispatches: (params: { page: number; size: number; webhookId: string }) =>
      [
        'webhooks',
        'dispatches',
        params.webhookId,
        { page: params.page, size: params.size },
      ] as const,
    events: () => ['webhooks', 'events'] as const,
    list: () => ['webhooks', 'list'] as const,
    root: ['webhooks'] as const,
  },
  write: {
    contentRoot: (_kind: 'post') => ['posts'] as const,
    detail: (params: { id: string; kind: 'post' }) =>
      ['posts', 'write-detail', params.id] as const,
  },
} as const
