import { describe, expect, it } from 'vitest'

import {
  deliveryDuration,
  describeDelivery,
  formatDuration,
  generateSecret,
  groupEvents,
  splitEndpoint,
} from './webhooks'

describe('splitEndpoint', () => {
  it('splits host and path', () => {
    expect(splitEndpoint('https://example.com/hooks/byline?x=1')).toEqual({
      host: 'example.com',
      path: '/hooks/byline?x=1',
    })
  })

  it('keeps an unparsable value as the host', () => {
    expect(splitEndpoint('not a url')).toEqual({ host: 'not a url', path: '' })
  })
})

describe('groupEvents', () => {
  it('groups by the prefix before the first dot, keeping order', () => {
    expect(
      groupEvents([
        'post.create',
        'category.create',
        'post.update',
        'auth.failed',
      ]),
    ).toEqual([
      { events: ['post.create', 'post.update'], key: 'post' },
      { events: ['category.create'], key: 'category' },
      { events: ['auth.failed'], key: 'auth' },
    ])
  })
})

describe('deliveryDuration', () => {
  it('measures from the record stamp to the response stamp', () => {
    const started = Date.parse('2026-10-01T00:00:00.000Z')
    expect(
      deliveryDuration({
        response: { timestamp: started + 420 },
        timestamp: '2026-10-01T00:00:00.000Z',
      }),
    ).toBe(420)
  })

  it('returns null without a response stamp', () => {
    expect(
      deliveryDuration({
        response: null,
        timestamp: '2026-10-01T00:00:00.000Z',
      }),
    ).toBeNull()
  })
})

describe('formatDuration', () => {
  it('uses ms below a second and seconds above', () => {
    expect(formatDuration(87)).toBe('87 ms')
    expect(formatDuration(1530)).toBe('1.53 s')
    expect(formatDuration(12_340)).toBe('12.3 s')
  })
})

describe('describeDelivery', () => {
  it('reports success', () => {
    expect(
      describeDelivery({ response: {}, status: 200, success: true }),
    ).toEqual({
      type: 'success',
    })
  })

  it('reports a blocked address', () => {
    expect(
      describeDelivery({
        response: { error: 'SSRF_BLOCKED', message: 'private ip' },
        status: 0,
        success: false,
      }),
    ).toEqual({ message: 'private ip', type: 'ssrf' })
  })

  it('reports an HTTP failure', () => {
    expect(
      describeDelivery({
        response: { data: 'nope' },
        status: 500,
        success: false,
      }),
    ).toEqual({ detail: 'nope', status: 500, type: 'http' })
  })
})

describe('generateSecret', () => {
  it('returns 48 hex chars', () => {
    expect(generateSecret()).toMatch(/^[0-9a-f]{48}$/)
  })
})
