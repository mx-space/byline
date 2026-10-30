import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { debounce, omit } from 'es-toolkit/compat'
import slugify from 'slugify'

import { AppErrorCode, createAppException } from '~/common/errors'
import { ArticleTypeEnum } from '~/constants/article.constant'
import { BusinessEvents, EventScope } from '~/constants/business-event.constant'
import {
  CATEGORY_SERVICE_TOKEN,
  DRAFT_SERVICE_TOKEN,
} from '~/constants/injection.constant'
import { FileReferenceType } from '~/modules/file/file-reference.enum'
import { FileReferenceService } from '~/modules/file/file-reference.service'
import { EventManagerService } from '~/processors/helper/helper.event.service'
import { LexicalService } from '~/processors/helper/helper.lexical.service'
import { ApiCacheService } from '~/processors/redis/api-cache.service'
import { ContentFormat } from '~/shared/types/content-format.type'
import { contentIdentityChanged } from '~/utils/content.util'
import { scheduleManager } from '~/utils/schedule.util'
import { getLessThanNow } from '~/utils/time.util'

import type { CategoryService } from '../category/category.service'
import { DraftRefType } from '../draft/draft.enum'
import type { DraftService } from '../draft/draft.service'
import { SlugTrackerService } from '../slug-tracker/slug-tracker.service'
import { UserRepository } from '../user/user.repository'
import { PostRepository } from './post.repository'
import {
  POST_PROTECTED_KEYS,
  type PostListParams,
  type PostModel,
} from './post.types'
import { isPostPublic } from './post-visibility'
import { type PostExtras, PostExtrasSchema } from './post-write.schema'

@Injectable()
export class PostService implements OnApplicationBootstrap {
  private categoryService: CategoryService
  private draftService: DraftService

  constructor(
    private readonly postRepository: PostRepository,
    private readonly userRepository: UserRepository,
    private readonly fileReferenceService: FileReferenceService,
    private readonly eventManager: EventManagerService,
    private readonly slugTrackerService: SlugTrackerService,
    private readonly lexicalService: LexicalService,
    private readonly moduleRef: ModuleRef,
    private readonly apiCache: ApiCacheService,
  ) {}

  onApplicationBootstrap() {
    this.categoryService = this.moduleRef.get(CATEGORY_SERVICE_TOKEN, {
      strict: false,
    })
    this.draftService = this.moduleRef.get(DRAFT_SERVICE_TOKEN, {
      strict: false,
    })
  }

  public get repository() {
    return this.postRepository
  }

  async list(params: PostListParams = {}) {
    return this.postRepository.list(params)
  }

  async listPaginated(params: PostListParams = {}) {
    return this.postRepository.list(params)
  }

  async findById(id: string) {
    return this.postRepository.findById(id)
  }

  async findBySlug(slug: string, options: { publishedOnly?: boolean } = {}) {
    return this.postRepository.findBySlug(slug, options)
  }

  async findByCategoryAndSlug(
    categoryId: string,
    slug: string,
    isAuthenticated?: boolean,
  ) {
    return this.postRepository.findByCategoryAndSlug(categoryId, slug, {
      publishedOnly: !isAuthenticated,
    })
  }

  async findRecent(
    size: number,
    options: { publishedOnly?: boolean; metaOnly?: boolean } = {},
  ) {
    return this.postRepository.findRecent(size, options)
  }

  async findManyByIds(ids: string[]) {
    return this.postRepository.findManyByIds(ids)
  }

  async count() {
    return this.postRepository.count()
  }

  async countByCategoryId(
    categoryId: string,
    options: { publishedOnly?: boolean } = {},
  ) {
    return this.postRepository.countByCategoryId(categoryId, options)
  }

  async listByCategory(
    categoryId: string,
    options: {
      includeCategory?: boolean
      limit?: number
      publishedOnly?: boolean
      metaOnly?: boolean
    } = {},
  ) {
    return this.postRepository.listByCategory(categoryId, options)
  }

  async listByCategoryIds(
    categoryIds: ReadonlyArray<string>,
    options: {
      includeCategory?: boolean
      publishedOnly?: boolean
      metaOnly?: boolean
    } = {},
  ) {
    return this.postRepository.listByCategoryIds(categoryIds, options)
  }

  async findByCategoryId(categoryId: string) {
    return this.listByCategory(categoryId)
  }

  async findByTag(
    tag: string,
    options: {
      includeCategory?: boolean
      metaOnly?: boolean
      publishedOnly?: boolean
    } = {},
  ) {
    return this.postRepository.findByTag(tag, options)
  }

  async aggregateAllTagCounts(options: { publishedOnly?: boolean } = {}) {
    return this.postRepository.aggregateAllTagCounts(options)
  }

  async aggregateTagCountsByCategory(
    categoryId: string,
    options: { publishedOnly?: boolean } = {},
  ) {
    return this.postRepository.aggregateTagCountsByCategory(categoryId, options)
  }

  async findAdjacent(
    direction: 'before' | 'after',
    pivotDate: Date,
    options: { publishedOnly?: boolean } = {},
  ) {
    return this.postRepository.findAdjacent(direction, pivotDate, options)
  }

  private parseExtras(data: Record<string, unknown>): PostExtras {
    return PostExtrasSchema.parse({
      publicAt: data.publicAt,
      authors: data.authors ?? data.authorIds,
      sourceLang: data.sourceLang,
      image: data.image,
      seo: data.seo,
    })
  }

  private async assertAuthorsExist(authorIds: string[]) {
    if (authorIds.length === 0) return
    const found = await this.userRepository.findByIds(authorIds)
    if (found.length !== authorIds.length) {
      const known = new Set(found.map((user) => user.id))
      throw createAppException(AppErrorCode.USER_NOT_FOUND, {
        id: authorIds.find((id) => !known.has(id)),
      })
    }
  }

  async create(post: PostModel, actorId?: string) {
    this.assertLexical(post.contentFormat)
    this.lexicalService.normalizeContentForStorage(post)
    const extras = this.parseExtras(post as unknown as Record<string, unknown>)
    const authorIds = extras.authors?.length
      ? extras.authors
      : actorId
        ? [actorId]
        : []
    await this.assertAuthorsExist(authorIds)

    const { categoryId } = post
    const category = await this.categoryService.findCategoryById(
      categoryId as any as string,
    )
    if (!category) {
      throw createAppException(AppErrorCode.CATEGORY_NOT_FOUND)
    }

    const slug = post.slug ? slugify(post.slug) : slugify(post.title)
    if (!(await this.isAvailableSlug(slug))) {
      throw createAppException(AppErrorCode.SLUG_NOT_AVAILABLE)
    }

    const createdAt = getLessThanNow(post.createdAt ?? (post as any).created)
    const pinAt = post.pinAt ?? (post as any).pin ?? null
    let doc = await this.postRepository.create({
      title: post.title,
      slug,
      createdAt,
      text: post.text,
      content: post.content,
      contentFormat: ContentFormat.Lexical,
      summary: post.summary,
      images: post.images as unknown[],
      meta: post.meta,
      tags: post.tags,
      categoryId: category.id,
      isPublished: post.isPublished,
      publicAt: extras.publicAt,
      sourceLang: extras.sourceLang ?? null,
      image: extras.image ?? null,
      seo: extras.seo ?? null,
      pinAt,
      pinOrder: post.pinOrder,
      authorIds,
    })
    if (createdAt && createdAt.valueOf() !== doc.createdAt.valueOf()) {
      const refreshed = await this.postRepository.update(doc.id, {
        modifiedAt: null,
      })
      if (refreshed) doc = refreshed
    }
    await this.apiCache.invalidate()

    scheduleManager.schedule(async () => {
      await Promise.all([
        this.fileReferenceService.activateReferences(
          doc,
          doc.id,
          FileReferenceType.Post,
        ),
        this.eventManager.emit(
          BusinessEvents.POST_CREATE,
          { id: doc.id },
          {
            scope: isPostPublic(doc)
              ? EventScope.TO_SYSTEM_VISITOR
              : EventScope.TO_SYSTEM,
          },
        ),
      ])
    })

    return doc
  }

  private assertLexical(contentFormat: string | undefined) {
    if (
      contentFormat !== undefined &&
      contentFormat !== ContentFormat.Lexical
    ) {
      throw createAppException(AppErrorCode.INVALID_PARAMETER, {
        message: 'Byline stores Lexical content only',
      })
    }
  }

  private async trackSlugChanges(
    oldDocument: any,
    newDocument: Partial<PostModel>,
  ) {
    const oldDocumentRefCategory = await this.categoryService.findCategoryById(
      oldDocument.categoryId.toString(),
    )
    if (!oldDocumentRefCategory) {
      throw createAppException(AppErrorCode.CATEGORY_NOT_FOUND)
    }
    const oldSlugMeta = {
      slug: oldDocument.slug,
      categorySlug: oldDocumentRefCategory.slug,
    }

    const createSlugChangeTracker = () =>
      this.slugTrackerService.createTracker(
        `/${oldSlugMeta.categorySlug}/${oldSlugMeta.slug}`,
        ArticleTypeEnum.Post,
        oldDocument.id,
      )

    if (newDocument.slug && oldSlugMeta.slug !== newDocument.slug) {
      return createSlugChangeTracker()
    }
    if (
      newDocument.categoryId &&
      String(oldDocument.categoryId) !== String(newDocument.categoryId)
    ) {
      return createSlugChangeTracker()
    }
  }

  async getPostBySlug(
    categorySlug: string,
    slug: string,
    isAuthenticated?: boolean,
  ) {
    const findTrackedPost = async () => {
      const tracked = await this.slugTrackerService.findTrackerBySlug(
        `/${categorySlug}/${slug}`,
        ArticleTypeEnum.Post,
      )
      return tracked ? this.findById(tracked.targetId) : null
    }

    const categoryDocument = await this.getCategoryBySlug(categorySlug)
    if (!categoryDocument) {
      const trackedPost = await findTrackedPost()
      if (!trackedPost)
        throw createAppException(AppErrorCode.CATEGORY_NOT_FOUND)
      if (!isAuthenticated && !isPostPublic(trackedPost)) {
        throw createAppException(AppErrorCode.POST_NOT_FOUND, {
          id: trackedPost.id,
        })
      }
      return trackedPost
    }

    const postDocument = await this.findByCategoryAndSlug(
      categoryDocument.id,
      slug,
      isAuthenticated,
    )
    if (postDocument) return postDocument

    const trackedPost = await findTrackedPost()
    if (trackedPost && !isAuthenticated && !isPostPublic(trackedPost)) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND, {
        id: trackedPost.id,
      })
    }
    return trackedPost
  }

  async getPostBySlugOnly(slug: string, isAuthenticated?: boolean) {
    const postDocument = await this.findBySlug(slug, {
      publishedOnly: !isAuthenticated,
    })
    if (postDocument) return postDocument

    const tracked =
      await this.slugTrackerService.findLatestTrackerByTrailingSlug(
        slug,
        ArticleTypeEnum.Post,
      )
    const trackedPost = tracked ? await this.findById(tracked.targetId) : null
    if (trackedPost && !isAuthenticated && !isPostPublic(trackedPost)) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND, {
        id: trackedPost.id,
      })
    }
    return trackedPost
  }

  async patchById(
    id: string,
    patch: { categoryId?: string; pinAt?: Date | null },
  ) {
    await this.updateById(id, patch as Partial<PostModel>)
    await this.draftService.mergeArticleFields(DraftRefType.Post, id, {
      ...(patch.categoryId === undefined
        ? {}
        : { categoryId: patch.categoryId }),
      ...(patch.pinAt === undefined ? {} : { pin: Boolean(patch.pinAt) }),
    })
  }

  async updateById(id: string, data: Partial<PostModel>) {
    this.assertLexical(data.contentFormat)
    this.lexicalService.normalizeContentForStorage(data)
    const extras = this.parseExtras(data as Record<string, unknown>)
    if (extras.authors) await this.assertAuthorsExist(extras.authors)

    const oldDocument = await this.findById(id)
    if (!oldDocument) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND, { id })
    }

    const { categoryId } = data
    if (categoryId && String(categoryId) !== String(oldDocument.categoryId)) {
      const category = await this.categoryService.findCategoryById(
        categoryId as any as string,
      )
      if (!category) throw createAppException(AppErrorCode.CATEGORY_NOT_FOUND)
    }

    if (contentIdentityChanged(oldDocument, data)) {
      data.modifiedAt = new Date()
    }

    if (data.slug && data.slug !== oldDocument.slug) {
      data.slug = slugify(data.slug)
      if (!(await this.isAvailableSlug(data.slug))) {
        throw createAppException(AppErrorCode.SLUG_NOT_AVAILABLE)
      }
    }

    await this.trackSlugChanges(oldDocument, data)

    const patch = omit(data, POST_PROTECTED_KEYS as any) as Partial<PostModel>
    const createdAt = (data as any).created
      ? getLessThanNow((data as any).created)
      : patch.createdAt
    const pinAt =
      (data as any).pin !== undefined ? (data as any).pin : patch.pinAt
    const updated = await this.postRepository.update(id, {
      title: patch.title,
      slug: patch.slug,
      createdAt,
      text: patch.text,
      content: patch.content,
      contentFormat: patch.contentFormat,
      summary: patch.summary,
      images: patch.images as unknown[] | undefined,
      meta: patch.meta,
      tags: patch.tags,
      categoryId: patch.categoryId as string | undefined,
      isPublished: patch.isPublished,
      publicAt: extras.publicAt,
      sourceLang: extras.sourceLang,
      image: extras.image,
      seo: extras.seo,
      pinAt,
      pinOrder: patch.pinOrder,
      modifiedAt: data.modifiedAt,
      authorIds: extras.authors,
    })
    await this.apiCache.invalidate()

    const wasPublished = isPostPublic(oldDocument)
    scheduleManager.schedule(() => this.afterUpdatePost(id, wasPublished))
    return updated
  }

  afterUpdatePost = debounce(
    async (id: string, wasPublished: boolean) => {
      const doc = await this.findById(id)
      if (doc) {
        await this.fileReferenceService.updateReferencesForDocument(
          doc,
          doc.id,
          FileReferenceType.Post,
        )
      }

      await (doc &&
        this.eventManager.emit(
          wasPublished === isPostPublic(doc)
            ? BusinessEvents.POST_UPDATE
            : isPostPublic(doc)
              ? BusinessEvents.POST_REPUBLISH
              : BusinessEvents.POST_UNPUBLISH,
          { id: doc.id, slug: doc.slug },
          {
            scope:
              wasPublished || isPostPublic(doc)
                ? EventScope.TO_SYSTEM_VISITOR
                : EventScope.TO_SYSTEM,
          },
        ))
    },
    1000,
    { leading: false },
  )

  async deletePost(id: string) {
    const [deleted] = await Promise.all([
      this.postRepository.deleteById(id),
      this.draftService.deleteByRef(DraftRefType.Post, id),
      this.slugTrackerService.deleteAllTracker(id),
      this.fileReferenceService.removeReferencesForDocument(
        id,
        FileReferenceType.Post,
      ),
    ])
    await this.eventManager.emit(
      BusinessEvents.POST_DELETE,
      { id, slug: deleted?.slug },
      {
        scope: EventScope.TO_SYSTEM_VISITOR,
        nextTick: true,
      },
    )
  }

  async getCategoryBySlug(slug: string) {
    return this.categoryService.findBySlug(slug)
  }

  async isAvailableSlug(slug: string) {
    return slug.length > 0 && !(await this.postRepository.findBySlug(slug))
  }
}
