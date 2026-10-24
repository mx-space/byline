import { describe, expect, it } from 'vitest'

import {
  classifyInviteCode,
  confirmPasswordIssue,
  emailIssue,
} from './credentials'

describe('classifyInviteCode', () => {
  it('maps known invite failures and leaves other codes recoverable', () => {
    expect(classifyInviteCode('INVITE_EXPIRED')).toBe('expired')
    expect(classifyInviteCode('INVITE_ALREADY_ACCEPTED')).toBe('accepted')
    expect(classifyInviteCode('INVITE_NOT_FOUND')).toBe('notFound')
    expect(classifyInviteCode('')).toBe('unknown')
  })
})

describe('emailIssue', () => {
  it('requires a trimmed address with a domain', () => {
    expect(emailIssue('  ')).toBe('required')
    expect(emailIssue('editor')).toBe('invalid')
    expect(emailIssue('editor@example.com')).toBeNull()
  })
})

describe('confirmPasswordIssue', () => {
  it('reports a mismatch only after the password is long enough', () => {
    expect(confirmPasswordIssue('short', 'short')).toBeNull()
    expect(confirmPasswordIssue('long-enough', '')).toBeNull()
    expect(confirmPasswordIssue('long-enough', 'other-value')).toBe('mismatch')
    expect(confirmPasswordIssue('long-enough', 'long-enough')).toBeNull()
  })
})
