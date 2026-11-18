import { Injectable } from '@nestjs/common'

import { CollectionRefTypes } from '~/constants/db.constant'
import { ConfigsService } from '~/modules/configs/configs.service'
import { DraftRepository } from '~/modules/draft/draft.repository'
import type {
  ContentDocumentRow,
  DraftBranchRow,
} from '~/modules/draft/draft.types'
import { PostRepository } from '~/modules/post/post.repository'
import type { PostRow } from '~/modules/post/post.types'
import { isEntityIdString, parseEntityId } from '~/shared/id/entity-id'
import { normalizeLanguageCode } from '~/utils/lang.util'

import { buildPostRowFromDraft } from './draft-article'

export type RefArticleInfo = {
  id: string
  title: string
  type: CollectionRefTypes
  draftId?: string
}

export const buildRefArticleMap = (articles: {
  posts: Array<{ id: string; title: string; draftId?: string }>
}): Record<string, RefArticleInfo> => {
  const map: Record<string, RefArticleInfo> = {}
  for (const a of articles.posts) {
    map[a.id] = {
      id: a.id,
      title: a.title,
      type: CollectionRefTypes.Post,
      ...(a.draftId ? { draftId: a.draftId } : {}),
    }
  }
  return map
}

export type GlobalDocumentResult = {
  document: PostRow
  type: CollectionRefTypes.Post
}

type IdsCollection = {
  posts: PostRow[]
}

@Injectable()
export class DatabaseService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly configsService: ConfigsService,
    private readonly draftRepository: DraftRepository,
  ) {}

  private async applyDefaultSourceLang(posts: PostRow[]) {
    if (posts.every((post) => post.sourceLang)) return posts
    const { defaultSourceLang } = await this.configsService.get('site')
    const fallback =
      normalizeLanguageCode(defaultSourceLang) ?? defaultSourceLang
    if (!fallback) return posts
    for (const post of posts) {
      post.sourceLang ||= fallback
    }
    return posts
  }

  public async findGlobalById(
    id: string,
  ): Promise<GlobalDocumentResult | null> {
    parseEntityId(id)
    const document =
      (await this.postRepository.findById(id)) ??
      (await this.resolveDraftArticle(id))
    if (!document) return null
    await this.applyDefaultSourceLang([document])
    return { document, type: CollectionRefTypes.Post }
  }

  public async findGlobalByIds(ids: string[]): Promise<IdsCollection> {
    const validIds = ids.filter(isEntityIdString)
    const posts = await this.postRepository.findManyByIds(validIds)
    const found = new Set(posts.map((post) => String(post.id)))
    const missing = validIds.filter((id) => !found.has(id))
    for (const id of missing) {
      const draftArticle = await this.resolveDraftArticle(id)
      if (!draftArticle) continue
      const canonical = String(draftArticle.id)
      if (found.has(canonical)) continue
      found.add(canonical)
      posts.push(draftArticle)
    }
    return { posts: await this.applyDefaultSourceLang(posts) }
  }

  private async resolveDraftArticle(id: string): Promise<PostRow | null> {
    const branch = await this.draftRepository.findBranchById(id)
    if (branch) return this.articleFromBranch(branch)
    const document = await this.draftRepository.findDocumentById(id)
    if (!document) return null
    return this.articleFromDocument(document)
  }

  private async articleFromDocument(
    document: ContentDocumentRow,
  ): Promise<PostRow | null> {
    const branches = await this.draftRepository.findBranchesByDocument(
      document.id,
      'active',
    )
    if (branches[0]) return this.articleFromBranch(branches[0], document)
    if (!document.publishedRevisionId) return null
    const revision = await this.draftRepository.findRevisionById(
      document.publishedRevisionId,
    )
    if (!revision) return null
    const existing = document.refId
      ? await this.postRepository.findById(document.refId)
      : null
    return buildPostRowFromDraft({ document, revision, existing })
  }

  private async articleFromBranch(
    branch: DraftBranchRow,
    knownDocument?: ContentDocumentRow,
  ): Promise<PostRow | null> {
    const document =
      knownDocument ??
      (await this.draftRepository.findDocumentById(branch.documentId))
    if (!document) return null
    const revision = await this.draftRepository.findRevisionById(
      branch.headRevisionId,
    )
    if (!revision) return null
    const existing = document.refId
      ? await this.postRepository.findById(document.refId)
      : null
    return buildPostRowFromDraft({ document, revision, existing })
  }

  public async findRefCandidates(
    search: string,
    size: number,
  ): Promise<GlobalDocumentResult[]> {
    const normalized = search.trim()
    const posts = normalized
      ? (
          await this.findGlobalByIds(
            (await this.findArticleIdsByTitle(normalized)).slice(0, size),
          )
        ).posts
      : (await this.postRepository.list({ page: 1, size })).data

    return posts
      .map((document) => ({ document, type: CollectionRefTypes.Post as const }))
      .sort(
        (a, b) =>
          (b.document.createdAt?.getTime() ?? 0) -
          (a.document.createdAt?.getTime() ?? 0),
      )
      .slice(0, size)
  }

  public async getRefArticleMap(
    refIds: string[],
  ): Promise<Record<string, RefArticleInfo>> {
    const { posts } = await this.findGlobalByIds(refIds)
    return buildRefArticleMap({ posts })
  }

  public findPostBySlug(slug: string) {
    return this.postRepository.findBySlug(slug)
  }

  public async findArticleIdsByTitle(search: string): Promise<string[]> {
    const normalizedSearch = search.trim()
    if (!normalizedSearch) return []
    return this.postRepository.findIdsByTitle(normalizedSearch)
  }

  public async findAllArticlesForTranslation(): Promise<{
    posts: Array<{ id: string; title: string }>
  }> {
    const posts = await this.postRepository.findPublishedForSitemap()
    return { posts: posts.map(({ id, title }) => ({ id, title })) }
  }

  public async findArticlesForProductLists() {
    return { posts: await this.postRepository.findProductListArticles() }
  }

  flatCollectionToMap(combinedCollection: IdsCollection) {
    const all = {} as Record<string, PostRow>
    for (const item of combinedCollection.posts) {
      all[item.id] = item
    }
    return all
  }
}
