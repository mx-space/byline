import { describe, expect, it, vi } from 'vitest'

import { AssetUploader, findLocalAssets } from '../src/importer/assets'

describe('local asset detection', () => {
  it('uploads relative paths and keeps URLs and site-absolute paths', async () => {
    const state = {
      root: {
        type: 'root',
        children: [
          { type: 'image', src: './hero.png' },
          { type: 'image', src: '/api/dynamic-og/blog-hero?color=cyan' },
          { type: 'image', src: 'https://cdn.example.com/a.png' },
          { type: 'image', src: '//cdn.example.com/b.png' },
        ],
      },
    }
    expect(findLocalAssets(state as any).map((ref) => ref.value)).toEqual([
      './hero.png',
    ])

    const upload = vi.fn()
    const uploader = new AssetUploader({ files: { upload } } as any)
    await expect(
      uploader.resolveUrl('/images/cover.png', '/content/post'),
    ).resolves.toBe('/images/cover.png')
    expect(upload).not.toHaveBeenCalled()
  })

  it('resolves site-absolute paths against siteUrl', async () => {
    const upload = vi.fn()
    const uploader = new AssetUploader(
      { files: { upload } } as any,
      'https://lobehub.com',
    )
    await expect(
      uploader.resolveUrl('/api/dynamic-og/blog-hero?color=cyan', '/content'),
    ).resolves.toBe('https://lobehub.com/api/dynamic-og/blog-hero?color=cyan')
    const state = await uploader.rewrite(
      {
        root: {
          type: 'root',
          children: [{ type: 'image', src: '/images/a.png' }],
        },
      } as any,
      '/content',
    )
    expect((state.root.children as any)[0].src).toBe(
      'https://lobehub.com/images/a.png',
    )
    expect(upload).not.toHaveBeenCalled()
  })
})
