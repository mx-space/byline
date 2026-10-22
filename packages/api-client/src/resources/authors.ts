import type { HttpCore } from '../http'
import type { Author, AuthorListQuery, PaginatedMeta } from '../types'

export class AuthorsResource {
  constructor(private readonly http: HttpCore) {}

  list(query: AuthorListQuery = {}) {
    return this.http.request<Author[], PaginatedMeta>('GET', '/authors', {
      query: { ...query },
    })
  }

  async listAll() {
    const authors: Author[] = []
    for (let page = 1; ; page++) {
      const { data, meta } = await this.list({ page, size: 100 })
      authors.push(...data)
      if (!meta || page >= meta.pagination.totalPages || !data.length) break
    }
    return authors
  }

  get(idOrUsername: string) {
    return this.http.request<Author>(
      'GET',
      `/authors/${encodeURIComponent(idOrUsername)}`,
    )
  }
}
