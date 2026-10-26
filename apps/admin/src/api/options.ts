import { deleteJson, getJson, patchJson, putJson } from './http'

export interface SystemOptions {
  [key: string]: unknown
}

export interface UrlOptions {
  adminUrl: string
  postPermalink?: string
  serverUrl: string
  webUrl: string
  wsUrl: string
}

export interface EmailTemplateResponse {
  props: unknown
  template: string
}

export type ConfigFieldComponent =
  | 'action'
  | 'input'
  | 'number'
  | 'password'
  | 'select'
  | 'switch'
  | 'tags'
  | 'textarea'

export interface ConfigFieldUi {
  actionId?: string
  actionLabel?: string
  component: ConfigFieldComponent
  halfGrid?: boolean
  hidden?: boolean
  options?: Array<{ label: string; value: number | string }>
  placeholder?: string
  showWhen?: Record<
    string,
    boolean | number | string | Array<boolean | number | string>
  >
}

export interface ConfigFormField {
  description?: string
  fields?: ConfigFormField[]
  key: string
  required?: boolean
  subsection?: {
    description?: string
    title: string
  }
  title: string
  ui: ConfigFieldUi
}

export interface ConfigFormSection {
  description?: string
  fields: ConfigFormField[]
  hidden?: boolean
  key: string
  title: string
}

export interface ConfigFormGroup {
  description: string
  icon: string
  key: string
  sections: ConfigFormSection[]
  title: string
}

export interface ConfigFormSchema {
  defaults: Record<string, unknown>
  description?: string
  groups: ConfigFormGroup[]
  title: string
}

export function getAllOptions() {
  return getJson<SystemOptions>('/options')
}

export function getFormSchema() {
  return getJson<ConfigFormSchema>('/config/form-schema')
}

export function getOption<T = unknown>(key: string) {
  return getJson<T>(`/options/${key}`)
}

export function getUrlOptions() {
  return getJson<UrlOptions>('/options/url')
}

export function patchOption(key: string, data: unknown) {
  return patchJson<void, unknown>(`/options/${key}`, data)
}

export function getEmailTemplate(type: string) {
  return getJson<EmailTemplateResponse>('/options/email/template', { type })
}

export function updateEmailTemplate(type: string, source: string) {
  return putJson<void, { source: string }>(
    `/options/email/template?type=${encodeURIComponent(type)}`,
    {
      source,
    },
  )
}

export function deleteEmailTemplate(type: string) {
  return deleteJson<void>(
    `/options/email/template?type=${encodeURIComponent(type)}`,
  )
}
