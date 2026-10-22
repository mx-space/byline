import type { CreateFirstUserData } from '~/api/system'

export function removeEmptyStrings(data: CreateFirstUserData) {
  const next: CreateFirstUserData = {
    mail: data.mail,
    password: data.password,
    username: data.username,
  }

  for (const key of ['avatar', 'bio', 'name', 'url'] as const) {
    if (data[key]) next[key] = data[key]
  }

  return next
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
