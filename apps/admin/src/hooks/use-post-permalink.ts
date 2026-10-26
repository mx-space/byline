import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { getUrlOptions } from '~/api/options'
import { WEB_URL } from '~/constants/env'
import {
  DEFAULT_POST_PERMALINK,
  joinWebUrl,
  type PermalinkValues,
  renderPostPermalink,
} from '~/lib/permalink'
import type { PostModel } from '~/models/post'
import { adminQueryKeys } from '~/query/keys'

export function usePostPermalink() {
  const { data } = useQuery({
    queryFn: getUrlOptions,
    queryKey: adminQueryKeys.settings.url(),
    staleTime: Infinity,
  })
  const webUrl = data?.webUrl || WEB_URL
  const template = data?.postPermalink || DEFAULT_POST_PERMALINK

  const displayPath = useCallback(
    (values: PermalinkValues) =>
      renderPostPermalink(template, values, { encode: false }),
    [template],
  )
  const url = useCallback(
    (values: PermalinkValues) =>
      joinWebUrl(webUrl, renderPostPermalink(template, values)),
    [template, webUrl],
  )

  const postUrl = useCallback(
    (post: Pick<PostModel, 'category' | 'id' | 'slug'>) =>
      url({ category: post.category?.slug, id: post.id, slug: post.slug }),
    [url],
  )

  return { displayPath, postUrl, url }
}
