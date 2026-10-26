import { defineProvider } from 'test/helper/defineProvider'

import { UrlBuilderService } from '~/processors/helper/helper.url-builder.service'

export const urlBuilderProvider = defineProvider({
  provide: UrlBuilderService,
  useValue: {
    async createPostUrlResolver() {
      return (post: { slug: string }) => `https://example.com/${post.slug}`
    },
  },
})
