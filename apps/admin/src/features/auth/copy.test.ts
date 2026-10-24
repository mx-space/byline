import { describe, expect, it } from 'vitest'

import { authCopyCatalog } from './copy'

describe('auth copy', () => {
  it('keeps admin tone in both locales', () => {
    for (const [key, value] of Object.entries(authCopyCatalog)) {
      expect(value['zh-CN'], key).not.toMatch(/[你您！]/)
      expect(value['en-US'], key).not.toMatch(/\bPlease\b|!/)
    }
  })
})
