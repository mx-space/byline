import { describe, expect, it } from 'vitest'

import type { AiOverviewListRow, ArticleCoverage } from '~/api/ai-overview'
import type { AITask } from '~/api/tasks'
import { AITaskStatus, AITaskType } from '~/api/tasks'

import {
  buildFillJobs,
  buildMatrixRows,
  countGaps,
  groupActiveTasks,
  hasGap,
  summarizeCapability,
} from './coverage'

const coverage = (
  overrides: Partial<ArticleCoverage> = {},
): ArticleCoverage => ({
  insights: { applicable: true, expected: [], langs: [] },
  sourceLang: 'zh',
  summary: { applicable: true, expected: ['zh'], langs: ['zh'] },
  translation: { applicable: true, expected: ['en', 'ja'], langs: ['en'] },
  tts: { applicable: true, expected: ['en', 'zh'], langs: ['zh'] },
  ...overrides,
})

const row = (id: string, cov: ArticleCoverage): AiOverviewListRow => ({
  article: { id, title: `Post ${id}`, type: 'Post' },
  coverage: cov,
  gapCount: 0,
})

const task = (overrides: Partial<AITask>): AITask => ({
  createdAt: Date.now(),
  id: 'task',
  logs: [],
  payload: {},
  retryCount: 0,
  status: AITaskStatus.Running,
  type: AITaskType.Translation,
  ...overrides,
})

describe('summarizeCapability', () => {
  it('lists every target locale and the ones a fill would generate', () => {
    const summary = summarizeCapability(coverage(), 'translation')
    expect(summary.langs).toEqual([
      { lang: 'en', state: 'done' },
      { lang: 'ja', state: 'gap' },
    ])
    expect(summary.fillable).toEqual(['ja'])
    expect(summary.state).toBe('gap')
  })

  it('never lists the source language as a translation target', () => {
    const summary = summarizeCapability(
      coverage({
        translation: { applicable: true, expected: ['zh', 'en'], langs: [] },
      }),
      'translation',
    )
    expect(summary.langs.map((cell) => cell.lang)).toEqual(['en'])
  })

  it('keeps a running task out of the fill list', () => {
    const active = groupActiveTasks([
      task({ payload: { refId: 'a', targetLanguages: ['ja'] } }),
    ]).get('a')
    const summary = summarizeCapability(coverage(), 'translation', active)
    expect(summary.state).toBe('pending')
    expect(summary.fillable).toEqual([])
  })

  it('reports nothing generated when the capability expects no language', () => {
    expect(summarizeCapability(coverage(), 'insights').state).toBe('none')
  })

  it('reports not applicable capabilities', () => {
    const summary = summarizeCapability(
      coverage({ summary: { applicable: false, expected: ['zh'], langs: [] } }),
      'summary',
    )
    expect(summary).toEqual({ fillable: [], langs: [], state: 'na' })
  })
})

describe('groupActiveTasks', () => {
  it('fans batch translations out to every post they cover', () => {
    const grouped = groupActiveTasks([
      task({
        payload: { refIds: ['a', 'b'], targetLanguages: ['en'] },
        type: AITaskType.TranslationBatch,
      }),
    ])
    expect(grouped.get('a')?.[0].capability).toBe('translation')
    expect(grouped.get('b')?.[0].langs).toEqual(['en'])
  })

  it('drops failures older than the retention window', () => {
    const now = Date.now()
    const grouped = groupActiveTasks(
      [
        task({
          completedAt: now - 11 * 60 * 1000,
          payload: { refId: 'a' },
          status: AITaskStatus.Failed,
        }),
      ],
      now,
    )
    expect(grouped.size).toBe(0)
  })

  it('ignores task types outside the four capabilities', () => {
    expect(
      groupActiveTasks([task({ type: AITaskType.TranslationAll })]).size,
    ).toBe(0)
  })
})

describe('countGaps and buildFillJobs', () => {
  const rows = buildMatrixRows(
    [
      row('a', coverage()),
      row('b', coverage()),
      row(
        'c',
        coverage({
          translation: {
            applicable: true,
            expected: ['en', 'ja'],
            langs: ['en', 'ja'],
          },
          tts: { applicable: true, expected: ['zh'], langs: ['zh'] },
        }),
      ),
    ],
    new Map(),
  )

  it('counts posts and items with gaps per capability', () => {
    const counts = countGaps(rows)
    expect(counts.posts).toBe(2)
    expect(counts.byCapability.translation).toEqual({ items: 2, posts: 2 })
    expect(counts.byCapability.summary).toEqual({ items: 0, posts: 0 })
    expect(hasGap(rows[2])).toBe(false)
  })

  it('batches translations that miss the same locales and keeps other jobs per post', () => {
    const jobs = buildFillJobs(rows, ['translation', 'tts'])
    expect(jobs).toEqual([
      { capability: 'translation', langs: ['ja'], refIds: ['a', 'b'] },
      { capability: 'tts', langs: ['en'], refIds: ['a'] },
      { capability: 'tts', langs: ['en'], refIds: ['b'] },
    ])
  })

  it('splits jobs that exceed the per-task language limit', () => {
    const many = Array.from({ length: 10 }, (_, index) => `l${index}`)
    const [wide] = buildMatrixRows(
      [
        row(
          'd',
          coverage({ tts: { applicable: true, expected: many, langs: [] } }),
        ),
      ],
      new Map(),
    )
    const jobs = buildFillJobs([wide], ['tts'])
    expect(jobs.map((job) => job.langs.length)).toEqual([8, 2])
  })
})
