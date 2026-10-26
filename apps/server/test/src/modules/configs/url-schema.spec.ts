import { describe, expect, it } from 'vitest'

import { UrlSchema } from '~/modules/configs/configs.schema'

const parsePermalink = (postPermalink: string) =>
  UrlSchema.safeParse({ postPermalink })

describe('UrlSchema.postPermalink', () => {
  it.each(['/{slug}', '/posts/{category}/{slug}', '/p/{id}'])(
    'accepts %s',
    (value) => {
      expect(parsePermalink(value).success).toBe(true)
    },
  )

  it.each([
    ['{slug}', 'a relative path'],
    ['/posts/{category}', 'no slug or id'],
    ['/{year}/{slug}', 'an unknown token'],
  ])('rejects %s (%s)', (value) => {
    expect(parsePermalink(value).success).toBe(false)
  })
})
