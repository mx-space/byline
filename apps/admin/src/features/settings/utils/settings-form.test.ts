import { describe, expect, it } from 'vitest'

import {
  countChanges,
  differsFromDefault,
  parseConfigValidationMessage,
} from './settings-form'

describe('countChanges', () => {
  it('counts changed leaves across nested sections', () => {
    const origin = {
      mailOptions: { enable: true, smtp: { host: 'a', port: 465 } },
      url: { webUrl: 'https://a.dev' },
    }
    const current = {
      mailOptions: { enable: false, smtp: { host: 'b', port: 465 } },
      url: { webUrl: 'https://a.dev' },
    }
    expect(countChanges(origin, current)).toBe(2)
  })

  it('treats arrays as one change and blank values as equal', () => {
    expect(countChanges({ langs: ['en'] }, { langs: ['en', 'ja'] })).toBe(1)
    expect(countChanges({ from: undefined }, { from: '' })).toBe(0)
    expect(countChanges({}, { secure: true })).toBe(1)
  })
})

describe('differsFromDefault', () => {
  it('only flags values that were set to something else', () => {
    expect(differsFromDefault(undefined, 10)).toBe(false)
    expect(differsFromDefault(10, 10)).toBe(false)
    expect(differsFromDefault(20, 10)).toBe(true)
    expect(differsFromDefault(false, undefined)).toBe(false)
    expect(differsFromDefault('https://cdn.dev', '')).toBe(false)
    expect(differsFromDefault(true, false)).toBe(true)
  })
})

describe('parseConfigValidationMessage', () => {
  it('splits path-scoped issues and keeps general ones', () => {
    expect(
      parseConfigValidationMessage(
        'smtp.port: Expected number; from: Invalid email; Provider missing',
      ),
    ).toEqual([
      { message: 'Expected number', path: 'smtp.port' },
      { message: 'Invalid email', path: 'from' },
      { message: 'Provider missing' },
    ])
  })
})
