import { useI18n } from '~/i18n'

import { authCopy, type AuthCopyKey } from './copy'

export function useAuthCopy() {
  const { locale } = useI18n()
  return (key: AuthCopyKey, values?: Record<string, number | string>) =>
    authCopy(locale, key, values)
}
