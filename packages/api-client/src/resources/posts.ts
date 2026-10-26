import { BylineApiError, isBylineApiError } from '../error'
import type { HttpCore } from '../http'
import type {
  DraftBranch,
  DraftWriteData,
  Post,
  PostListQuery,
  PostPatch,
  PostResponseMeta,
  PostWriteInput,
  PublishAiResource,
  PublishAiResourceRequest,
  RevisionSnapshot,
} from '../types'
import type { DraftsResource } from './drafts'
import type { PublishJobsResource, WaitForTaskOptions } from './tasks'

const POST_PRESERVE = ['meta']
const POST_LIST_PRESERVE = ['[].meta']
const DRAFT_CORE_KEYS = new Set(['title', 'text', 'content', 'images', 'meta'])

export interface PostSaveOptions extends WaitForTaskOptions {
  publish?: boolean
  aiResources?: Array<PublishAiResource | PublishAiResourceRequest>
  regenerateLockedTranslations?: boolean
}

export interface PostSaveResult {
  draft: DraftBranch
  postId: string | null
  taskId: string | null
}

export const toDraftData = (input: Partial<PostWriteInput>): DraftWriteData => {
  const data: DraftWriteData = { contentFormat: 'lexical' }
  const typeSpecificData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (key === 'content') {
      data.content = typeof value === 'string' ? value : JSON.stringify(value)
    } else if (DRAFT_CORE_KEYS.has(key)) {
      ;(data as Record<string, unknown>)[key] = value
    } else {
      typeSpecificData[key] = value
    }
  }
  if (data.content !== undefined && data.text === undefined) data.text = ''
  if (Object.keys(typeSpecificData).length > 0) {
    data.typeSpecificData = typeSpecificData
  }
  return data
}

const mergeSnapshot = (
  base: RevisionSnapshot,
  patch: DraftWriteData,
): DraftWriteData => ({
  title: base.title,
  text: base.text,
  content: base.content ?? undefined,
  images: base.images as DraftWriteData['images'],
  meta: base.meta,
  ...patch,
  contentFormat: 'lexical',
  typeSpecificData: {
    ...base.typeSpecificData,
    ...patch.typeSpecificData,
  },
})

export class PostsResource {
  constructor(
    private readonly http: HttpCore,
    private readonly drafts: DraftsResource,
    private readonly publishJobs: PublishJobsResource,
  ) {}

  list(query: PostListQuery = {}) {
    return this.http.request<Post[], PostResponseMeta>('GET', '/posts', {
      query: { ...query, lang: query.lang ?? this.http.lang },
      preserve: POST_LIST_PRESERVE,
    })
  }

  get(id: string, options: { lang?: string } = {}) {
    return this.http.request<Post, PostResponseMeta>('GET', `/posts/${id}`, {
      query: { lang: options.lang ?? this.http.lang },
      preserve: POST_PRESERVE,
    })
  }

  getBySlug(
    categorySlug: string,
    slug: string,
    options: { lang?: string } = {},
  ) {
    return this.http.request<Post, PostResponseMeta>(
      'GET',
      `/posts/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`,
      {
        query: { lang: options.lang ?? this.http.lang },
        preserve: POST_PRESERVE,
      },
    )
  }

  getBySlugOnly(slug: string, options: { lang?: string } = {}) {
    return this.http.request<Post, PostResponseMeta>(
      'GET',
      `/posts/slug/${encodeURIComponent(slug)}`,
      {
        query: { lang: options.lang ?? this.http.lang },
        preserve: POST_PRESERVE,
      },
    )
  }

  getPath(slug: string) {
    return this.http.request<{ path: string }>(
      'GET',
      `/posts/get-url/${encodeURIComponent(slug)}`,
    )
  }

  async findBySlug(slug: string, options: { lang?: string } = {}) {
    try {
      const { data } = await this.getPath(slug)
      const [category, postSlug] = data.path.replace(/^\/+/, '').split('/')
      if (!category || !postSlug) return null
      return await this.getBySlug(
        category,
        decodeURIComponent(postSlug),
        options,
      )
    } catch (error) {
      if (isBylineApiError(error) && error.status === 404) return null
      throw error
    }
  }

  latest(options: { lang?: string } = {}) {
    return this.http.request<Post, PostResponseMeta>('GET', '/posts/latest', {
      query: { lang: options.lang ?? this.http.lang },
      preserve: POST_PRESERVE,
    })
  }

  update(id: string, patch: PostPatch) {
    return this.http.request<void>('PATCH', `/posts/${id}`, { body: patch })
  }

  setPublished(id: string, isPublished: boolean) {
    return this.http.request<{ success: boolean }>(
      'PATCH',
      `/posts/${id}/publish`,
      { body: { isPublished } },
    )
  }

  delete(id: string) {
    return this.http.request<void>('DELETE', `/posts/${id}`)
  }

  async create(
    input: PostWriteInput,
    options: PostSaveOptions = {},
  ): Promise<PostSaveResult> {
    const { data: draft } = await this.drafts.create({
      refType: 'post',
      data: toDraftData(input),
    })
    return this.finish(draft, options)
  }

  async revise(
    id: string,
    input: Partial<PostWriteInput>,
    options: PostSaveOptions = {},
  ): Promise<PostSaveResult> {
    const { data: context } = await this.drafts.context('post', id)
    const base = context.publishedRevision
    if (!base) {
      throw new BylineApiError(
        404,
        'CONTENT_REVISION_NOT_FOUND',
        `Post ${id} has no published revision to branch from`,
        `/drafts/context/post/${id}`,
      )
    }
    const { data: draft } = await this.drafts.create({
      refType: 'post',
      refId: id,
      baseRevisionId: base.id,
      data: mergeSnapshot(base, toDraftData(input)),
      ...(options.publish === false ? {} : { ifInSync: true }),
    })
    return this.finish(draft, options)
  }

  private async finish(
    draft: DraftBranch,
    options: PostSaveOptions,
  ): Promise<PostSaveResult> {
    if (options.publish === false) {
      return { draft, postId: draft.document.refId, taskId: null }
    }
    const task = await this.publishJobs.run(
      {
        branchId: draft.id,
        revisionId: draft.headRevisionId,
        expectedPublishedRevisionId: draft.document.publishedRevisionId,
        aiResources: options.aiResources,
        regenerateLockedTranslations: options.regenerateLockedTranslations,
      },
      options,
    )
    return { draft, postId: task.result.articleId, taskId: task.id }
  }
}
