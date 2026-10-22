import { describe, expect, it } from 'vitest'

import { flattenOauthOptions } from './oauth'

describe('flattenOauthOptions', () => {
  it('reports a provider without public fields as not configured', () => {
    const flat = flattenOauthOptions({
      providers: [{ enabled: true, type: 'apple' }],
    })
    expect(flat.apple.configured).toBe(false)
    expect(flat.apple.enabled).toBe(true)
  })

  it('marks a provider configured when a public field is set', () => {
    const flat = flattenOauthOptions({
      public: { apple: { clientId: 'dev.example.web' } },
    })
    expect(flat.apple.configured).toBe(true)
    expect(flat.github.configured).toBe(false)
  })
})
