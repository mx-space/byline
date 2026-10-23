import { describe, expect, it } from 'vitest'

import { ApiRequestError } from '~/api/http'
import { translate } from '~/i18n/translate'

import { toProfileInput } from '../components/UserProfileForm'
import {
  buildInviteRequest,
  canEditSignInIdentity,
  getUserConflictField,
  getUserErrorMessage,
} from './users'

const form = {
  avatar: '',
  bio: ' Writer ',
  displayName: ' Ada ',
  email: 'ada@example.com',
  url: '',
  username: 'ada',
}

describe('sign-in identity editing', () => {
  it('allows the account holder and profile-only authors', () => {
    expect(canEditSignInIdentity({ id: '1', isProfileOnly: false }, '1')).toBe(
      true,
    )
    expect(canEditSignInIdentity({ id: '2', isProfileOnly: true }, '1')).toBe(
      true,
    )
  })

  it('locks other sign-in accounts', () => {
    expect(canEditSignInIdentity({ id: '2', isProfileOnly: false }, '1')).toBe(
      false,
    )
    expect(canEditSignInIdentity({ id: '2', isProfileOnly: false }, null)).toBe(
      false,
    )
  })

  it('omits email and username when the identity is locked', () => {
    expect(toProfileInput(form, { identityLocked: true })).toEqual({
      avatar: null,
      bio: 'Writer',
      displayName: 'Ada',
      url: null,
    })
    expect(toProfileInput(form)).toMatchObject({
      email: 'ada@example.com',
      username: 'ada',
    })
  })
})

describe('getUserErrorMessage', () => {
  it('maps USER_IDENTITY_LOCKED to a localized message', () => {
    const error = new ApiRequestError(
      'server text',
      'USER_IDENTITY_LOCKED',
      403,
    )
    expect(getUserErrorMessage(error, 'fallback')).toBe(
      translate('users.error.identityLocked'),
    )
  })

  it('names the taken field of a USER_CONFLICT', () => {
    const taken = (field: string) =>
      new ApiRequestError('server text', 'USER_CONFLICT', 409, { field })
    expect(getUserConflictField(taken('username'))).toBe('username')
    expect(getUserConflictField(taken('email'))).toBe('email')
    expect(getUserErrorMessage(taken('email'), 'fallback')).toBe(
      translate('users.error.emailTaken'),
    )
    const legacy = new ApiRequestError('server text', 'USER_CONFLICT', 409)
    expect(getUserConflictField(legacy)).toBeNull()
    expect(getUserErrorMessage(legacy, 'fallback')).toBe(
      translate('users.error.conflict'),
    )
  })

  it('keeps the server message for unmapped codes', () => {
    const error = new ApiRequestError('Invite expired', 'INVITE_EXPIRED', 410)
    expect(getUserErrorMessage(error, 'fallback')).toBe('Invite expired')
    expect(getUserErrorMessage(null, 'fallback')).toBe('fallback')
  })
})

describe('buildInviteRequest', () => {
  it('invites a linked author so accepting converts that author', () => {
    expect(
      buildInviteRequest({
        displayName: 'Ignored',
        email: ' a@b.test ',
        linkedAuthorId: '42',
      }),
    ).toEqual({ email: 'a@b.test', kind: 'existing', userId: '42' })
  })

  it('creates a new account when no author is linked', () => {
    expect(
      buildInviteRequest({
        displayName: ' Ada ',
        email: 'a@b.test',
        linkedAuthorId: '',
      }),
    ).toEqual({ displayName: 'Ada', email: 'a@b.test', kind: 'new' })
    expect(
      buildInviteRequest({
        displayName: ' ',
        email: 'a@b.test',
        linkedAuthorId: '',
      }),
    ).toEqual({ displayName: undefined, email: 'a@b.test', kind: 'new' })
  })
})
