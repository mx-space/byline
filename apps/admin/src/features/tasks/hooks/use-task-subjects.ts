import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import { ApiRequestError } from '~/api/http'
import { findInListCache } from '~/api/list-cache'
import { getPostById, getPosts } from '~/api/posts'
import type { AITask } from '~/api/tasks'
import { useI18n } from '~/i18n'
import type { PostModel } from '~/models/post'
import { adminQueryKeys } from '~/query/keys'

import { useTaskCopy } from '../copy'
import type { TaskSubject, TaskSubjectPost } from '../utils/task-subject'
import {
  isPublishTask,
  resolveTaskSubject,
  taskSubjectRef,
} from '../utils/task-subject'
import { getTaskSummary } from '../utils/tasks'

const RECENT_POSTS_SIZE = 100
const recentPostsKey = [...adminQueryKeys.posts.root, 'task-subjects'] as const
const postKey = (id: string) =>
  [...adminQueryKeys.posts.root, 'task-subject', id] as const

function toSubjectPost(post: PostModel): TaskSubjectPost {
  return { id: post.id, slug: post.slug, title: post.title }
}

/**
 * Resolves the post behind each task. One request for the 100 most recently
 * modified posts covers nearly every task; only ids outside it are fetched one
 * by one, cached per post, so a page of tasks never fans out per row.
 */
export function useTaskSubjects(tasks: AITask[]) {
  const { t } = useI18n()
  const copy = useTaskCopy()
  const queryClient = useQueryClient()

  const refs = useMemo(
    () => new Map(tasks.map((task) => [task.id, taskSubjectRef(task)])),
    [tasks],
  )
  const postIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ref of refs.values()) if (ref.postId) ids.add(ref.postId)
    return [...ids]
  }, [refs])

  const recentQuery = useQuery({
    enabled: postIds.length > 0,
    queryFn: async () => {
      const result = await getPosts({
        page: 1,
        size: RECENT_POSTS_SIZE,
        sort_by: 'modifiedAt',
        sort_order: 'desc',
      })
      return result.data.map(toSubjectPost)
    },
    queryKey: recentPostsKey,
    staleTime: 60_000,
  })

  const known = useMemo(() => {
    const map = new Map<string, TaskSubjectPost>()
    for (const post of recentQuery.data ?? []) map.set(post.id, post)
    return map
  }, [recentQuery.data])

  const recentSettled = recentQuery.isSuccess || recentQuery.isError
  const missing = recentSettled ? postIds.filter((id) => !known.has(id)) : []

  const singles = useQueries({
    queries: missing.map((id) => ({
      initialData: () => {
        const cached = findInListCache<PostModel>(
          queryClient,
          adminQueryKeys.posts.root,
          id,
        )
        return cached ? toSubjectPost(cached) : undefined
      },
      queryFn: async (): Promise<TaskSubjectPost | null> => {
        try {
          return toSubjectPost(await getPostById(id))
        } catch (error) {
          if (error instanceof ApiRequestError && error.status === 404)
            return null
          throw error
        }
      },
      queryKey: postKey(id),
      retry: false,
      staleTime: 5 * 60_000,
    })),
  })

  const resolved = new Map(known)
  singles.forEach((query, index) => {
    if (query.data) resolved.set(missing[index], query.data)
  })

  return (task: AITask): TaskSubject => {
    const ref = refs.get(task.id) ?? taskSubjectRef(task)
    const post = ref.postId ? resolved.get(ref.postId) : null
    const fallback = isPublishTask(task)
      ? copy('untitled')
      : getTaskSummary(task, t)
    return resolveTaskSubject(ref, post, fallback)
  }
}
