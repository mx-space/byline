import { Flexbox } from '@lobehub/ui'
import {
  AuthLocaleSwitch,
  type AuthThemeMode,
  AuthThemeSwitch,
} from '@lobehub/ui/dashboard'

import { useI18n } from '~/i18n'
import { SUPPORTED_LOCALES } from '~/i18n/resources'
import type { Locale } from '~/i18n/types'
import { useThemeMode } from '~/theme'

const localeLabels = {
  'en-US': 'English',
  'zh-CN': '中文',
} satisfies Record<Locale, string>

function ThemeSwitch() {
  const { t } = useI18n()
  const { setThemeMode, themeMode } = useThemeMode()
  const mode: AuthThemeMode =
    themeMode === 'light' || themeMode === 'dark' ? themeMode : 'auto'

  return (
    <AuthThemeSwitch
      value={mode}
      labels={{
        auto: t('shell.theme.system'),
        dark: t('shell.theme.dark'),
        light: t('shell.theme.light'),
      }}
      onChange={(value) => setThemeMode(value === 'auto' ? 'system' : value)}
    />
  )
}

function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n()

  return (
    <AuthLocaleSwitch
      aria-label={t('shell.locale.label')}
      options={SUPPORTED_LOCALES.map((value) => ({
        label: localeLabels[value],
        value,
      }))}
      value={locale}
      onChange={(value) => {
        if ((SUPPORTED_LOCALES as readonly string[]).includes(value)) {
          setLocale(value as Locale)
        }
      }}
    />
  )
}

export function AuthTools() {
  return (
    <Flexbox horizontal align="center" gap={8}>
      <ThemeSwitch />
      <LocaleSwitch />
    </Flexbox>
  )
}
