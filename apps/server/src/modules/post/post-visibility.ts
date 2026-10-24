import { and, eq, isNull, lte, or, sql } from 'drizzle-orm'

import { posts } from '~/database/schema'

export function isPostPublic(post: {
  isPublished?: boolean
  publicAt?: Date | string | null
}) {
  return (
    post.isPublished !== false &&
    (!post.publicAt || new Date(post.publicAt).getTime() <= Date.now())
  )
}

export const publicPostCondition = () =>
  and(
    eq(posts.isPublished, true),
    or(isNull(posts.publicAt), lte(posts.publicAt, sql`now()`)),
  )!
