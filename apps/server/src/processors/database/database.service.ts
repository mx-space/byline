import { Injectable } from '@nestjs/common'

import { CollectionRefTypes } from '~/constants/db.constant'
import { ConfigsService } from '~/modules/configs/configs.service'
import { PostRepository } from '~/modules/post/post.repository'
import type { PostRow } from '~/modules/post/post.types'
import { isEntityIdString, parseEntityId } from '~/shared/id/entity-id'
import { normalizeLanguageCode } from '~/utils/lang.util'

export type RefArticleInfo = {
  id: string
  title: string
  type: CollectionRefTypes
}

export const buildRefArticleMap = (articles: {
  posts: Array<{ id: string; title: string }>
}): Record<string, RefArticleInfo> => {
  const map: Record<string, RefArticleInfo> = {}
  for (const a of articles.posts) {
    map[a.id] = { id: a.id, title: a.title, type: CollectionRefTypes.Post }
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
    const document = await this.postRepository.findById(id)
    if (!document) return null
    await this.applyDefaultSourceLang([document])
    return { document, type: CollectionRefTypes.Post }
  }

  public async findGlobalByIds(ids: string[]): Promise<IdsCollection> {
    const validIds = ids.filter(isEntityIdString)
    const posts = await this.applyDefaultSourceLang(
      await this.postRepository.findManyByIds(validIds),
    )
    return { posts }
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

  public async findAllArticlesForAIText(): Promise<{
    posts: Array<{ id: string; title: string }>
  }> {
    return this.findAllArticlesForTranslation()
  }

  flatCollectionToMap(combinedCollection: IdsCollection) {
    const all = {} as Record<string, PostRow>
    for (const item of combinedCollection.posts) {
      all[item.id] = item
    }
    return all
  }
}
