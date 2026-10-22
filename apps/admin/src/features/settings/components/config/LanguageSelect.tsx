import { useMemo } from 'react'

import { useI18n } from '~/i18n'
import { buildLanguageOptions } from '~/lib/languages'
import { SelectField } from '~/ui/primitives/select'

export function LanguageSelect(props: {
  'aria-label'?: string
  onChange: (value: string) => void
  value: string
}) {
  const { locale } = useI18n()
  const options = useMemo(
    () => buildLanguageOptions(locale, [props.value]),
    [locale, props.value],
  )
  return (
    <SelectField
      aria-label={props['aria-label']}
      onValueChange={props.onChange}
      options={options}
      value={props.value}
    />
  )
}
