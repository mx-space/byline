import { Test } from '@nestjs/testing'

import { ConfigsService } from '~/modules/configs/configs.service'
import { UrlBuilderService } from '~/processors/helper/helper.url-builder.service'

describe('UrlBuilderService', () => {
  let service: UrlBuilderService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UrlBuilderService,
        {
          provide: ConfigsService,
          useValue: {},
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
})
