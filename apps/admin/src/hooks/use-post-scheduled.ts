import { useEffect, useState } from 'react'

import type { PostModel } from '~/models/post'

export function usePostScheduled(
  post: Pick<PostModel, 'isPublished' | 'publicAt'>,
) {
  const [now, setNow] = useState(Date.now)
  const { isPublished, publicAt } = post
  const publicTime = publicAt ? Date.parse(publicAt) : 0

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = () => {
      const current = Date.now()
      setNow(current)
      if (isPublished && publicTime > current) {
        timer = setTimeout(sync, Math.min(publicTime - current, 2_147_483_647))
      }
    }
    sync()
    return () => clearTimeout(timer)
  }, [isPublished, publicTime])

  return Boolean(isPublished && publicTime > now)
}
