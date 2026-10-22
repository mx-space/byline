import type { AITask, AITaskLog } from '~/api/tasks'

export enum EventTypes {
  GATEWAY_CONNECT = 'gateway.connect',
  GATEWAY_DISCONNECT = 'gateway.disconnect',

  VISITOR_ONLINE = 'visitor.online',
  VISITOR_OFFLINE = 'visitor.offline',

  AUTH_FAILED = 'auth.failed',

  COMMENT_CREATE = 'comment.create',

  POST_CREATE = 'post.create',
  POST_UPDATE = 'post.update',
  POST_DELETE = 'post.delete',

  NOTE_CREATE = 'note.create',
  NOTE_UPDATE = 'note.update',
  NOTE_DELETE = 'note.delete',

  SAY_CREATE = 'say.create',
  SAY_DELETE = 'say.delete',
  SAY_UPDATE = 'say.update',

  LINK_APPLY = 'link.apply',

  CONTENT_REFRESH = 'content.refresh',

  IMAGE_REFRESH = 'image.refresh',
  IMAGE_FETCH = 'image.fetch',

  ADMIN_NOTIFICATION = 'admin.notification',

  // Unified Task Queue realtime fan-out. Hand-duplicated from
  // apps/core/src/constants/business-event.constant.ts — no monorepo import.
  TASK_UPDATE = 'task.update',

  // Draft head moved (revision created/updated). Hand-duplicated from
  // apps/core/src/constants/business-event.constant.ts — no monorepo import.
  DRAFT_UPDATE = 'draft.update',
}

/**
 * Frozen phase union for TASK_UPDATE — verbatim mirror of the server-side
 * TaskUpdatePhase declared in
 * apps/core/src/processors/task-queue/task-queue.types.ts. Keep in sync by
 * hand; there is intentionally no cross-package import.
 */
export type TaskUpdatePhase =
  | 'created'
  | 'started'
  | 'progress'
  | 'status'
  | 'log'
  | 'result'
  | 'stream'
  | 'deleted'

export interface TaskUpdateStreamFrame {
  lang?: string
  segmentId?: string
  chunk?: string
  partial?: unknown
  done?: boolean
}

interface TaskUpdatePayloadBase {
  id: string
  type: string
  scope: string
  groupId?: string
  log?: AITaskLog
  stream?: TaskUpdateStreamFrame
  result?: unknown
}

export type TaskUpdatePayload =
  | (TaskUpdatePayloadBase & {
      phase: 'created'
      // On 'created', patch is the FULL task snapshot.
      patch: AITask
    })
  | (TaskUpdatePayloadBase & {
      phase: Exclude<TaskUpdatePhase, 'created'>
      // On all other phases, patch is a partial diff (or omitted entirely).
      patch?: Partial<AITask>
    })

export type NotificationTypes = 'error' | 'info' | 'success' | 'warn'

/**
 * Payload of the DRAFT_UPDATE broadcast — verbatim mirror of the server-side
 * DraftUpdateEventPayload declared in
 * apps/core/src/modules/draft/draft.types.ts. Keep in sync by hand; there is
 * intentionally no cross-package import.
 *
 * It carries only identity and the new head: the editor already holds the
 * content, and comparing one revision id is enough to know whether its view
 * is stale. Never treat receipt as authoritative content — re-read the draft.
 */
export interface DraftUpdatePayload {
  /** The draft id used in the write page URL (`draftId` query param). */
  branchId: string
  documentId: string
  headRevisionId: string
  refId: null | string
  refType: 'note' | 'page' | 'post'
}
