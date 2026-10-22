import type { MetaPresetField, MetaPresetScope } from '~/models/meta-preset'

import { getJson } from './http'

export interface MetaPresetQueryParams {
  enabledOnly?: boolean
  scope?: MetaPresetScope
}

export function getMetaPresets(params?: MetaPresetQueryParams) {
  return getJson<MetaPresetField[]>('/meta-presets', {
    enabledOnly: params?.enabledOnly,
    scope: params?.scope,
  })
}
