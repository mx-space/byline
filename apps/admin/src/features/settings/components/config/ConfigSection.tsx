import type { ReactNode } from 'react'

import type { ConfigFormField, ConfigFormSection } from '~/api/options'
import { useI18n } from '~/i18n'
import { messages } from '~/i18n/resources'
import type { TranslationKey } from '~/i18n/types'

import { settingsFieldCopy, settingsSectionCopy } from '../../copy'
import { getPath, shouldShowField } from '../../utils/settings'
import { differsFromDefault } from '../../utils/settings-form'
import { hasPath, isSecretField } from '../../utils/settings-risk'
import { SettingRow, SettingsGroup } from '../SettingsPrimitives'
import { isWideConfigField, renderConfigControl } from './renderConfigControl'

export function ConfigSection(props: {
  defaults?: Record<string, unknown>
  errors: Record<string, string>
  extra?: ReactNode
  formData: Record<string, unknown>
  onAction: (actionId: string) => void
  section: ConfigFormSection
  updateValue: (path: string, value: unknown) => void
}) {
  const { locale, t } = useI18n()

  const schemaText = (path: string, kind: 'description' | 'title') => {
    const key = `settings.schema.${path}.${kind}` as TranslationKey
    return Object.hasOwn(messages[locale], key) ? t(key) : undefined
  }

  const localizeOptions = (path: string, field: ConfigFormField) =>
    field.ui.options?.map((option) => {
      const key =
        `settings.schema.${path}.option.${option.value}` as TranslationKey
      return Object.hasOwn(messages[locale], key)
        ? { ...option, label: t(key) }
        : option
    })

  const renderRow = (field: ConfigFormField, path: string, index: number) => {
    const value = getPath(props.formData, path)
    const defaultValue = getPath(props.defaults, path)
    const title = schemaText(path, 'title') ?? field.title
    const canReset =
      !isSecretField(field) &&
      field.ui.component !== 'action' &&
      hasPath(props.defaults, path) &&
      differsFromDefault(value, defaultValue)

    return (
      <SettingRow
        desc={
          settingsFieldCopy(locale, path) ??
          schemaText(path, 'description') ??
          field.description
        }
        divider={index > 0}
        error={props.errors[path]}
        key={path}
        label={title}
        onReset={
          canReset
            ? () => props.updateValue(path, structuredClone(defaultValue))
            : undefined
        }
        required={field.required}
        wide={isWideConfigField(field)}
        width={
          field.ui.component === 'switch' || field.ui.component === 'action'
            ? 'auto'
            : undefined
        }
      >
        {renderConfigControl({
          field: {
            ...field,
            title,
            ui: { ...field.ui, options: localizeOptions(path, field) },
          },
          onAction: props.onAction,
          onChange: (next) => props.updateValue(path, next),
          value,
        })}
      </SettingRow>
    )
  }

  const renderGroups = (
    prefix: string,
    title: ReactNode,
    desc: ReactNode,
    fields: ConfigFormField[],
    extra?: ReactNode,
  ): ReactNode[] => {
    const visible = fields
      .filter((field) => !field.ui.hidden)
      .filter((field) => shouldShowField(field, props.formData, prefix))
    const leaves = visible.filter((field) => !field.fields?.length)
    const nested = visible.filter((field) => field.fields?.length)

    const groups: ReactNode[] = []
    if (leaves.length > 0) {
      groups.push(
        <SettingsGroup desc={desc} extra={extra} key={prefix} title={title}>
          {leaves.map((field, index) =>
            renderRow(field, `${prefix}.${field.key}`, index),
          )}
        </SettingsGroup>,
      )
    }
    for (const field of nested) {
      const path = `${prefix}.${field.key}`
      groups.push(
        ...renderGroups(
          path,
          settingsSectionCopy(locale, path) ??
            schemaText(path, 'title') ??
            field.subsection?.title ??
            field.title,
          field.subsection?.description,
          field.fields ?? [],
        ),
      )
    }
    return groups
  }

  const { section } = props
  return (
    <>
      {renderGroups(
        section.key,
        settingsSectionCopy(locale, section.key) ??
          schemaText(section.key, 'title') ??
          section.title,
        schemaText(section.key, 'description') ?? section.description,
        section.fields,
        props.extra,
      )}
    </>
  )
}
