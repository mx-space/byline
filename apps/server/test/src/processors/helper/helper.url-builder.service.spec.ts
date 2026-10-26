import { Test } from '@nestjs/testing'

import { ConfigsService } from '~/modules/configs/configs.service'
import { UrlBuilderService } from '~/processors/helper/helper.url-builder.service'

describe('UrlBuilderService', () => {
  let service: UrlBuilderService
  let url: { webUrl?: string; postPermalink?: string }

  beforeEach(async () => {
    url = { webUrl: 'https://lobehub.com/blog' }
    const moduleRef = await Test.createTestingModule({
      providers: [
        UrlBuilderService,
        {
          provide: ConfigsService,
          useValue: { waitForConfigReady: async () => ({ url }) },
        },
      ],
    }).compile()

    service = moduleRef.get(UrlBuilderService)
  })

  it('builds post urls from the category slug and an encoded post slug', () => {
    expect(
      service.build({
        title: 'Hello',
        slug: 'hello world',
        category: { slug: 'tech' },
      } as any),
    ).toBe('/posts/tech/hello%20world')
  })

  it('keeps the frontend url path when joining the default permalink', async () => {
    await expect(
      service.buildWithBaseUrl({
        title: 'Hello',
        slug: 'hello',
        category: { slug: 'community' },
      } as any),
    ).resolves.toBe('https://lobehub.com/blog/posts/community/hello')
  })

  it('renders the configured permalink template', async () => {
    url.postPermalink = '/{slug}'
    const resolve = await service.createPostUrlResolver()

    expect(
      resolve({
        id: '1',
        slug: 'claude-code',
        category: { slug: 'community' },
      }),
    ).toBe('https://lobehub.com/blog/claude-code')
  })

  it('supports the id token and collapses an empty category segment', async () => {
    url.postPermalink = '/{category}/{id}/{slug}.html'
    const resolve = await service.createPostUrlResolver()

    expect(resolve({ id: '42', slug: 'hello', category: null })).toBe(
      'https://lobehub.com/blog/42/hello.html',
    )
  })
})
