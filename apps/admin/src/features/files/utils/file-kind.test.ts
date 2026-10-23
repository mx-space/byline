import { describe, expect, it } from 'vitest'

import { extensionOf, fileKindOf, mimeOf, pathOf } from './file-kind'

describe('file kind helpers', () => {
  it('classifies by mime first, then by extension', () => {
    expect(fileKindOf('cover.PNG')).toBe('image')
    expect(fileKindOf('blob', 'image/webp')).toBe('image')
    expect(fileKindOf('episode.mp3')).toBe('audio')
    expect(fileKindOf('clip.bin', 'video/mp4')).toBe('video')
    expect(fileKindOf('notes.pdf')).toBe('other')
  })

  it('derives a mime type when the API does not send one', () => {
    expect(mimeOf('photo.jpg')).toBe('image/jpeg')
    expect(mimeOf('song.mp3')).toBe('audio/mpeg')
    expect(mimeOf('paper.pdf')).toBe('application/pdf')
    expect(mimeOf('data.xyz')).toBeUndefined()
    expect(mimeOf('data.xyz', 'application/x-custom')).toBe(
      'application/x-custom',
    )
  })

  it('reads extensions and decoded url paths', () => {
    expect(extensionOf('archive.tar.GZ')).toBe('gz')
    expect(extensionOf('README')).toBeUndefined()
    expect(pathOf('https://cdn.example.com/objects/image/a%20b.png?x=1')).toBe(
      '/objects/image/a b.png',
    )
  })
})
