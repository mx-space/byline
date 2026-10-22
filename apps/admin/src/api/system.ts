import { API_URL } from '~/constants/env'
import type { AppInfo } from '~/models/system'

import { buildAdminRequestHeaders, getJson, patchJson, postJson } from './http'

export interface CreateFirstUserData {
  avatar?: string
  bio?: string
  mail: string
  name?: string
  password: string
  url?: string
  username: string
}

export async function checkInit() {
  try {
    const response = await fetch(`${API_URL}/init`, {
      credentials: 'include',
      headers: buildAdminRequestHeaders(),
    })

    if (response.status === 404 || response.status === 403) {
      return { isInit: true }
    }

    if (!response.ok)
      throw new Error(response.statusText || 'Init check failed')

    return (await response.json()) as { isInit: boolean }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Init check failed', { cause: error })
  }
}

export function getAppInfo() {
  return getJson<AppInfo>('/info')
}

export function patchInitConfig<TData>(key: string, data: TData) {
  return patchJson<void, TData>(`/init/configs/${key}`, data)
}

export function createFirstUser(data: CreateFirstUserData) {
  return postJson<void, CreateFirstUserData>('/init/user', data)
}
