import { Body, Delete, Get, Param, Patch, Query } from '@nestjs/common'

import { ApiController } from '~/common/decorators/api-controller.decorator'
import { Auth } from '~/common/decorators/auth.decorator'
import { BypassCaseTransform } from '~/common/decorators/bypass-case-transform.decorator'
import { Lang } from '~/common/decorators/lang.decorator'
import { HasAdminAccess } from '~/common/decorators/role.decorator'
import { AppErrorCode, createAppException } from '~/common/errors'
import { withMeta } from '~/common/response/envelope.types'
import type { ArticleTranslation } from '~/common/response/meta.types'
import { MetaObjectBuilder } from '~/common/response/meta-builder'
import { TranslationEntryService } from '~/modules/ai/ai-translation/translation-entry.service'
import {
  applyArticleTranslationInPlace,
  applyTranslationEntriesInPlace,
  type ArticleTranslationInput,
  buildArticleTranslationMeta,
  buildTagGlossary,
  type EntryMaps,
  type EntryRule,
  TranslationService,
} from '~/processors/helper/helper.translation.service'
import { type EntityIdDto, EntityIdSchema } from '~/shared/dto/id.dto'

import { AiInsightsService } from '../ai/ai-insights/ai-insights.service'
import { parseLanguageCode } from '../ai/ai-language.util'
import { AiSummaryService } from '../ai/ai-summary/ai-summary.service'
import { AiTtsQueryService } from '../ai/ai-tts/ai-tts-query.service'
import {
  type CategoryAndSlugDto,
  CategoryAndSlugSchema,
  type PartialPostDto,
  PartialPostSchema,
  type PostDetailQueryDto,
  PostDetailQuerySchema,
  type PostPagerDto,
  PostPagerSchema,
  type PostSearchDto,
  PostSearchSchema,
  type PostSlugDto,
  PostSlugSchema,
  type SetPostPublishStatusDto,
  SetPostPublishStatusSchema,
} from './post.schema'
import { PostService } from './post.service'
import type { PostModel, PostRow } from './post.types'
import { PostMetaBuilder } from './post-meta-builder'
import { isPostPublic } from './post-visibility'

const CATEGORY_NAME_RULES: ReadonlyArray<EntryRule> = [
  {
    path: 'category.name',
    keyPath: 'category.name',
    mode: 'entity',
    idField: 'id',
  },
]

const POST_LIST_TRANSLATION_FIELDS = [
  'title',
  'text',
  'summary',
  'content',
  'contentFormat',
  'seo',
] as const

@ApiController('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly translationService: TranslationService,
    private readonly aiInsightsService: AiInsightsService,
    private readonly aiSummaryService: AiSummaryService,
    private readonly aiTtsQueryService: AiTtsQueryService,
    private readonly translationEntryService: TranslationEntryService,
  ) {}

  private async batchEntryTranslations(
    lang: string,
    posts: Array<
      | { category?: { id: unknown } | null; tags?: string[] | null }
      | null
      | undefined
    >,
  ): Promise<EntryMaps> {
    const categoryIds = new Set<string>()
    const tags = new Set<string>()
    for (const post of posts) {
      if (post?.category?.id) categoryIds.add(String(post.category.id))
      for (const tag of post?.tags ?? []) tags.add(tag)
    }
    return this.translationEntryService.getTranslationsBatch(lang, {
      entityLookups: categoryIds.size
        ? [{ keyPath: 'category.name', lookupKeys: categoryIds }]
        : [],
      dictLookups: tags.size
        ? [{ keyPath: 'post.tag', sourceTexts: tags }]
        : [],
    })
  }

  private applyTagGlossary(
    metaBuilder: MetaObjectBuilder<any>,
    entryMaps: EntryMaps,
  ) {
    const tags = buildTagGlossary(entryMaps)
    if (tags.length) metaBuilder.glossary({ tags })
  }

  @Get('/')
  @BypassCaseTransform(['[].meta'])
  async getPaginate(
    @Query({ schema: PostPagerSchema }) query: PostPagerDto,
    @HasAdminAccess() isAuthenticated: boolean,
    @Lang() lang?: string,
  ) {
    const {
      size,
      page,
      year,
      sortBy,
      sortOrder,
      truncate,
      categoryIds,
      authorId,
      excludeAiWritten,
    } = query

    const res = await this.postService.listPaginated({
      size,
      page,
      year,
      categoryIds,
      authorId,
      excludeAiWritten,
      publishedOnly: !isAuthenticated,
      sortBy: sortBy as any,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
      truncateText: truncate,
    })

    // With SQL-side truncation the snapshot text is partial — hand the
    // freshness check empty sources so it re-verifies hashes from the DB
    // instead of mismatching against truncated text.
    const articleInputs: ArticleTranslationInput[] = res.data
      .filter((doc) => typeof doc.text === 'string')
      .map((doc) => ({
        id: String(doc.id),
        title: doc.title,
        text: truncate ? '' : doc.text,
        summary: doc.summary,
        meta: doc.meta as { lang?: string } | undefined,
        contentFormat: doc.contentFormat,
        content: truncate ? undefined : doc.content,
        modifiedAt: doc.modifiedAt,
        createdAt: doc.createdAt,
      }))

    const [{ results: translationResults, meta: translationMeta }, entryMaps] =
      await Promise.all([
        this.translationService.collectArticleTranslations({
          articles: articleInputs,
          targetLang: lang,
          fields: POST_LIST_TRANSLATION_FIELDS,
        }),
        this.batchEntryTranslations(lang ?? '', res.data),
      ])

    for (const doc of res.data) {
      const tr = translationResults.get(String(doc.id))
      if (tr?.isTranslated) {
        applyArticleTranslationInPlace(doc as Record<string, any>, tr as any, {
          fields: POST_LIST_TRANSLATION_FIELDS,
        })
      }
    }

    if (lang) {
      for (const doc of res.data) {
        applyTranslationEntriesInPlace(
          doc as Record<string, any>,
          entryMaps,
          CATEGORY_NAME_RULES,
        )
      }
    }

    if (truncate) {
      for (const doc of res.data) {
        doc.text = doc.text.slice(0, truncate)
        doc.content = null
      }
    }

    const metaBuilder = new MetaObjectBuilder().view('card').pagination({
      page: res.pagination.currentPage,
      size: res.pagination.size,
      total: res.pagination.total,
      totalPages: res.pagination.totalPage,
    })

    if (translationMeta.size > 0) {
      metaBuilder.translation(translationMeta)
    }
    if (lang) this.applyTagGlossary(metaBuilder, entryMaps)

    return withMeta(res.data, metaBuilder.build())
  }

  @Get('/get-url/:slug')
  async getBySlug(
    @Param('slug') slug: string,
    @HasAdminAccess() isAuthenticated?: boolean,
  ) {
    if (typeof slug !== 'string') {
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    }
    const doc = await this.postService.findBySlug(slug)
    if (!doc || (!isAuthenticated && !isPostPublic(doc))) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    }

    return {
      path: `/${doc.category?.slug}/${doc.slug}`,
    }
  }

  @Get('/slug/:slug')
  @BypassCaseTransform(['meta'])
  async getDetailBySlug(
    @Param({ schema: PostSlugSchema }) params: PostSlugDto,
    @Query({ schema: PostDetailQuerySchema }) _query: PostDetailQueryDto,
    @HasAdminAccess() isAuthenticated?: boolean,
    @Lang() lang?: string,
  ) {
    const postDocument = await this.postService.getPostBySlugOnly(
      params.slug,
      isAuthenticated,
    )
    return this.buildPublicDetail(postDocument, isAuthenticated, lang)
  }

  @Get('/latest')
  @BypassCaseTransform(['meta'])
  async getLatest(
    @HasAdminAccess() isAuthenticated: boolean,
    @Lang() lang?: string,
  ) {
    const [last] = await this.postService.findRecent(1, {
      publishedOnly: !isAuthenticated,
    })
    if (!last) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    }
    if (!last.category?.slug)
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    return this.getByCateAndSlug(
      { category: last.category.slug, slug: last.slug },
      {} as any,
      isAuthenticated,
      lang,
    )
  }

  @Get('/search')
  @Auth()
  async search(@Query({ schema: PostSearchSchema }) query: PostSearchDto) {
    const res = await this.postService.listPaginated({
      keyword: query.keyword,
      metaOnly: true,
      page: query.page,
      size: query.size,
    })
    return withMeta(
      res.data,
      new MetaObjectBuilder()
        .view('card')
        .pagination({
          page: res.pagination.currentPage,
          size: res.pagination.size,
          total: res.pagination.total,
          totalPages: res.pagination.totalPage,
        })
        .build(),
    )
  }

  @Get('/:id')
  @BypassCaseTransform(['meta'])
  async getById(
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @HasAdminAccess() isAuthenticated: boolean,
    @Lang() lang?: string,
  ) {
    const { id } = params
    const doc = await this.postService.findById(id)
    if (!doc) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND, { id })
    }

    if (!isAuthenticated && !isPostPublic(doc)) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND, { id })
    }

    const [translationResult, entryMaps] = await Promise.all([
      this.translationService.translateArticle({
        articleId: String(doc.id),
        targetLang: lang,
        allowHidden: true,
        originalData: {
          title: doc.title,
          text: doc.text,
          summary: doc.summary,
          tags: doc.tags,
        },
      }),
      this.batchEntryTranslations(lang ?? '', [doc]),
    ])

    applyArticleTranslationInPlace(
      doc as Record<string, any>,
      translationResult,
    )

    if (lang) {
      applyTranslationEntriesInPlace(
        doc as Record<string, any>,
        entryMaps,
        CATEGORY_NAME_RULES,
      )
    }

    const metaBuilder = new PostMetaBuilder().view('detail')

    const translationMap = new Map([
      [
        String(doc.id),
        {
          article: buildArticleTranslationMeta(
            translationResult,
            lang,
          ) as ArticleTranslation,
        },
      ],
    ])
    metaBuilder.translation(translationMap)
    if (lang) this.applyTagGlossary(metaBuilder, entryMaps)

    return withMeta(doc, metaBuilder.build())
  }

  @Get('/:category/:slug')
  @BypassCaseTransform(['meta'])
  async getByCateAndSlug(
    @Param({ schema: CategoryAndSlugSchema }) params: CategoryAndSlugDto,
    @Query({ schema: PostDetailQuerySchema }) _query: PostDetailQueryDto,
    @HasAdminAccess() isAuthenticated?: boolean,
    @Lang() lang?: string,
  ) {
    const { category, slug } = params
    const postDocument = await this.postService.getPostBySlug(
      category,
      slug,
      isAuthenticated,
    )
    return this.buildPublicDetail(postDocument, isAuthenticated, lang)
  }

  private async buildPublicDetail(
    postDocument: PostRow | null,
    isAuthenticated: boolean | undefined,
    lang: string | undefined,
  ) {
    if (!postDocument) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    }

    if (!isAuthenticated && !isPostPublic(postDocument)) {
      throw createAppException(AppErrorCode.POST_NOT_FOUND)
    }

    const insightsLang = parseLanguageCode(lang)
    const [
      translationResult,
      entryMaps,
      hasInsightsInLocale,
      summaryDoc,
      ttsMeta,
    ] = await Promise.all([
      this.translationService.translateArticle({
        articleId: postDocument.id,
        targetLang: lang,
        allowHidden: Boolean(isAuthenticated),
        originalData: {
          title: postDocument.title,
          text: postDocument.text,
          summary: postDocument.summary,
          tags: postDocument.tags,
        },
      }),
      this.batchEntryTranslations(lang ?? '', [postDocument]),
      this.aiInsightsService
        .hasInsightsInLang(postDocument.id, insightsLang)
        .catch(() => false),
      this.aiSummaryService.getSummaryForPublicMeta(
        postDocument.id,
        insightsLang,
      ),
      this.aiTtsQueryService
        .getMetaForArticle(
          postDocument.id,
          insightsLang,
          postDocument.modifiedAt,
        )
        .catch(() => ({ available: false as const })),
    ])

    applyArticleTranslationInPlace(
      postDocument as Record<string, any>,
      translationResult,
    )

    if (lang) {
      applyTranslationEntriesInPlace(
        postDocument as Record<string, any>,
        entryMaps,
        CATEGORY_NAME_RULES,
      )
    }

    const metaBuilder = new PostMetaBuilder()
      .view('detail')
      .insights({ hasInLocale: hasInsightsInLocale })
      .tts(ttsMeta)

    if (summaryDoc) {
      metaBuilder.summary({
        id: summaryDoc.id,
        text: summaryDoc.summary,
        lang: summaryDoc.lang ?? insightsLang,
        createdAt: summaryDoc.createdAt,
      })
    }

    const translationMap = new Map([
      [
        String(postDocument.id),
        {
          article: buildArticleTranslationMeta(
            translationResult,
            lang,
          ) as ArticleTranslation,
        },
      ],
    ])
    metaBuilder.translation(translationMap)
    if (lang) this.applyTagGlossary(metaBuilder, entryMaps)

    return withMeta(postDocument, metaBuilder.build())
  }

  @Patch('/:id')
  @Auth()
  async patch(
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: PartialPostSchema }) body: PartialPostDto,
  ) {
    await this.postService.updateById(
      params.id,
      body as unknown as Partial<PostModel>,
    )
  }

  @Delete('/:id')
  @Auth()
  async deletePost(@Param({ schema: EntityIdSchema }) params: EntityIdDto) {
    const { id } = params
    await this.postService.deletePost(id)
  }

  @Patch('/:id/publish')
  @Auth()
  async setPublishStatus(
    @Param({ schema: EntityIdSchema }) params: EntityIdDto,
    @Body({ schema: SetPostPublishStatusSchema }) body: SetPostPublishStatusDto,
  ) {
    await this.postService.updateById(params.id, {
      isPublished: body.isPublished,
    })
    return { success: true }
  }
}
