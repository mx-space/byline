import { describe, expect, it } from 'vitest'

import {
  type CredentialSignInGate,
  denyEmailSignIn,
  denyUsernameSignIn,
} from '~/modules/auth/email-sign-in-gate'

const open: CredentialSignInGate = { disablePasswordLogin: false }
const closed: CredentialSignInGate = { disablePasswordLogin: true }

describe('denyEmailSignIn', () => {
  it('denies every email when password login is disabled', () => {
    expect(denyEmailSignIn('owner@example.com', closed)).toBe(true)
  })

  it('allows every email when password login is enabled', () => {
    expect(denyEmailSignIn('owner@example.com', open)).toBe(false)
  })
})

describe('denyUsernameSignIn', () => {
  it('denies every username when password login is disabled', () => {
    expect(denyUsernameSignIn('owner', closed)).toBe(true)
  })

  it('allows every username when password login is enabled', () => {
    expect(denyUsernameSignIn('owner', open)).toBe(false)
  })
})
