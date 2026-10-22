import { describe, expect, it } from 'vitest'

import { languageFallbackChain } from '~/utils/lang.util'

describe('languageFallbackChain', () => {
  it.each([
    ['en-US', ['en-US', 'en']],
    ['en_us', ['en-US', 'en']],
    ['zh-HK', ['zh-HK', 'zh']],
    ['zh-Hant-TW', ['zh-Hant-TW', 'zh']],
    ['pt-BR', ['pt-BR', 'pt']],
    ['en', ['en']],
    ['ja', ['ja']],
  ])('serves %s from %j in order', (input, chain) => {
    expect(languageFallbackChain(input)).toEqual(chain)
  })

  it('never substitutes a sibling region', () => {
    const chain = languageFallbackChain('zh-HK')

    expect(chain).not.toContain('zh-TW')
    expect(chain).not.toContain('zh-CN')
  })

  it.each([undefined, null, '', '   '])('is empty for %j', (input) => {
    expect(languageFallbackChain(input)).toEqual([])
  })
})
