import type { AppErrorCode } from './app-error-code'

type WithMessage = { message: string }
type OptMessage = { message?: string } | undefined
type WithId = { id?: string } | undefined
type WithExtra = { extra?: string } | undefined

export type AppErrorPayloadMap = {
  // generic
  [AppErrorCode.INTERNAL_ERROR]: OptMessage
  [AppErrorCode.NOT_FOUND]: { message?: string; id?: string } | undefined
  [AppErrorCode.NO_CONTENT_MODIFIABLE]: undefined
  [AppErrorCode.DEMO_FORBIDDEN]: undefined
  [AppErrorCode.PERMISSION_DENIED]: undefined
  [AppErrorCode.RESOURCE_NOT_FOUND]: WithId
  [AppErrorCode.CONTENT_NOT_FOUND]: WithId
  [AppErrorCode.CONTENT_NOT_FOUND_CANT_PROCESS]: OptMessage
  [AppErrorCode.MAX_COUNT_LIMIT]: undefined
  [AppErrorCode.MASTER_LOST]: undefined
  [AppErrorCode.CANNOT_GET_IP]: undefined
  [AppErrorCode.ENTRY_NOT_FOUND]: WithId
  [AppErrorCode.REF_MODEL_NOT_FOUND]: WithExtra

  // validation
  [AppErrorCode.INVALID_PARAMETER]: WithMessage
  [AppErrorCode.INVALID_BODY]: undefined
  [AppErrorCode.INVALID_SLUG]: undefined
  [AppErrorCode.INVALID_NAME]: undefined
  [AppErrorCode.INVALID_REFERENCE]: undefined
  [AppErrorCode.INVALID_ORDER_VALUE]: undefined
  [AppErrorCode.INVALID_VIEW]: { view: string; available: string[] }
  [AppErrorCode.SLUG_NOT_AVAILABLE]: undefined
  [AppErrorCode.VALIDATION_FAILED]: { issues?: unknown } | undefined

  // ai
  [AppErrorCode.AI_CONTENT_MISSING]: WithMessage
  [AppErrorCode.AI_INVALID_PARAMETER]: WithMessage
  [AppErrorCode.AI_INVALID_QUERY_TYPE]: undefined
  [AppErrorCode.AI_NOT_ENABLED]: OptMessage
  [AppErrorCode.AI_KEY_EXPIRED]: undefined
  [AppErrorCode.AI_PROCESSING]: undefined
  [AppErrorCode.AI_PROVIDER_DISABLED]: { providerId?: string } | undefined
  [AppErrorCode.AI_PROVIDER_NOT_FOUND]: { providerId?: string } | undefined
  [AppErrorCode.AI_REVIEW_NOT_ENABLED]: undefined
  [AppErrorCode.AI_RESULT_PARSING_ERROR]: OptMessage
  [AppErrorCode.AI_SERVICE_ERROR]: OptMessage
  [AppErrorCode.TASK_NOT_FOUND]: WithId
  [AppErrorCode.TASK_ALREADY_COMPLETED]: undefined
  [AppErrorCode.TASK_CANNOT_RETRY]: { reason?: string } | undefined
  [AppErrorCode.AI_TRANSLATION_NOT_FOUND]: undefined

  // image generation
  [AppErrorCode.IMAGE_GENERATION_DISABLED]: undefined
  [AppErrorCode.IMAGE_PROVIDER_NOT_CONFIGURED]: undefined
  [AppErrorCode.IMAGE_GENERATION_FAILED]: OptMessage

  // TTS
  [AppErrorCode.TTS_DISABLED]: undefined
  [AppErrorCode.TTS_PROVIDER_NOT_CONFIGURED]: undefined
  [AppErrorCode.TTS_SOURCE_NOT_LEXICAL]: { lang?: string } | undefined
  [AppErrorCode.TTS_GENERATION_FAILED]: { message?: string } | undefined
  [AppErrorCode.TTS_BUDGET_EXCEEDED]: { charCount: number; limit: number }

  // auth
  [AppErrorCode.AUTH_DEVICE_FLOW_PENDING]: undefined
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: undefined
  [AppErrorCode.AUTH_NOT_LOGGED_IN]: undefined
  [AppErrorCode.AUTH_SESSION_EXPIRED]: undefined
  [AppErrorCode.AUTH_TOKEN_NOT_FOUND]: undefined
  [AppErrorCode.AUTH_CHALLENGE_MISSING]: undefined
  [AppErrorCode.AUTH_CHALLENGE_EXPIRED]: undefined
  [AppErrorCode.AUTH_REGISTRATION_MISSING]: undefined
  [AppErrorCode.AUTH_USERNAME_INCORRECT]: undefined
  [AppErrorCode.AUTH_PASSWORD_INCORRECT]: undefined
  [AppErrorCode.AUTH_SESSION_NOT_FOUND]: undefined
  [AppErrorCode.AUTH_USER_ID_NOT_FOUND]: undefined
  [AppErrorCode.AUTH_FAILED]: OptMessage
  [AppErrorCode.AUTH_TOKEN_INVALID]: undefined
  [AppErrorCode.PASSWORD_LOGIN_DISABLED]: undefined
  [AppErrorCode.PASSWORD_SAME_AS_OLD]: undefined

  // category
  [AppErrorCode.CATEGORY_NOT_FOUND]: WithId
  [AppErrorCode.CATEGORY_HAS_POSTS]: undefined

  // config
  [AppErrorCode.CONFIG_NOT_FOUND]: WithId
  [AppErrorCode.CONFIG_VALIDATION_FAILED]: OptMessage

  // cron
  [AppErrorCode.CRON_NOT_FOUND]: WithExtra

  // draft
  [AppErrorCode.DRAFT_NOT_FOUND]: WithId
  [AppErrorCode.CONTENT_REVISION_NOT_FOUND]: WithId
  [AppErrorCode.DRAFT_SHARE_NOT_FOUND]: WithId | undefined
  [AppErrorCode.DRAFT_HEAD_CONFLICT]: {
    actualHeadRevisionId: string
    branchId: string
    expectedHeadRevisionId: string
  }
  [AppErrorCode.PUBLISHED_REVISION_CHANGED]: {
    actualPublishedRevisionId: string | null
    documentId: string
    expectedPublishedRevisionId: string | null
  }

  // document / helper
  [AppErrorCode.DOCUMENT_NOT_FOUND]: WithId
  [AppErrorCode.HELPER_DOCUMENT_NOT_FOUND]: WithId

  // email
  [AppErrorCode.EMAIL_TEMPLATE_NOT_FOUND]: undefined

  // file
  [AppErrorCode.FILE_NOT_FOUND]: { name?: string; extra?: string } | undefined
  [AppErrorCode.FILE_EXISTS]: undefined
  [AppErrorCode.FILE_RENAME_FAILED]: undefined
  [AppErrorCode.FILE_TOO_LARGE]: undefined
  [AppErrorCode.FILE_STORAGE_NOT_CONFIGURED]: undefined
  [AppErrorCode.FILE_REQUIRED]: undefined
  [AppErrorCode.MIME_ZIP_REQUIRED]: { got?: string } | undefined

  // init
  [AppErrorCode.INIT_ALREADY_COMPLETED]: undefined
  [AppErrorCode.INIT_FORBIDDEN]: undefined
  [AppErrorCode.INIT_INVALID_BODY]: undefined

  // user
  [AppErrorCode.USER_NOT_EXISTS]: undefined
  [AppErrorCode.USER_ALREADY_EXISTS]: undefined
  [AppErrorCode.USER_NOT_FOUND]: WithId
  [AppErrorCode.USER_CONFLICT]: { field?: 'username' | 'email' } | undefined
  [AppErrorCode.USER_IDENTITY_LOCKED]: WithId
  [AppErrorCode.INVITE_NOT_FOUND]: undefined
  [AppErrorCode.INVITE_EXPIRED]: undefined
  [AppErrorCode.INVITE_ALREADY_ACCEPTED]: undefined
  [AppErrorCode.DYNAMIC_COMPONENT_NAME_CONFLICT]: { name: string }
  [AppErrorCode.DYNAMIC_COMPONENT_URL_CONFLICT]: { url: string }
  [AppErrorCode.DYNAMIC_COMPONENT_NOT_FOUND]: WithId

  // post
  [AppErrorCode.POST_NOT_FOUND]: WithId
  [AppErrorCode.POST_UNPUBLISHED]: WithId
  [AppErrorCode.POST_HIDDEN_OR_ENCRYPTED]: undefined

  // webhook
  [AppErrorCode.WEBHOOK_EVENT_NOT_FOUND]: WithId
  [AppErrorCode.WEBHOOK_NOT_FOUND]: WithId
}
