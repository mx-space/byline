import type { HttpCore } from '../http'
import type {
  CreateDraftInput,
  DraftBranch,
  DraftRefType,
  DraftWriteData,
  PaginatedMeta,
  VersionContext,
} from '../types'

export class DraftsResource {
  constructor(private readonly http: HttpCore) {}

  list(
    query: {
      page?: number
      size?: number
      refType?: DraftRefType
      hasRef?: boolean
      search?: string
    } = {},
  ) {
    return this.http.request<DraftBranch[], PaginatedMeta>('GET', '/drafts', {
      query,
    })
  }

  get(id: string) {
    return this.http.request<DraftBranch>('GET', `/drafts/${id}`)
  }

  context(refType: DraftRefType, refId: string) {
    return this.http.request<VersionContext>(
      'GET',
      `/drafts/context/${refType}/${refId}`,
    )
  }

  create(input: CreateDraftInput) {
    return this.http.request<DraftBranch>('POST', '/drafts', { body: input })
  }

  update(
    id: string,
    input: { data: DraftWriteData; expectedHeadRevisionId: string },
  ) {
    return this.http.request<DraftBranch>('PUT', `/drafts/${id}`, {
      body: input,
    })
  }

  delete(id: string) {
    return this.http.request<void>('DELETE', `/drafts/${id}`)
  }
}
