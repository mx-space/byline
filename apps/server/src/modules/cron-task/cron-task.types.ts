export const CronTaskType = {
  ResetLikedOrReadArticleRecord: 'cron:reset-liked-or-read',
  CleanTempDirectory: 'cron:clean-temp-directory',
  DeleteExpiredJWT: 'cron:delete-expired-jwt',
} as const

export type CronTaskTypeValue = (typeof CronTaskType)[keyof typeof CronTaskType]

export interface CronTaskMeta {
  type: CronTaskTypeValue
  name: string
  description: string
  cronExpression: string
  methodName: string
}

export const CronTaskMetas: Record<
  CronTaskTypeValue,
  Omit<CronTaskMeta, 'type'>
> = {
  [CronTaskType.ResetLikedOrReadArticleRecord]: {
    name: 'resetLikedOrReadArticleRecord',
    description: 'Clean up like counts',
    cronExpression: 'EVERY_DAY_AT_MIDNIGHT',
    methodName: 'resetLikedOrReadArticleRecord',
  },
  [CronTaskType.CleanTempDirectory]: {
    name: 'cleanTempDirectory',
    description: 'Clean up temporary files',
    cronExpression: 'EVERY_DAY_AT_3AM',
    methodName: 'cleanTempDirectory',
  },
  [CronTaskType.DeleteExpiredJWT]: {
    name: 'deleteExpiredJWT',
    description: 'Delete expired JWTs',
    cronExpression: 'EVERY_DAY_AT_1AM',
    methodName: 'deleteExpiredJWT',
  },
}

export interface CronTaskDefinition {
  type: CronTaskTypeValue
  name: string
  description: string
  cronExpression: string
  lastDate?: string | null
  nextDate?: string | null
}

export interface CronTaskResult {
  [key: string]: unknown
}
