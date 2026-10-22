import { describe, expect, it } from 'vitest'

import { getLessThanNow } from '~/utils/time.util'

describe('getLessThanNow', () => {
  it('coerces an ISO string from draft JSON into a Date', () => {
    const result = getLessThanNow('2024-03-01T08:00:00.000Z')
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2024-03-01T08:00:00.000Z')
  })

  it('clamps a future date to now', () => {
    const before = Date.now()
    const result = getLessThanNow(new Date(before + 86_400_000))
    expect(result.getTime()).toBeGreaterThanOrEqual(before)
    expect(result.getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('falls back to now for missing or invalid input', () => {
    const before = Date.now()
    for (const input of [undefined, null, '', 'not a date']) {
      const result = getLessThanNow(input)
      expect(result.getTime()).toBeGreaterThanOrEqual(before)
    }
  })
})
