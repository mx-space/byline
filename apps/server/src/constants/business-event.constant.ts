export enum BusinessEvents {
  GATEWAY_CONNECT = 'gateway.connect',
  GATEWAY_DISCONNECT = 'gateway.disconnect',

  AUTH_FAILED = 'auth.failed',

  POST_CREATE = 'post.create',
  POST_UPDATE = 'post.update',
  POST_UNPUBLISH = 'post.unpublish',
  POST_REPUBLISH = 'post.republish',
  POST_DELETE = 'post.delete',

  CATEGORY_CREATE = 'category.create',
  CATEGORY_UPDATE = 'category.update',
  CATEGORY_DELETE = 'category.delete',

  // AI Translation
  TRANSLATION_CREATE = 'translation.create',
  TRANSLATION_UPDATE = 'translation.update',
  TRANSLATION_DELETE = 'translation.delete',

  // AI Insights
  INSIGHTS_CREATE = 'insights.create',
  INSIGHTS_UPDATE = 'insights.update',
  INSIGHTS_DELETE = 'insights.delete',
  INSIGHTS_GENERATED = 'insights.generated',

  // AI Summary
  SUMMARY_GENERATED = 'summary.generated',

  // util
  CONTENT_REFRESH = 'content.refresh', // Content updated or reset; page needs reload

  // for admin
  IMAGE_REFRESH = 'image.refresh',
  IMAGE_FETCH = 'image.fetch',

  ADMIN_NOTIFICATION = 'admin.notification',

  // Draft revisions. Broadcast to admin so an editor holding a stale head can
  // tell that the same draft moved underneath it instead of discovering it on
  // the next save, when the change is already a conflict.
  DRAFT_UPDATE = 'draft.update',

  // AI Agent
  AI_AGENT_MESSAGE = 'ai_agent.message',
  AI_AGENT_TOOL_EVENT = 'ai_agent.tool_event',
  AI_AGENT_CONFIRM_REQUEST = 'ai_agent.confirm_request',
  AI_AGENT_CONFIRM_RESULT = 'ai_agent.confirm_result',
  AI_AGENT_SESSION_STATE = 'ai_agent.session_state',

  // Task Queue realtime fan-out (spec 2)
  TASK_UPDATE = 'task.update',
}
export enum EventScope {
  TO_VISITOR = 1 << 0,
  TO_ADMIN = 1 << 1,
  TO_SYSTEM = 1 << 2,
  TO_VISITOR_ADMIN = (1 << 0) | (1 << 1),
  TO_SYSTEM_VISITOR = (1 << 0) | (1 << 2),
  TO_SYSTEM_ADMIN = (1 << 1) | (1 << 2),
  ALL = (1 << 0) | (1 << 1) | (1 << 2),
}
