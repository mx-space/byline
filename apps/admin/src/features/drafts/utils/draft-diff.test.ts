import { describe, expect, it } from 'vitest'

import type { RevisionSnapshot } from '~/models/draft'

import { snapshotWordCount } from './draft-decision'
import { computeDiffStats } from './draft-diff'

const revision: RevisionSnapshot = {
  content:
    '{"root":{"children":[{"type":"paragraph","children":[{"type":"text","text":"Hello world"}]}]}}',
  contentFormat: 'lexical',
  images: null,
  meta: null,
  text: 'Hello world',
  title: 'Post',
  typeSpecificData: null,
}

describe('Lexical draft comparison', () => {
  it('compares the document even when its text projection is unchanged', () => {
    expect(
      computeDiffStats(revision, {
        ...revision,
        content:
          '{"root":{"children":[{"type":"image","src":"https://example.com/image.png"}]}}',
      }),
    ).toEqual({ delta: 0, isSame: false })
  })

  it('counts words in the text projection instead of the serialized document', () => {
    expect(snapshotWordCount(revision)).toBe(2)
  })
})
