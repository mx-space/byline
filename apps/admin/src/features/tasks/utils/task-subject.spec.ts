import { describe, expect, it } from 'vitest'

import type { AITask } from '~/api/tasks'
import { AITaskType } from '~/api/tasks'

import {
  isPublishTask,
  resolveTaskSubject,
  taskLanguages,
  taskSubjectRef,
} from './task-subject'

const publish = (over: Partial<Pick<AITask, 'payload' | 'result'>> = {}) =>
  ({
    payload: { refId: null, snapshot: { title: '晨报' }, ...over.payload },
    result: over.result,
    type: 'content:publish',
  }) as unknown as AITask

describe('taskSubjectRef', () => {
  it('reads the snapshot title and falls back to the committed article id for a first publish', () => {
    expect(isPublishTask(publish())).toBe(true)
    expect(taskSubjectRef(publish({ result: { articleId: 'p9' } }))).toEqual({
      postId: 'p9',
      titleHint: '晨报',
    })
  })

  it('prefers payload.refId and payload.title for AI tasks', () => {
    const task = {
      payload: { refId: 'p1', title: '  摘要  ' },
      type: AITaskType.Summary,
    } as unknown as AITask
    expect(isPublishTask(task)).toBe(false)
    expect(taskSubjectRef(task)).toEqual({ postId: 'p1', titleHint: '摘要' })
  })
})

describe('resolveTaskSubject', () => {
  it('uses the resolved post title with the slug as subline', () => {
    expect(
      resolveTaskSubject(
        { postId: 'p1', titleHint: 'old' },
        { id: 'p1', slug: 'hello', title: 'Hello' },
        'fallback',
      ),
    ).toEqual({
      postId: 'p1',
      subline: '/hello',
      title: 'Hello',
      titleIsId: false,
    })
  })

  it('falls back to the payload title, then the ref id, then the fallback', () => {
    expect(
      resolveTaskSubject({ postId: 'p1', titleHint: '草稿' }, null, 'x'),
    ).toMatchObject({
      subline: 'p1',
      title: '草稿',
    })
    expect(
      resolveTaskSubject({ postId: 'p1', titleHint: null }, null, 'x'),
    ).toMatchObject({
      title: 'p1',
      titleIsId: true,
    })
    expect(
      resolveTaskSubject({ postId: null, titleHint: null }, null, '3 篇文章'),
    ).toMatchObject({
      subline: null,
      title: '3 篇文章',
    })
  })
})

describe('taskLanguages', () => {
  it('joins target languages', () => {
    expect(taskLanguages({ payload: { targetLanguages: ['en', 'ja'] } })).toBe(
      'en, ja',
    )
    expect(taskLanguages({ payload: {} })).toBeNull()
  })
})
