import { describe, expect, it } from 'vitest'

import { CreateInsightsTaskSchema } from '~/modules/ai/ai-insights/ai-insights.schema'
import {
  CreateSummaryTaskSchema,
  CreateSummaryTranslationTaskSchema,
  CreateTranslationTaskSchema,
} from '~/modules/ai/ai-task/ai-task.dto'

const manyLangs = Array.from({ length: 9 }, (_, i) => `lang${i}`)

describe('CreateSummaryTaskSchema', () => {
  it('accepts any number of target languages', () => {
    const result = CreateSummaryTaskSchema.safeParse({
      refId: 'article-1',
      targetLanguages: manyLangs,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a blank or whitespace-only target language', () => {
    expect(
      CreateSummaryTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: [''],
      }).success,
    ).toBe(false)
    expect(
      CreateSummaryTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: ['   '],
      }).success,
    ).toBe(false)
  })
})

describe('CreateSummaryTranslationTaskSchema', () => {
  it('accepts a single non-blank target language', () => {
    expect(
      CreateSummaryTranslationTaskSchema.safeParse({
        refId: 'article-1',
        targetLang: 'en',
      }).success,
    ).toBe(true)
  })

  it('rejects a blank target language', () => {
    expect(
      CreateSummaryTranslationTaskSchema.safeParse({
        refId: 'article-1',
        targetLang: '   ',
      }).success,
    ).toBe(false)
  })
})

describe('CreateInsightsTaskSchema', () => {
  it('accepts any number of target languages', () => {
    expect(
      CreateInsightsTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: manyLangs,
      }).success,
    ).toBe(true)
  })

  it('rejects a blank or whitespace-only target language', () => {
    expect(
      CreateInsightsTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: [''],
      }).success,
    ).toBe(false)
  })
})

describe('CreateTranslationTaskSchema', () => {
  it('accepts any number of target languages', () => {
    const result = CreateTranslationTaskSchema.safeParse({
      refId: 'article-1',
      targetLanguages: manyLangs,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a blank or whitespace-only target language', () => {
    expect(
      CreateTranslationTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: [''],
      }).success,
    ).toBe(false)
    expect(
      CreateTranslationTaskSchema.safeParse({
        refId: 'article-1',
        targetLanguages: ['   '],
      }).success,
    ).toBe(false)
  })
})
