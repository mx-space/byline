import { describe, expect, it } from 'vitest'

import { formatAbsoluteTime, slugify } from './slug'

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('  Product Updates! ')).toBe('product-updates')
  })

  it('strips accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme')
  })

  it('returns an empty slug when nothing is latin', () => {
    expect(slugify('产品更新')).toBe('')
  })

  it('keeps digits and collapses separators', () => {
    expect(slugify('Release 2.0 -- notes')).toBe('release-2-0-notes')
  })
})

describe('formatAbsoluteTime', () => {
  it('falls back for missing or invalid values', () => {
    expect(formatAbsoluteTime(null, '--')).toBe('--')
    expect(formatAbsoluteTime('nope', '--')).toBe('--')
  })

  it('formats a date as YYYY-MM-DD HH:mm', () => {
    expect(formatAbsoluteTime('2026-01-02T03:04:00', '--')).toBe(
      '2026-01-02 03:04',
    )
  })
})
