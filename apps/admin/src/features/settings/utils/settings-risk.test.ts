import { describe, expect, it } from 'vitest'

import type { ConfigFormField } from '~/api/options'

import { hasPath, isSecretField } from './settings-risk'

function field(
  key: string,
  component: ConfigFormField['ui']['component'],
): ConfigFormField {
  return { key, title: key, ui: { component } }
}

describe('isSecretField', () => {
  it('treats password fields and key-like names as secrets', () => {
    expect(isSecretField(field('pass', 'password'))).toBe(true)
    expect(isSecretField(field('apiKey', 'input'))).toBe(true)
    expect(isSecretField(field('secretKey', 'input'))).toBe(true)
  })

  it('keeps public identifiers visible', () => {
    expect(isSecretField(field('webUrl', 'input'))).toBe(false)
    expect(isSecretField(field('secretId', 'input'))).toBe(false)
  })
})

describe('hasPath', () => {
  it('walks nested objects', () => {
    expect(hasPath({ smtp: { port: 465 } }, 'smtp.port')).toBe(true)
    expect(hasPath({ smtp: {} }, 'smtp.port')).toBe(false)
  })
})
