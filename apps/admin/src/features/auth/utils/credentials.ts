export type InviteLinkState = 'accepted' | 'expired' | 'notFound' | 'unknown'

export function classifyInviteCode(code: string): InviteLinkState {
  if (code === 'INVITE_ALREADY_ACCEPTED') return 'accepted'
  if (code === 'INVITE_EXPIRED') return 'expired'
  if (code === 'INVITE_NOT_FOUND') return 'notFound'
  return 'unknown'
}

export function emailIssue(value: string): 'invalid' | 'required' | null {
  const email = value.trim()
  if (!email) return 'required'
  const at = email.indexOf('@')
  const dot = email.lastIndexOf('.')
  if (
    at <= 0 ||
    email.includes('@', at + 1) ||
    dot < at + 2 ||
    dot === email.length - 1 ||
    email.includes(' ')
  ) {
    return 'invalid'
  }
  return null
}

export function confirmPasswordIssue(
  password: string,
  confirm: string,
): 'mismatch' | null {
  if (password.length < 8 || !confirm) return null
  if (password !== confirm) return 'mismatch'
  return null
}
