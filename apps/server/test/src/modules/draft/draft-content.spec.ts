import { describe, expect, it } from 'vitest'

import {
  canonicalSnapshot,
  sameRevisionContent,
} from '~/modules/draft/draft-content'

describe('canonicalSnapshot', () => {
  it('keeps post tags in the author-given order', () => {
    const snapshot = canonicalSnapshot('post', {
      title: 'Ollama WebUI',
      typeSpecificData: { tags: ['WebUI', 'Free', 'Open Source'] },
    })
    expect(snapshot.typeSpecificData?.tags).toEqual([
      'WebUI',
      'Free',
      'Open Source',
    ])
  })

  it('treats a tag reorder as a content change', () => {
    const left = canonicalSnapshot('post', {
      title: 'Post',
      typeSpecificData: { tags: ['b', 'a'] },
    })
    const right = canonicalSnapshot('post', {
      title: 'Post',
      typeSpecificData: { tags: ['a', 'b'] },
    })
    expect(sameRevisionContent(left, right)).toBe(false)
  })
})
