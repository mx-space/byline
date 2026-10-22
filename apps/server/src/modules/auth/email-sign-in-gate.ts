export type CredentialSignInGate = {
  disablePasswordLogin: boolean
}

export function denyEmailSignIn(
  _email: string,
  gate: CredentialSignInGate,
): boolean {
  return gate.disablePasswordLogin
}

export function denyUsernameSignIn(
  _username: string,
  gate: CredentialSignInGate,
): boolean {
  return gate.disablePasswordLogin
}
