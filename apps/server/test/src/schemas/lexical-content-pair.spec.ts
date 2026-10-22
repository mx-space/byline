import { describe, expect, it } from 'vitest'

import { DraftRefType } from '~/modules/draft/draft.enum'
import {
  CreateDraftSchema,
  UpdateDraftSchema,
} from '~/modules/draft/draft.schema'
import { PostSchema } from '~/modules/post/post.schema'
import { ContentFormat } from '~/shared/types/content-format.type'

const lexicalContent = JSON.stringify({
  root: { children: [], type: 'root', version: 1 },
})

describe('lexical content/text pair validation', () => {
  it('accepts lexical create payloads with content and text', () => {
    expect(() =>
      PostSchema.parse({
        categoryId: '7000000000000000001',
        content: lexicalContent,
        contentFormat: ContentFormat.Lexical,
        text: '',
        title: 'Post',
        slug: 'post',
      }),
    ).not.toThrow()
  })

  it('rejects lexical create payloads without content', () => {
    expect(() =>
      PostSchema.parse({
        categoryId: '7000000000000000001',
        contentFormat: ContentFormat.Lexical,
        text: 'projection',
        title: 'Post',
        slug: 'post',
      }),
    ).toThrow(/content is required/)
  })

  it('applies the same lexical pair rule to draft create and update', () => {
    expect(() =>
      CreateDraftSchema.parse({
        data: {
          content: lexicalContent,
          contentFormat: ContentFormat.Lexical,
          text: '',
        },
        refType: DraftRefType.Post,
      }),
    ).not.toThrow()

    expect(() =>
      UpdateDraftSchema.parse({
        data: {
          contentFormat: ContentFormat.Lexical,
          text: 'projection',
        },
        expectedHeadRevisionId: '7000000000000000001',
      }),
    ).toThrow(/content is required/)
  })
})
