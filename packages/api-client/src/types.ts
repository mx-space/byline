export interface ApiResponse<T, M = Record<string, unknown>> {
  data: T
  meta?: M
}

export interface Pagination {
  page: number
  size: number
  total: number
  totalPages: number
}

export interface PaginatedMeta {
  pagination: Pagination
  [key: string]: unknown
}

export interface ArticleTranslationMeta {
  isTranslated: boolean
  sourceLang?: string | null
  targetLang?: string | null
  translatedAt?: string
  model?: string
  availableTranslations?: string[]
}

export interface EntryTranslationMeta {
  article?: ArticleTranslationMeta
}

export interface PostResponseMeta {
  view?: string
  pagination?: Pagination
  translation?: EntryTranslationMeta | Record<string, EntryTranslationMeta>
  glossary?: { tags?: Array<{ source: string; translated: string }> }
  insights?: { hasInLocale: boolean }
  summary?: { id: string; text: string; lang: string; createdAt: string }
  tts?: {
    available: boolean
    lang?: string
    blockCount?: number
    stale?: boolean
    updatedAt?: string | null
  }
}

export interface LexicalEditorState {
  root: {
    type: 'root'
    children: unknown[]
    [key: string]: unknown
  }
}

export interface PublicAuthor {
  id: string
  displayName: string
  avatar: string | null
  bio: string | null
  url: string | null
}

export interface Author extends PublicAuthor {
  username: string | null
}

export interface AuthorListQuery {
  page?: number
  size?: number
}

export interface UserDetail extends PublicAuthor {
  email: string | null
  username: string | null
  permissions: number
  isProfileOnly: boolean
  deactivatedAt: string | null
  createdAt: string
  updatedAt: string | null
  lastLoginAt?: string | null
}

export interface UserProfileInput {
  displayName?: string
  avatar?: string | null
  bio?: string | null
  url?: string | null
  email?: string | null
  username?: string
}

export interface ProfileOnlyUserInput extends UserProfileInput {
  displayName: string
}

export type UserListStatus = 'all' | 'active' | 'deactivated' | 'profile_only'

export interface UserListQuery {
  page?: number
  size?: number
  search?: string
  status?: UserListStatus
}

export interface Invite {
  id: string
  email: string
  displayName: string | null
  invitedBy: string | null
  userId: string | null
  expiresAt: string
  acceptedAt: string | null
  createdAt: string
}

export interface CreatedInvite extends Invite {
  token: string
  acceptUrl: string
  emailQueued: boolean
}

export interface CreateInviteInput {
  email: string
  displayName?: string
}

export interface InviteUserInput {
  email?: string
  displayName?: string
}

export interface PublicInvite {
  email: string
  displayName: string | null
  expiresAt: string
}

export interface AcceptInviteInput {
  username: string
  password: string
  displayName?: string
}

export interface InitUserInput {
  username: string
  password: string
  mail: string
  name?: string
  url?: string
  avatar?: string
  bio?: string
}

export interface AllowLoginResult {
  password: boolean
  passkey: boolean
  [provider: string]: boolean
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  type: number
}

export interface Category extends CategorySummary {
  createdAt?: string
  count?: number
  [key: string]: unknown
}

export interface PostSeo {
  title?: string | null
  description?: string | null
  image?: string | null
}

export interface PostImage {
  src: string
  alt?: string
  [key: string]: unknown
}

export interface Post {
  publicAt?: string | null
  id: string
  title: string
  slug: string
  text: string
  content: string | null
  contentFormat: 'lexical'
  summary: string | null
  images: PostImage[] | null
  meta: Record<string, unknown> | null
  tags: string[]
  categoryId: string
  category?: CategorySummary
  isPublished: boolean
  pinAt: string | null
  pinOrder: number | null
  createdAt: string
  modifiedAt: string | null
  authors: PublicAuthor[]
  sourceLang: string | null
  image: string | null
  seo: PostSeo | null
  [key: string]: unknown
}

export type PostSortKey = 'createdAt' | 'modifiedAt' | 'pinAt'

export interface PostListQuery {
  page?: number
  size?: number
  sortBy?: PostSortKey
  sortOrder?: 'asc' | 'desc'
  categoryIds?: string[]
  authorId?: string
  year?: number
  truncate?: number
  lang?: string
}

export interface PostPatch {
  publicAt?: string | null
  categoryId?: string
  pinAt?: string | null
  authors?: string[]
  sourceLang?: string | null
  image?: string | null
  seo?: PostSeo | null
}

export interface PostWriteInput {
  publicAt?: string | null
  title: string
  content: string | LexicalEditorState
  text?: string
  slug?: string
  categoryId?: string
  summary?: string | null
  tags?: string[]
  authors?: string[]
  sourceLang?: string | null
  image?: string | null
  seo?: PostSeo | null
  images?: PostImage[] | null
  meta?: Record<string, unknown> | null
  pin?: boolean
  pinOrder?: number | null
  createdAt?: string
}

export type DraftRefType = 'post'
export type RevisionRelation = 'same' | 'ancestor' | 'descendant' | 'diverged'

export interface RevisionSnapshot {
  content: string | null
  contentFormat: 'lexical'
  images: unknown[] | null
  meta: Record<string, unknown> | null
  text: string
  title: string
  typeSpecificData: Record<string, unknown> | null
}

export interface ContentRevision extends RevisionSnapshot {
  id: string
  documentId: string
  parentRevisionId: string | null
  createdAt: string
}

export interface ContentDocument {
  id: string
  refId: string | null
  refType: DraftRefType
  publishedRevisionId: string | null
  publishAiResources: PublishAiResourceRequest[] | null
  createdAt: string
  updatedAt: string | null
}

export interface DraftBranch {
  id: string
  documentId: string
  baseRevisionId: string
  headRevisionId: string
  status: 'active' | 'archived'
  document: ContentDocument
  headRevision: ContentRevision
  baseRevision: ContentRevision
  publishedRevision: ContentRevision | null
  relationToPublished: RevisionRelation | null
  createdAt: string
  updatedAt: string | null
}

export interface VersionContext {
  document: ContentDocument
  branches: DraftBranch[]
  publishedRevision: ContentRevision | null
  [key: string]: unknown
}

export interface DraftWriteData {
  title?: string
  text?: string
  content?: string
  contentFormat?: 'lexical'
  images?: PostImage[] | null
  meta?: Record<string, unknown> | null
  typeSpecificData?: Record<string, unknown> | null
}

export interface CreateDraftInput {
  refType: DraftRefType
  refId?: string
  baseRevisionId?: string | null
  data: DraftWriteData
}

export type PublishAiResource = 'insights' | 'summary' | 'translation' | 'tts'

export interface PublishAiResourceRequest {
  resource: PublishAiResource
  mode: 'sync' | 'async'
}

export interface CreatePublishJobInput {
  branchId: string
  revisionId: string
  expectedPublishedRevisionId?: string | null
  confirmDiverged?: boolean
  aiResources?: Array<PublishAiResource | PublishAiResourceRequest>
  regenerateLockedTranslations?: boolean
}

export interface TaskRef {
  taskId: string
  created: boolean
}

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'partial_failed'
  | 'failed'
  | 'cancelled'

export interface Task<TResult = unknown> {
  id: string
  type: string
  status: TaskStatus
  progress?: number
  progressMessage?: string
  result?: TResult
  error?: string
  createdAt: number
  completedAt?: number
  [key: string]: unknown
}

export interface PublishTaskResult {
  articleCommitted: boolean
  articleId: string
  newerDraftChanges: boolean
  publishedRevisionId: string
  resources: Partial<Record<PublishAiResource, string>>
}

export interface Translation {
  id: string
  refId: string
  refType: string
  lang: string
  sourceLang: string
  title: string
  text: string
  subtitle: string | null
  summary: string | null
  tags: string[]
  content: string | null
  contentFormat: 'lexical' | null
  isLocked: boolean
  aiModel: string | null
  aiProvider: string | null
  seo: PostSeo | null
  createdAt: string
  updatedAt: string | null
  [key: string]: unknown
}

export interface ManualTranslationInput {
  title: string
  content: string | LexicalEditorState
  text?: string
  subtitle?: string | null
  summary?: string | null
  tags?: string[]
  sourceLang?: string
  seo?: PostSeo | null
}

export interface TranslationPatch {
  title?: string
  text?: string
  subtitle?: string | null
  summary?: string
  tags?: string[]
  content?: string | null
  isLocked?: boolean
  seo?: PostSeo | null
}

export interface TranslationTaskInput {
  refId: string
  targetLanguages?: string[]
  force?: boolean
  regenerateLocked?: boolean
}

export interface TranslationTaskResult {
  translations: unknown[]
  skippedLocked: string[]
}

export interface DynamicComponent {
  name: string
  description: string
  url: string
  initialHeight: number
  propsSchema: Record<string, unknown>
  parentUrl?: string
}

export interface DynamicComponentCatalog {
  version: 1
  components: DynamicComponent[]
}

export interface RegisterDynamicComponentInput {
  name: string
  url: string
  description?: string
  initialHeight: number
  propsSchema?: Record<string, unknown>
  parentUrl?: string
}

export type FileType = 'image' | 'file' | 'avatar' | 'icon' | 'video' | 'audio'

export interface UploadedFile {
  url: string
  name: string
  storageBackend?: string
  storageKey?: string
}
