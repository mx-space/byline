import { describe, expect, it } from 'vitest'

import { mxsEnv, splitConnectionFlags } from '../src/commands/mxs'

describe('splitConnectionFlags', () => {
  it('takes byline connection flags out of the mxs arguments', () => {
    expect(
      splitConnectionFlags([
        'summary',
        'list',
        '--api-url',
        'https://cms.example.com/api/v3',
        '--token=abc',
        '--size',
        '2',
      ]),
    ).toEqual({
      flags: { 'api-url': 'https://cms.example.com/api/v3', token: 'abc' },
      rest: ['summary', 'list', '--size', '2'],
    })
  })

  it('rejects a flag without a value', () => {
    expect(() => splitConnectionFlags(['--api-key'])).toThrow('needs a value')
  })
})

describe('mxsEnv', () => {
  it('points mxs at Byline in its own config home', () => {
    const env = mxsEnv(
      { apiUrl: 'https://cms.example.com/api/v3', token: 'tok' },
      {
        PATH: '/bin',
        XDG_CONFIG_HOME: '/home/me/.config',
        MXS_PROFILE: 'default',
        MXS_API_KEY: 'mx-key',
      },
    )
    expect(env).toEqual({
      PATH: '/bin',
      XDG_CONFIG_HOME: '/home/me/.config/byline/mxs',
      MXS_NO_UPDATE_CHECK: '1',
      MXS_API_URL: 'https://cms.example.com/api/v3',
      MXS_TOKEN: 'tok',
    })
  })

  it('passes no credentials when none are needed', () => {
    const env = mxsEnv(null, { XDG_CONFIG_HOME: '/c' })
    expect(env.MXS_API_URL).toBeUndefined()
    expect(env.MXS_TOKEN).toBeUndefined()
  })
})
