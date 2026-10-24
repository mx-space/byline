import { getJson } from '~/api/http'
import type { PaginateResult } from '~/models/base'
import type { PostModel } from '~/models/post'

export function getPostsByAuthor(authorId: string) {
  return getJson<PaginateResult<PostModel>>('/posts', {
    authorId,
    page: 1,
    size: 20,
  })
}
