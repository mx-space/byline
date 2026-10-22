import { AppErrorCode } from './app-error-code'
import type { AppErrorPayloadMap } from './app-error-payload'

type PayloadFor<C extends AppErrorCode> = AppErrorPayloadMap[C]
type PresentPayloadFor<C extends AppErrorCode> = Exclude<
  PayloadFor<C>,
  undefined
>

type AppErrorDefinition<C extends AppErrorCode> =
  undefined extends PayloadFor<C>
    ? {
        status: number
        message:
          string | ((payload: PresentPayloadFor<C> | undefined) => string)
        details?: (
          payload: PresentPayloadFor<C> | undefined,
        ) => Record<string, unknown> | undefined
      }
    : {
        status: number
        message: string | ((payload: PresentPayloadFor<C>) => string)
        details?: (
          payload: PresentPayloadFor<C>,
        ) => Record<string, unknown> | undefined
      }

const withExtra = (msg: string) => (payload: { extra?: string } | undefined) =>
  payload?.extra ? `${msg}: ${payload.extra}` : msg

export const APP_ERROR_DEFINITIONS = {
  // generic
  [AppErrorCode.INTERNAL_ERROR]: {
    status: 500,
    message: (p) => p?.message ?? 'Internal server error',
  },
  [AppErrorCode.NOT_FOUND]: {
    status: 404,
    message: (p) => p?.message ?? 'Not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.NO_CONTENT_MODIFIABLE]: {
    status: 400,
    message: 'No content to modify',
  },
  [AppErrorCode.DEMO_FORBIDDEN]: {
    status: 403,
    message: 'This operation is not allowed in demo mode',
  },
  [AppErrorCode.RESOURCE_NOT_FOUND]: {
    status: 404,
    message: 'Resource not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.CONTENT_NOT_FOUND]: {
    status: 404,
    message: 'Content not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.CONTENT_NOT_FOUND_CANT_PROCESS]: {
    status: 400,
    message: (p) => p?.message ?? 'Content not found, cannot process',
  },
  [AppErrorCode.MAX_COUNT_LIMIT]: { status: 400, message: 'Max count reached' },
  [AppErrorCode.MASTER_LOST]: {
    status: 500,
    message: 'Site owner information is missing',
  },
  [AppErrorCode.CANNOT_GET_IP]: { status: 422, message: 'Cannot resolve IP' },
  [AppErrorCode.ENTRY_NOT_FOUND]: {
    status: 404,
    message: 'Entry not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.REF_MODEL_NOT_FOUND]: {
    status: 404,
    message: withExtra('Referenced model not found'),
  },

  // validation
  [AppErrorCode.INVALID_PARAMETER]: {
    status: 400,
    message: ({ message }) => message ?? 'Invalid parameter',
  },
  [AppErrorCode.INVALID_BODY]: {
    status: 422,
    message: 'Request body must be an object',
  },
  [AppErrorCode.INVALID_SLUG]: {
    status: 422,
    message: 'slug must be a string',
  },
  [AppErrorCode.INVALID_NAME]: {
    status: 422,
    message: 'name must be a string',
  },
  [AppErrorCode.INVALID_REFERENCE]: {
    status: 422,
    message: 'reference must be a string',
  },
  [AppErrorCode.INVALID_ORDER_VALUE]: {
    status: 422,
    message: 'order value must be unique',
  },
  [AppErrorCode.INVALID_VIEW]: {
    status: 400,
    message: ({ view, available }) =>
      `Invalid view "${view}"; available: ${available.join(', ')}`,
    details: ({ view, available }) => ({ view, available }),
  },
  [AppErrorCode.SLUG_NOT_AVAILABLE]: {
    status: 400,
    message: 'slug is not available',
  },
  [AppErrorCode.VALIDATION_FAILED]: {
    status: 400,
    message: 'Validation failed',
    details: (p) => (p?.issues ? { issues: p.issues } : undefined),
  },

  // ai
  [AppErrorCode.AI_CONTENT_MISSING]: {
    status: 400,
    message: ({ message }) => message,
  },
  [AppErrorCode.AI_INVALID_PARAMETER]: {
    status: 400,
    message: ({ message }) => message,
  },
  [AppErrorCode.AI_INVALID_QUERY_TYPE]: {
    status: 400,
    message: 'Invalid query type',
  },
  [AppErrorCode.AI_NOT_ENABLED]: {
    status: 400,
    message: (p) => p?.message ?? 'AI feature is not enabled',
  },
  [AppErrorCode.AI_KEY_EXPIRED]: {
    status: 400,
    message: 'AI key has expired, please contact the administrator',
  },
  [AppErrorCode.AI_PROCESSING]: {
    status: 400,
    message: 'AI is processing this request, please try again later',
  },
  [AppErrorCode.AI_PROVIDER_DISABLED]: {
    status: 400,
    message: (p) =>
      p?.providerId
        ? `Provider ${p.providerId} is not enabled`
        : 'No enabled AI provider configured',
    details: (p) => (p?.providerId ? { providerId: p.providerId } : undefined),
  },
  [AppErrorCode.AI_PROVIDER_NOT_FOUND]: {
    status: 404,
    message: (p) =>
      p?.providerId
        ? `Provider ${p.providerId} not found`
        : 'Provider not found',
    details: (p) => (p?.providerId ? { providerId: p.providerId } : undefined),
  },
  [AppErrorCode.AI_REVIEW_NOT_ENABLED]: {
    status: 400,
    message: 'AI review is not enabled',
  },
  [AppErrorCode.AI_RESULT_PARSING_ERROR]: {
    status: 500,
    message: (p) => p?.message ?? 'Failed to parse AI result',
  },
  [AppErrorCode.AI_SERVICE_ERROR]: {
    status: 500,
    message: (p) => p?.message ?? 'AI service error',
  },
  [AppErrorCode.TASK_NOT_FOUND]: {
    status: 404,
    message: 'Task not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.TASK_ALREADY_COMPLETED]: {
    status: 400,
    message: 'Task is already completed and cannot be cancelled',
  },
  [AppErrorCode.TASK_CANNOT_RETRY]: {
    status: 400,
    message: (p) => p?.reason ?? 'Task cannot be retried',
  },
  [AppErrorCode.AI_TRANSLATION_NOT_FOUND]: {
    status: 404,
    message: 'Translation not found',
  },

  // image generation
  [AppErrorCode.IMAGE_GENERATION_DISABLED]: {
    status: 400,
    message: 'AI image generation is not enabled',
  },
  [AppErrorCode.IMAGE_PROVIDER_NOT_CONFIGURED]: {
    status: 400,
    message: 'Image generation provider is not configured',
  },
  [AppErrorCode.IMAGE_GENERATION_FAILED]: {
    status: 500,
    message: (p) => p?.message ?? 'Image generation failed',
  },

  // TTS
  [AppErrorCode.TTS_DISABLED]: {
    status: 403,
    message: 'AI narration is disabled',
  },
  [AppErrorCode.TTS_PROVIDER_NOT_CONFIGURED]: {
    status: 400,
    message: 'TTS provider is not configured',
  },
  [AppErrorCode.TTS_SOURCE_NOT_LEXICAL]: {
    status: 400,
    message: 'No requested language has narratable Lexical content',
    details: (p) => (p?.lang ? { lang: p.lang } : undefined),
  },
  [AppErrorCode.TTS_GENERATION_FAILED]: {
    status: 500,
    message: (p) => p?.message ?? 'Speech generation failed',
  },
  [AppErrorCode.TTS_BUDGET_EXCEEDED]: {
    status: 400,
    message: (p) =>
      `Planned narration of ${p.charCount} characters exceeds the ${p.limit} limit`,
    details: (p) => ({ charCount: p.charCount, limit: p.limit }),
  },

  // auth
  [AppErrorCode.AUTH_DEVICE_FLOW_PENDING]: {
    status: 202,
    message: 'Device flow pending',
  },
  [AppErrorCode.AUTH_INVALID_CREDENTIALS]: {
    status: 401,
    message: 'Invalid credentials',
  },
  [AppErrorCode.AUTH_NOT_LOGGED_IN]: { status: 401, message: 'Not logged in' },
  [AppErrorCode.AUTH_SESSION_EXPIRED]: {
    status: 401,
    message: 'Session expired',
  },
  [AppErrorCode.AUTH_TOKEN_NOT_FOUND]: {
    status: 404,
    message: 'Token not found',
  },
  [AppErrorCode.AUTH_CHALLENGE_MISSING]: {
    status: 400,
    message: 'Challenge not found',
  },
  [AppErrorCode.AUTH_CHALLENGE_EXPIRED]: {
    status: 400,
    message: 'Challenge has expired',
  },
  [AppErrorCode.AUTH_REGISTRATION_MISSING]: {
    status: 400,
    message: 'Registration record not found',
  },
  [AppErrorCode.AUTH_USERNAME_INCORRECT]: {
    status: 403,
    message: 'Incorrect username',
  },
  [AppErrorCode.AUTH_PASSWORD_INCORRECT]: {
    status: 403,
    message: 'Incorrect password',
  },
  [AppErrorCode.AUTH_SESSION_NOT_FOUND]: {
    status: 400,
    message: 'Session not found',
  },
  [AppErrorCode.AUTH_USER_ID_NOT_FOUND]: {
    status: 400,
    message: 'User id not found',
  },
  [AppErrorCode.AUTH_FAILED]: {
    status: 400,
    message: (p) =>
      p?.message
        ? `Authentication failed: ${p.message}`
        : 'Authentication failed',
  },
  [AppErrorCode.AUTH_TOKEN_INVALID]: { status: 401, message: 'Invalid token' },
  [AppErrorCode.PASSWORD_LOGIN_DISABLED]: {
    status: 400,
    message: 'Password login is disabled',
  },
  [AppErrorCode.PASSWORD_SAME_AS_OLD]: {
    status: 422,
    message: 'New password must be different from the old one',
  },

  // category
  [AppErrorCode.CATEGORY_NOT_FOUND]: {
    status: 404,
    message: 'Category not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.CATEGORY_HAS_POSTS]: {
    status: 400,
    message: 'Category still has posts, cannot delete',
  },

  // config
  [AppErrorCode.CONFIG_NOT_FOUND]: {
    status: 404,
    message: 'Config not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.CONFIG_VALIDATION_FAILED]: {
    status: 422,
    message: (p) => p?.message ?? 'Config validation failed',
  },

  // cron
  [AppErrorCode.CRON_NOT_FOUND]: {
    status: 404,
    message: withExtra('Cron task not found'),
  },

  // draft
  [AppErrorCode.DRAFT_NOT_FOUND]: {
    status: 404,
    message: 'Draft not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.CONTENT_REVISION_NOT_FOUND]: {
    status: 404,
    message: 'Content revision not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.DRAFT_SHARE_NOT_FOUND]: {
    status: 404,
    message: 'Share link not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.DRAFT_HEAD_CONFLICT]: {
    status: 409,
    message: 'The same draft was updated elsewhere',
    details: (p) => ({
      actualHeadRevisionId: p.actualHeadRevisionId,
      branchId: p.branchId,
      expectedHeadRevisionId: p.expectedHeadRevisionId,
    }),
  },
  [AppErrorCode.PUBLISHED_REVISION_CHANGED]: {
    status: 409,
    message: 'The online revision changed',
    details: (p) => ({
      actualPublishedRevisionId: p.actualPublishedRevisionId,
      documentId: p.documentId,
      expectedPublishedRevisionId: p.expectedPublishedRevisionId,
    }),
  },

  // document / helper
  [AppErrorCode.DOCUMENT_NOT_FOUND]: {
    status: 404,
    message: 'Document not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.HELPER_DOCUMENT_NOT_FOUND]: {
    status: 404,
    message: 'Document not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },

  // email
  [AppErrorCode.EMAIL_TEMPLATE_NOT_FOUND]: {
    status: 400,
    message: 'Email template not found',
  },

  // file
  [AppErrorCode.FILE_NOT_FOUND]: {
    status: 404,
    message: (p) => {
      if (p?.extra) return `File not found: ${p.extra}`
      if (p?.name) return `File not found: ${p.name}`
      return 'File not found'
    },
    details: (p) => (p?.name ? { name: p.name } : undefined),
  },
  [AppErrorCode.FILE_EXISTS]: { status: 400, message: 'File already exists' },
  [AppErrorCode.FILE_RENAME_FAILED]: {
    status: 400,
    message: 'File rename failed',
  },
  [AppErrorCode.FILE_TOO_LARGE]: {
    status: 413,
    message: 'File size exceeds the limit',
  },
  [AppErrorCode.FILE_STORAGE_NOT_CONFIGURED]: {
    status: 400,
    message: 'S3 image storage is not configured',
  },
  [AppErrorCode.FILE_REQUIRED]: {
    status: 400,
    message: 'A file must be uploaded in the "file" field',
  },
  [AppErrorCode.MIME_ZIP_REQUIRED]: {
    status: 422,
    message: (p) =>
      p?.got
        ? `File must be a zip archive, got: ${p.got}`
        : 'File must be a zip archive',
    details: (p) => (p?.got ? { got: p.got } : undefined),
  },

  // init
  [AppErrorCode.INIT_ALREADY_COMPLETED]: {
    status: 400,
    message: 'Initialization already completed, please log in to configure',
  },
  [AppErrorCode.INIT_FORBIDDEN]: {
    status: 403,
    message: 'Default settings are hidden after registration',
  },
  [AppErrorCode.INIT_INVALID_BODY]: {
    status: 422,
    message: 'Request body must be an object',
  },

  // note
  [AppErrorCode.NOTE_FORBIDDEN]: {
    status: 403,
    message: 'Please do not peek at private notes',
  },

  // user
  [AppErrorCode.USER_NOT_EXISTS]: {
    status: 400,
    message: 'No user exists yet',
  },
  [AppErrorCode.USER_ALREADY_EXISTS]: {
    status: 400,
    message: 'A user already exists',
  },
  [AppErrorCode.USER_NOT_FOUND]: {
    status: 404,
    message: 'User not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.USER_CONFLICT]: {
    status: 409,
    message: 'A user with this email or username already exists',
  },
  [AppErrorCode.INVITE_NOT_FOUND]: {
    status: 404,
    message: 'Invite not found',
  },
  [AppErrorCode.INVITE_EXPIRED]: {
    status: 410,
    message: 'Invite has expired',
  },
  [AppErrorCode.INVITE_ALREADY_ACCEPTED]: {
    status: 409,
    message: 'Invite has already been accepted',
  },
  [AppErrorCode.DYNAMIC_COMPONENT_NAME_CONFLICT]: {
    status: 409,
    message: 'Another dynamic component already uses this name',
    details: (p) => ({ name: p.name }),
  },

  // post
  [AppErrorCode.POST_NOT_FOUND]: {
    status: 404,
    message: 'Post not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.POST_UNPUBLISHED]: {
    status: 404,
    message: 'Post is not published',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.POST_HIDDEN_OR_ENCRYPTED]: {
    status: 403,
    message: 'Post is hidden or encrypted',
  },

  // webhook
  [AppErrorCode.WEBHOOK_EVENT_NOT_FOUND]: {
    status: 404,
    message: 'Webhook event not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },
  [AppErrorCode.WEBHOOK_NOT_FOUND]: {
    status: 404,
    message: 'Webhook not found',
    details: (p) => (p?.id ? { id: p.id } : undefined),
  },

  // bing
} satisfies {
  [C in AppErrorCode]: AppErrorDefinition<C>
}
