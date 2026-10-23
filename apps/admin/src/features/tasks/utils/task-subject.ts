import type { AITask } from '~/api/tasks'

import { CONTENT_PUBLISH_TASK_TYPE } from '../constants'

export interface TaskSubjectPost {
  id: string
  slug?: string | null
  title?: string | null
}

export interface TaskSubjectRef {
  postId: string | null
  titleHint: string | null
}

export interface TaskSubject {
  postId: string | null
  subline: string | null
  title: string
  titleIsId: boolean
}

function readText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function isPublishTask(task: Pick<AITask, 'type'>) {
  return (task.type as string) === CONTENT_PUBLISH_TASK_TYPE
}

export function taskSubjectRef(
  task: Pick<AITask, 'payload' | 'result' | 'type'>,
): TaskSubjectRef {
  const payload = task.payload ?? {}
  const result =
    task.result && typeof task.result === 'object'
      ? (task.result as Record<string, unknown>)
      : null
  const postId =
    readText(payload.refId) ??
    (isPublishTask(task) ? readText(result?.articleId) : null)
  const snapshot =
    payload.snapshot && typeof payload.snapshot === 'object'
      ? (payload.snapshot as Record<string, unknown>)
      : null
  return {
    postId,
    titleHint: readText(snapshot?.title) ?? readText(payload.title),
  }
}

export function resolveTaskSubject(
  ref: TaskSubjectRef,
  post: TaskSubjectPost | null | undefined,
  fallback: string,
): TaskSubject {
  const postTitle = readText(post?.title)
  const slug = readText(post?.slug)
  if (postTitle) {
    return {
      postId: ref.postId,
      subline: slug ? `/${slug}` : ref.postId,
      title: postTitle,
      titleIsId: false,
    }
  }
  if (ref.titleHint) {
    return {
      postId: ref.postId,
      subline: slug ? `/${slug}` : ref.postId,
      title: ref.titleHint,
      titleIsId: false,
    }
  }
  if (ref.postId) {
    return {
      postId: ref.postId,
      subline: null,
      title: ref.postId,
      titleIsId: true,
    }
  }
  return { postId: null, subline: null, title: fallback, titleIsId: false }
}

export function taskLanguages(task: Pick<AITask, 'payload'>) {
  const raw = task.payload?.targetLanguages ?? task.payload?.langs
  if (!Array.isArray(raw)) return null
  const langs = raw.filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
  return langs.length > 0 ? langs.join(', ') : null
}
