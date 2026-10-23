import { describe, expect, it } from 'vitest'

import { parseComponentMap } from '../src'
import type { ExecuteResult } from '../src/importer/execute'
import type { PlannedPost } from '../src/importer/plan'
import { summarize } from '../src/importer/report'

describe('summarize', () => {
  it('names the target of every mapping kind', () => {
    const map = parseComponentMap({
      components: {
        Card: { markdown: '[{title}]({href})' },
        Steps: { node: 'steps', children: { sections: 'steps', heading: 3 } },
      },
    })
    const plan = [
      {
        sourceLocale: 'en',
        document: { components: { Card: 2, Steps: 1 } },
        translations: [],
        issues: [],
      },
    ] as unknown as PlannedPost[]
    const result = {
      outcomes: [],
      authors: [],
      categories: [],
    } as unknown as ExecuteResult

    const summary = summarize(plan, result, map, true)

    expect(summary.components).toEqual({
      Card: { count: 2, target: 'markdown template' },
      Steps: { count: 1, target: 'steps' },
    })
  })
})
