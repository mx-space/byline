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

export const systemGroupTranslationKeys: Record<
  string,
  { descriptionKey: TranslationKey; titleKey: TranslationKey }
> = {
  ai: {
    descriptionKey: 'settings.group.ai.description',
    titleKey: 'settings.group.ai.title',
  },
  notification: {
    descriptionKey: 'settings.group.notification.description',
    titleKey: 'settings.group.notification.title',
  },
  site: {
    descriptionKey: 'settings.group.site.description',
    titleKey: 'settings.group.site.title',
  },
  storage: {
    descriptionKey: 'settings.group.storage.description',
    titleKey: 'settings.group.storage.title',
  },
  system: {
    descriptionKey: 'settings.group.system.description',
    titleKey: 'settings.group.system.title',
  },
}

export const aiProviderTypeOptions: Array<{
  labelKey: TranslationKey
  value: AIProviderType
}> = [
  { labelKey: 'settings.ai.providerType.typesafe', value: 'typesafe' },
  {
    labelKey: 'settings.ai.providerType.openaiCompatible',
    value: 'openai-compatible',
  },
  { labelKey: 'settings.ai.providerType.googleVertex', value: 'google-vertex' },
  { labelKey: 'settings.ai.providerType.anthropic', value: 'anthropic' },
  { labelKey: 'settings.ai.providerType.generic', value: 'generic' },
]

type SocialOption =
  | { label: string; labelKey?: undefined; value: string }
  | { label?: undefined; labelKey: TranslationKey; value: string }

export const socialOptions: readonly SocialOption[] = [
  { label: 'GitHub', value: 'github' },
  { label: 'Weibo', value: 'weibo' },
  { labelKey: 'settings.social.netease', value: 'netease' },
  { labelKey: 'settings.social.bilibili', value: 'bilibili' },
] as const

export const staticGroupsBefore: SettingsGroupSummary[] = [
  {
    descriptionKey: 'settings.group.user.description',
    icon: User,
    key: 'user',
    titleKey: 'settings.group.user.title',
    type: 'user',
  },
]

export const staticGroupsAfter: SettingsGroupSummary[] = [
  {
    descriptionKey: 'settings.group.account.description',
    icon: Shield,
    key: 'account',
    titleKey: 'settings.group.account.title',
    type: 'account',
  },
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
