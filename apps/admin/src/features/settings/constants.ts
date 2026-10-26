import { Shield, User } from 'lucide-react'

import type { TranslationKey } from '~/i18n/types'
import { adminQueryKeys } from '~/query/keys'

import type {
  AIProviderType,
  OauthProviderField,
  OauthProviderType,
  SettingsGroupSummary,
} from './types/settings'

export const settingsQueryKey = adminQueryKeys.settings.root
export const accountQueryKey = adminQueryKeys.settings.accountRoot

export const aiProviderTypeOptions: Array<{
  labelKey: TranslationKey
  value: AIProviderType
}> = [
  { labelKey: 'settings.ai.providerType.lobehub', value: 'lobehub' },
  { labelKey: 'settings.ai.providerType.typesafe', value: 'typesafe' },
  {
    labelKey: 'settings.ai.providerType.openaiCompatible',
    value: 'openai-compatible',
  },
  { labelKey: 'settings.ai.providerType.googleVertex', value: 'google-vertex' },
  { labelKey: 'settings.ai.providerType.anthropic', value: 'anthropic' },
  { labelKey: 'settings.ai.providerType.generic', value: 'generic' },
]

export const accountGroups: SettingsGroupSummary[] = [
  { icon: User, key: 'user', type: 'user' },
  { icon: Shield, key: 'account', type: 'account' },
]

const clientCredentialFields: OauthProviderField[] = [
  {
    key: 'clientId',
    label: 'Client ID',
    placeholderKey: 'settings.oauth.clientIdPlaceholder',
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    placeholderKey: 'settings.oauth.clientSecretPlaceholder',
    secret: true,
  },
]

export const oauthProviders: Array<{
  fields: OauthProviderField[]
  label: string
  type: OauthProviderType
}> = [
  { fields: clientCredentialFields, label: 'GitHub', type: 'github' },
  { fields: clientCredentialFields, label: 'Google', type: 'google' },
  {
    fields: [
      {
        descriptionKey: 'settings.oauth.apple.servicesIdHelp',
        key: 'clientId',
        label: 'Services ID',
        placeholder: 'dev.example.web',
      },
      {
        descriptionKey: 'settings.oauth.apple.teamIdHelp',
        key: 'teamId',
        label: 'Team ID',
        placeholder: 'ABCDE12345',
      },
      {
        descriptionKey: 'settings.oauth.apple.keyIdHelp',
        key: 'keyId',
        label: 'Key ID',
        placeholder: 'ABC1234567',
      },
      {
        descriptionKey: 'settings.oauth.apple.privateKeyHelp',
        key: 'privateKey',
        label: 'Private Key (.p8)',
        multiline: true,
        placeholder: '-----BEGIN PRIVATE KEY-----',
        secret: true,
      },
      {
        descriptionKey: 'settings.oauth.apple.bundleIdHelp',
        key: 'appBundleIdentifier',
        label: 'App Bundle ID',
        optional: true,
        placeholder: 'dev.example.app',
      },
    ],
    label: 'Apple',
    type: 'apple',
  },
]
