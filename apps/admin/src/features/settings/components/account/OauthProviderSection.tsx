import {
  ActionIcon,
  createStaticStyles,
  Flexbox,
  Input,
  Switch,
  TextArea,
  toast,
} from '@lobehub/ui'
import { Copy } from 'lucide-react'

import { API_URL } from '~/constants/env'
import { useI18n } from '~/i18n'
import { Button } from '~/ui/site-button'
import { authClient } from '~/utils/authjs/auth'

import { settingsAccountCopy } from '../../copy'
import type {
  FlatOauthProvider,
  OauthProviderField,
  OauthProviderType,
} from '../../types/settings'
import { SecretInput, SettingRow, SettingsGroup } from '../SettingsPrimitives'
import { AppleIcon, GitHubIcon, GoogleIcon } from './OauthIcons'

export interface OauthDraft {
  enabled: boolean
  values: Record<string, string>
}

const styles = createStaticStyles(({ css, cssVar }) => ({
  callback: css`
    overflow: hidden;
    flex: 1;
    min-width: 0;

    font-family: ${cssVar.fontFamilyCode};
    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  callbackBox: css`
    padding-block: 4px;
    padding-inline: 12px 4px;
    border-radius: ${cssVar.borderRadius};
    background: ${cssVar.colorFillTertiary};
  `,
}))

const providerIcons = {
  apple: AppleIcon,
  github: GitHubIcon,
  google: GoogleIcon,
} satisfies Record<OauthProviderType, typeof GitHubIcon>

export function createOauthDraft(
  fields: OauthProviderField[],
  data: FlatOauthProvider,
): OauthDraft {
  return {
    enabled: data.enabled,
    values: Object.fromEntries(
      fields.map((field) => [
        field.key,
        field.secret ? '' : (data.public[field.key] ?? ''),
      ]),
    ),
  }
}

export function countOauthChanges(
  fields: OauthProviderField[],
  data: FlatOauthProvider,
  draft: OauthDraft,
) {
  let count = draft.enabled === data.enabled ? 0 : 1
  for (const field of fields) {
    const value = draft.values[field.key]?.trim() ?? ''
    if (
      field.secret ? value.length > 0 : value !== (data.public[field.key] ?? '')
    )
      count += 1
  }
  return count
}

export function OauthProviderSection(props: {
  data: FlatOauthProvider
  draft: OauthDraft
  errors: Record<string, string>
  fields: OauthProviderField[]
  label: string
  onChange: (draft: OauthDraft) => void
  type: OauthProviderType
}) {
  const { locale, t } = useI18n()
  const callbackUrl = `${API_URL}/auth/callback/${props.type}`
  const ProviderIcon = providerIcons[props.type]

  const setValue = (key: string, value: string) =>
    props.onChange({
      ...props.draft,
      values: { ...props.draft.values, [key]: value },
    })

  const validate = () => {
    const callback = new URL(location.href)
    callback.searchParams.set('validate', props.type)
    void authClient.linkSocial({
      callbackURL: callback.toString(),
      provider: props.type,
    })
  }

  return (
    <SettingsGroup
      extra={
        <Flexbox align="center" gap={12} horizontal>
          <Button onClick={validate} size="small">
            {settingsAccountCopy(locale, 'verify')}
          </Button>
          <Switch
            aria-label={settingsAccountCopy(locale, 'enableProvider', {
              name: props.label,
            })}
            checked={props.draft.enabled}
            onChange={(enabled) => props.onChange({ ...props.draft, enabled })}
          />
        </Flexbox>
      }
      title={
        <Flexbox align="center" as="span" gap={8} horizontal>
          <ProviderIcon aria-hidden="true" height={16} width={16} />
          {props.label}
        </Flexbox>
      }
    >
      {props.fields.map((field, index) => {
        const value = props.draft.values[field.key] ?? ''
        const placeholder = field.placeholderKey
          ? t(field.placeholderKey)
          : field.placeholder
        return (
          <SettingRow
            desc={field.descriptionKey ? t(field.descriptionKey) : undefined}
            divider={index > 0}
            error={props.errors[field.key]}
            key={field.key}
            label={field.label}
            required={!field.optional}
            wide={field.multiline}
          >
            {field.secret ? (
              <SecretInput
                aria-label={field.label}
                multiline={field.multiline}
                onChange={(next) => setValue(field.key, next)}
                placeholder={placeholder}
                stored={props.data.configured}
                value={value}
              />
            ) : field.multiline ? (
              <TextArea
                aria-label={field.label}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                value={value}
              />
            ) : (
              <Input
                aria-label={field.label}
                onChange={(event) => setValue(field.key, event.target.value)}
                placeholder={placeholder}
                value={value}
              />
            )}
          </SettingRow>
        )
      })}
      <SettingRow
        desc={
          props.type === 'apple'
            ? t('settings.oauth.apple.callbackHelp')
            : undefined
        }
        divider
        label={t('settings.oauth.callbackLabel')}
        wide
      >
        <Flexbox
          align="center"
          className={styles.callbackBox}
          gap={8}
          horizontal
        >
          <code className={styles.callback} title={callbackUrl}>
            {callbackUrl}
          </code>
          <ActionIcon
            icon={Copy}
            onClick={() => {
              void navigator.clipboard.writeText(callbackUrl)
              toast.success(t('settings.oauth.copySuccess'))
            }}
            size="small"
            title={t('settings.oauth.callbackCopyAria')}
          />
        </Flexbox>
      </SettingRow>
    </SettingsGroup>
  )
}
