import { isPostPublic } from '../post/post-visibility'

export interface PublishOrderArticle {
  id: string
  title: string
  isPublished?: boolean
  publicAt?: Date | string | null
  createdAt?: Date | string | null
  draftId?: string
}

function timestamp(value: Date | string | null | undefined) {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

/**
 * Posts that are not public yet stay above published ones. A public post
 * is ordered by its public time, or by creation when that time was never set.
 */
export function compareArticlesByPublishTime(
  left: PublishOrderArticle,
  right: PublishOrderArticle,
) {
  const leftPublic = isPostPublic(left)
  const rightPublic = isPostPublic(right)
  if (leftPublic !== rightPublic) return leftPublic ? 1 : -1
  const leftTime = leftPublic
    ? timestamp(left.publicAt) || timestamp(left.createdAt)
    : timestamp(left.createdAt)
  const rightTime = rightPublic
    ? timestamp(right.publicAt) || timestamp(right.createdAt)
    : timestamp(right.createdAt)
  if (leftTime !== rightTime) return rightTime - leftTime
  return right.id.localeCompare(left.id)
}
