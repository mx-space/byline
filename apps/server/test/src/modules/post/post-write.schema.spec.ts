import {
  PostExtrasSchema,
  PostSourceLangSchema,
} from '~/modules/post/post-write.schema'

describe('public time validation', () => {
  it('normalizes timezone offsets and supports explicitly clearing a schedule', () => {
    expect(
      PostExtrasSchema.parse({ publicAt: '2030-01-01T20:00:00+08:00' })
        .publicAt,
    ).toEqual(new Date('2030-01-01T12:00:00Z'))
    expect(PostExtrasSchema.parse({ publicAt: null }).publicAt).toBeNull()
    expect(PostExtrasSchema.parse({}).publicAt).toBeUndefined()
    expect(
      PostExtrasSchema.safeParse({ publicAt: 'invalid-date' }).success,
    ).toBe(false)
    expect(PostExtrasSchema.safeParse({ publicAt: true }).success).toBe(false)
  })
})

describe('PostSourceLangSchema', () => {
  it('canonicalizes a source language while keeping its region', () => {
    expect(PostSourceLangSchema.parse('zh_tw')).toBe('zh-TW')
    expect(PostSourceLangSchema.parse('PT-br')).toBe('pt-BR')
    expect(PostSourceLangSchema.parse('en')).toBe('en')
  })

  it('treats an empty value as unset', () => {
    expect(PostSourceLangSchema.parse('')).toBeNull()
    expect(PostSourceLangSchema.parse(null)).toBeNull()
  })

  it('rejects values that are not language tags', () => {
    expect(() => PostSourceLangSchema.parse('english please')).toThrow()
  })
})
