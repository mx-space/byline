import { describe, expect, it } from 'vitest'

import type { PostModel } from '~/models/post'

import {
  emptyPostBylineState,
  postBylineFromModel,
  postBylineFromSpecific,
  postBylineToSpecific,
} from './post-byline-state'

describe('post byline state', () => {
  it('keeps the public time through loading, editing a draft and saving it', () => {
    const publicAt = '2030-01-01T12:00:00.000Z'
    const state = postBylineFromModel({ publicAt } as PostModel)
    expect(state.publicAt).toBe(publicAt)
    expect(postBylineToSpecific(state).publicAt).toBe(publicAt)
    expect(postBylineFromSpecific({}, state).publicAt).toBe(publicAt)
    const cleared = postBylineFromSpecific({ publicAt: null }, state)
    expect(cleared.publicAt).toBe('')
    expect(postBylineToSpecific(cleared).publicAt).toBeNull()
  })

  it('reads author profiles from a post in byline order', () => {
    const state = postBylineFromModel({
      authors: [
        { avatar: null, bio: null, displayName: 'B', id: '2', url: null },
        { avatar: null, bio: null, displayName: 'A', id: '1', url: null },
      ],
      image: 'https://cdn.example/cover.png',
      seo: { description: 'Desc', title: null },
      sourceLang: 'zh-TW',
    } as PostModel)

    expect(state).toEqual({
      publicAt: '',
      authors: ['2', '1'],
      image: 'https://cdn.example/cover.png',
      seoDescription: 'Desc',
      seoImage: '',
      seoTitle: '',
      sourceLang: 'zh-TW',
    })
  })

  it('keeps previous values for fields a draft does not carry', () => {
    const previous = {
      ...emptyPostBylineState,
      authors: ['1'],
      sourceLang: 'en',
    }
    expect(postBylineFromSpecific({ image: null }, previous)).toEqual({
      ...previous,
      image: '',
    })
    expect(
      postBylineFromSpecific({ authors: [{ id: '3' }, '3', '4'] }, previous)
        .authors,
    ).toEqual(['3', '4'])
  })

  it('omits empty authors and nulls empty optional fields', () => {
    expect(postBylineToSpecific(emptyPostBylineState)).toEqual({
      publicAt: null,
      image: null,
      seo: null,
      sourceLang: null,
    })
    expect(
      postBylineToSpecific({
        ...emptyPostBylineState,
        authors: ['1', '2'],
        seoTitle: ' Title ',
        sourceLang: 'pt-BR',
      }),
    ).toEqual({
      authors: ['1', '2'],
      publicAt: null,
      image: null,
      seo: { title: 'Title' },
      sourceLang: 'pt-BR',
    })
  })
})
