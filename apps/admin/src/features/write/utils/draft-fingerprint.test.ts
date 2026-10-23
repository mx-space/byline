import { describe, expect, it } from 'vitest'

import type { DraftWriteData } from '~/api/drafts'

import { draftFingerprint } from './draft-fingerprint'

const base = (content: string): DraftWriteData => ({
  content,
  contentFormat: 'lexical',
  meta: undefined,
  text: 'hello',
  title: 'Title',
  typeSpecificData: { pin: false, slug: 'post', tags: ['b', 'a'] },
})

describe('draftFingerprint', () => {
  it('ignores the key order of the lexical content', () => {
    const stored =
      '{"root":{"children":[{"type":"image","version":1,"src":"a.png","$":{"blockId":"x"}}],"type":"root"}}'
    const exported =
      '{"root":{"type":"root","children":[{"type":"image","version":1,"$":{"blockId":"x"},"src":"a.png"}]}}'

    expect(draftFingerprint(base(exported))).toBe(
      draftFingerprint(base(stored)),
    )
  })

  it('changes when the content changes', () => {
    const before = '{"root":{"children":[{"type":"text","text":"a"}]}}'
    const after = '{"root":{"children":[{"type":"text","text":"b"}]}}'

    expect(draftFingerprint(base(after))).not.toBe(
      draftFingerprint(base(before)),
    )
  })

  it('compares content that is not JSON as text', () => {
    expect(draftFingerprint(base('# a'))).toBe(draftFingerprint(base('# a')))
    expect(draftFingerprint(base('# a'))).not.toBe(
      draftFingerprint(base('# b')),
    )
  })

  it('ignores tag order and treats a missing pin as false', () => {
    const a = base('{}')
    const b = {
      ...base('{}'),
      typeSpecificData: { slug: 'post', tags: ['a', 'b'] },
    }

    expect(draftFingerprint(b)).toBe(draftFingerprint(a))
  })
})
