import { stripApiTrailingSlash } from '~/utils/trailing-slash.util'

describe('stripApiTrailingSlash', () => {
  test.each([
    ['/api/v3/ai/summaries/', '/api/v3/ai/summaries'],
    ['/api/v3/ai/summaries/?size=2', '/api/v3/ai/summaries?size=2'],
    ['/api/v3/posts//?a=/b/', '/api/v3/posts?a=/b/'],
    ['/api/v3/posts', '/api/v3/posts'],
    ['/api/v3/', '/api/v3/'],
    ['/admin/', '/admin/'],
    ['/', '/'],
  ])('%s -> %s', (input, expected) => {
    expect(stripApiTrailingSlash(input)).toBe(expected)
  })
})
