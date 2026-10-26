import { describe, expect, it } from 'vitest'

import { buildOauthValidationReturnUrl, flattenOauthOptions } from './oauth'

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

it('returns OAuth verification to the current hash route without losing its query state', () => {
  const result = buildOauthValidationReturnUrl(
    'team-sso',
    'https://cms.example.test/admin/#/setting/account?tab=oauth',
  )
  expect(result).toBe(
    'https://cms.example.test/admin/#/setting/account?tab=oauth&validate=team-sso',
  )
})
