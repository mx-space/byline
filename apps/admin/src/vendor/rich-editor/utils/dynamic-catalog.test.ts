// @vitest-environment node

import { beforeEach, expect, it, vi } from 'vitest'

import { ApiRequestError } from '~/api/http'

import {
  isAllowedDynamicUrl,
  registerDynamicComponent,
} from './dynamic-catalog'

const registerDynamicComponentEntry = vi.fn()
vi.mock('~/constants/env', () => ({ API_URL: 'https://api.example' }))
vi.mock('~/api/dynamic-components', () => ({
  getDynamicComponents: vi.fn(),
  getDynamicComponentsUrl: () => 'https://api.example/dynamic-components',
  registerDynamicComponentEntry: (...args: unknown[]) =>
    registerDynamicComponentEntry(...args),
}))

const entry = {
  name: 'Counter',
  description: 'Counter',
  url: 'https://cdn.example/counter.js',
  initialHeight: 320,
  propsSchema: {},
}

beforeEach(() => vi.resetAllMocks())

it('registers through the server append endpoint and allows every catalog url it returns', async () => {
  const existing = {
    ...entry,
    name: 'Existing',
    url: 'https://cdn.example/existing.js',
  }
  registerDynamicComponentEntry.mockResolvedValue({
    version: 1,
    components: [existing, entry],
  })

  expect(isAllowedDynamicUrl(entry.url)).toBe(false)
  await registerDynamicComponent(entry)

  expect(registerDynamicComponentEntry).toHaveBeenCalledWith(entry)
  expect(isAllowedDynamicUrl(entry.url)).toBe(true)
  expect(isAllowedDynamicUrl(existing.url)).toBe(true)
})

it('propagates a failed registration without allowing the url', async () => {
  const rejected = { ...entry, url: 'https://cdn.example/rejected.js' }
  registerDynamicComponentEntry.mockRejectedValue(new Error('boom'))

  await expect(registerDynamicComponent(rejected)).rejects.toThrow('boom')
  expect(isAllowedDynamicUrl(rejected.url)).toBe(false)
})

it('retries with a numbered name when another url already uses the name', async () => {
  const revision = { ...entry, url: 'https://cdn.example/counter-v2.js' }
  registerDynamicComponentEntry
    .mockRejectedValueOnce(
      new ApiRequestError('Name taken', 'DYNAMIC_COMPONENT_NAME_CONFLICT', 409),
    )
    .mockResolvedValueOnce({
      version: 1,
      components: [entry, { ...revision, name: 'Counter 2' }],
    })

  const registered = await registerDynamicComponent(revision)

  expect(registered.name).toBe('Counter 2')
  expect(registerDynamicComponentEntry).toHaveBeenLastCalledWith({
    ...revision,
    name: 'Counter 2',
  })
  expect(isAllowedDynamicUrl(revision.url)).toBe(true)
})

it('allows same-origin object storage urls without a catalog entry', () => {
  expect(isAllowedDynamicUrl('https://api.example/objects/widget.js')).toBe(
    true,
  )
  expect(isAllowedDynamicUrl('https://evil.example/objects/widget.js')).toBe(
    false,
  )
})
