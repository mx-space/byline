import { describe, expect, it } from 'vitest'

import { seoFromFields, seoToFields } from './translation-seo'

describe('translation seo fields', () => {
  it('round-trips a stored seo object', () => {
    const seo = {
      description: 'Beschreibung',
      image: 'https://example.com/de.png',
      title: 'Titel',
    }
    expect(seoFromFields(seoToFields(seo))).toEqual(seo)
  })

  it('reads a missing seo as empty fields', () => {
    expect(seoToFields(null)).toEqual({
      seoDescription: '',
      seoImage: '',
      seoTitle: '',
    })
  })

  it('drops blank fields and trims the rest', () => {
    expect(
      seoFromFields({
        seoDescription: '   ',
        seoImage: '',
        seoTitle: '  Titre  ',
      }),
    ).toEqual({ title: 'Titre' })
  })

  it('clears seo when every field is blank', () => {
    expect(
      seoFromFields({ seoDescription: '', seoImage: ' ', seoTitle: '' }),
    ).toBeNull()
  })
})
