/**
 * Injection tokens used by repository providers. Each repository receives the
 * shared {@link AppDatabase} via {@link PG_DB_TOKEN}; these tokens identify
 * the repositories themselves so services can request them by symbol.
 */
export const POSTGRES_REPOSITORY_TOKENS = {
  category: Symbol('CategoryRepository'),
  post: Symbol('PostRepository'),
  draft: Symbol('DraftRepository'),
  reader: Symbol('ReaderRepository'),
  ownerProfile: Symbol('OwnerProfileRepository'),
  apiKey: Symbol('ApiKeyRepository'),
  account: Symbol('AccountRepository'),
  session: Symbol('SessionRepository'),
  aiSummary: Symbol('AiSummaryRepository'),
  aiInsights: Symbol('AiInsightsRepository'),
  aiTranslation: Symbol('AiTranslationRepository'),
  translationEntry: Symbol('TranslationEntryRepository'),
  aiAgentConversation: Symbol('AiAgentConversationRepository'),
  aiTts: Symbol('AiTtsRepository'),
  fileReference: Symbol('FileReferenceRepository'),
  slugTracker: Symbol('SlugTrackerRepository'),
  webhook: Symbol('WebhookRepository'),
  webhookEvent: Symbol('WebhookEventRepository'),
  options: Symbol('OptionsRepository'),
} as const

export type PostgresRepositoryToken =
  (typeof POSTGRES_REPOSITORY_TOKENS)[keyof typeof POSTGRES_REPOSITORY_TOKENS]
