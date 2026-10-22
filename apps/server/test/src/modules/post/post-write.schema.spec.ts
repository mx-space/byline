import { PostSourceLangSchema } from '~/modules/post/post-write.schema'

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
