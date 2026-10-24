import { describe, expect, it } from 'vitest'

import type { AITask } from '~/api/tasks'
import { AITaskStatus, AITaskType } from '~/api/tasks'

import { retryConfirmKey } from './task-actions'
import { taskDestinations } from './task-destinations'

function makeTask(overrides: Partial<AITask> = {}): AITask {
  return {
    createdAt: 1_700_000_000_000,
    id: 'task-1',
    logs: [],
    payload: {},
    retryCount: 0,
    status: AITaskStatus.Failed,
    type: AITaskType.Summary,
    ...overrides,
  }
}

describe('retryConfirmKey', () => {
  it('warns that a translation retry overwrites unlocked translations', () => {
    expect(
      retryConfirmKey(
        makeTask({
          payload: { refId: 'post-1' },
          type: AITaskType.Translation,
        }),
      ),
    ).toBe('retryTranslation')
  })

  it('says locked translations are included when the original payload asked for that', () => {
    expect(
      retryConfirmKey(
        makeTask({
          payload: { regenerateLocked: true },
          type: AITaskType.TranslationAll,
        }),
      ),
    ).toBe('retryTranslationLocked')
  })

  it('limits a partial translation retry to languages that did not succeed', () => {
    expect(
      retryConfirmKey(
        makeTask({
          status: AITaskStatus.PartialFailed,
          type: AITaskType.Translation,
        }),
      ),
    ).toBe('retryPartialTranslation')
  })

  it('does not claim a translation overwrite for voice or summary tasks', () => {
    expect(retryConfirmKey(makeTask({ type: AITaskType.Tts }))).toBe('retryTts')
    expect(retryConfirmKey(makeTask({ type: AITaskType.Summary }))).toBe(
      'retryGeneric',
    )
    expect(
      retryConfirmKey(makeTask({ type: AITaskType.InsightsTranslation })),
    ).toBe('retryGeneric')
  })
})

describe('taskDestinations', () => {
  it('links a translation task to the post and the translation', () => {
    expect(
      taskDestinations(
        makeTask({
          payload: { refId: 'post/1' },
          type: AITaskType.Translation,
        }),
      ),
    ).toEqual({
      articleHref: '/posts/edit?id=post%2F1',
      artifactHref: '/ai/translation/post%2F1',
      artifactKey: 'openTranslation',
    })
  })

  it('links a batch translation to the translation list when there is no single post', () => {
    expect(
      taskDestinations(makeTask({ type: AITaskType.TranslationBatch })),
    ).toEqual({
      articleHref: null,
      artifactHref: '/ai/translation',
      artifactKey: 'openTranslation',
    })
  })
})
