import { Inject, Injectable } from '@nestjs/common'
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lt,
  type SQL,
  sql,
} from 'drizzle-orm'

import { PG_DB_TOKEN } from '~/constants/system.constant'
import { categories, postAuthors, posts, users } from '~/database/schema'
import {
  BaseRepository,
  type PaginationResult,
  toEntityId,
} from '~/processors/database/base.repository'
import type { AppDatabase } from '~/processors/database/postgres.provider'
import { type EntityId, parseEntityId } from '~/shared/id/entity-id'
import { SnowflakeService } from '~/shared/id/snowflake.service'

import { type PublicUserProfile, toPublicProfile } from '../user/user.types'
import type {
  PostCreateInput,
  PostListByCategoryOptions,
  PostListParams,
  PostPatchInput,
  PostRow,
  PostTagCount,
} from './post.types'

type PostRowSource = Omit<typeof posts.$inferSelect, 'text' | 'content'> &
  Partial<Pick<typeof posts.$inferSelect, 'text' | 'content'>>

const mapBase = (row: PostRowSource): PostRow => ({
  id: toEntityId(row.id) as EntityId,
  title: row.title,
  slug: row.slug,
  text: row.text ?? '',
  content: row.content ?? null,
  contentFormat: row.contentFormat,
  summary: row.summary,
  images: row.images,
  meta: row.meta,
  tags: row.tags ?? [],
  modifiedAt: row.modifiedAt,
  categoryId: toEntityId(row.categoryId) as EntityId,
  isPublished: row.isPublished,
  sourceLang: row.sourceLang,
  image: row.image,
  seo: row.seo ?? null,
  pinAt: row.pinAt,
  pinOrder: row.pinOrder,
  createdAt: row.createdAt,
})

const postColumns = getTableColumns(posts)
const {
  text: _postText,
  content: _postContent,
  ...postMetaColumns
} = postColumns

const pinAtDescNullsLast = sql`${posts.pinAt} desc nulls last`

const yearRange = (year: number) => ({
  end: new Date(Date.UTC(year + 1, 0, 1)),
  start: new Date(Date.UTC(year, 0, 1)),
})

@Injectable()
export class PostRepository extends BaseRepository {
  constructor(
    @Inject(PG_DB_TOKEN) db: AppDatabase,
    private readonly snowflake: SnowflakeService,
  ) {
    super(db)
  }

  async findById(id: EntityId | string): Promise<PostRow | null> {
    const idBig = parseEntityId(id)
    const [row] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.id, idBig))
      .limit(1)
    if (!row) return null
    return this.hydrateOne(mapBase(row))
  }

  async findBySlug(slug: string): Promise<PostRow | null> {
    const [row] = await this.db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1)
    if (!row) return null
    return this.hydrateOne(mapBase(row))
  }

  async list(params: PostListParams = {}): Promise<PaginationResult<PostRow>> {
    const page = Math.max(1, params.page ?? 1)
    const size = Math.min(50, Math.max(1, params.size ?? 10))
    const offset = (page - 1) * size
    const filters: SQL[] = []
    if (params.categoryId) {
      filters.push(eq(posts.categoryId, parseEntityId(params.categoryId)))
    }
    if (params.categoryIds?.length) {
      filters.push(
        inArray(
          posts.categoryId,
          params.categoryIds.map((id) => parseEntityId(id)),
        ),
      )
    }
    if (params.publishedOnly) {
      filters.push(eq(posts.isPublished, true))
    }
    if (params.authorId) {
      filters.push(
        sql`exists (select 1 from ${postAuthors} where ${postAuthors.postId} = ${posts.id} and ${postAuthors.userId} = ${params.authorId})`,
      )
    }
    if (params.tag) {
      filters.push(sql`${posts.tags} @> array[${params.tag}]::text[]`)
    }
    if (params.year) {
      const { start, end } = yearRange(params.year)
      filters.push(gte(posts.createdAt, start), lt(posts.createdAt, end))
    }
    if (params.excludeAiWritten) {
      // aiGen preset 2 = "fully AI-written" (see web ai-gen.ts); jsonb @> matches
      // both the scalar form and membership in the disclosure array
      filters.push(
        sql`(${posts.meta} -> 'aiGen' is null or not (${posts.meta} -> 'aiGen' @> '2'::jsonb))`,
      )
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined
    const orderBy =
      params.sortBy === 'createdAt'
        ? params.sortOrder === 1
          ? asc(posts.createdAt)
          : desc(posts.createdAt)
        : params.sortBy === 'modifiedAt'
          ? params.sortOrder === 1
            ? asc(posts.modifiedAt)
            : desc(posts.modifiedAt)
          : params.sortBy === 'pinAt'
            ? params.sortOrder === 1
              ? asc(posts.pinAt)
              : pinAtDescNullsLast
            : null

    const selection = params.truncateText
      ? {
          ...postColumns,
          text: sql<string | null>`left(${posts.text}, ${params.truncateText})`,
        }
      : postColumns
    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select(selection)
        .from(posts)
        .where(whereClause)
        .orderBy(orderBy ?? pinAtDescNullsLast, desc(posts.createdAt))
        .limit(size)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(posts)
        .where(whereClause),
    ])

    const data = await this.hydrate(rows.map(mapBase))
    return {
      data,
      pagination: this.paginationOf(Number(count ?? 0), page, size),
    }
  }

  async create(input: PostCreateInput): Promise<PostRow> {
    const id = this.snowflake.nextId()
    const row = await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(posts)
        .values({
          id,
          ...(input.createdAt ? { createdAt: input.createdAt } : {}),
          title: input.title,
          slug: input.slug,
          text: input.text ?? null,
          content: input.content ?? null,
          contentFormat: input.contentFormat,
          summary: input.summary ?? null,
          images: input.images ?? null,
          meta: input.meta ?? null,
          tags: input.tags ?? [],
          categoryId: parseEntityId(input.categoryId),
          isPublished: input.isPublished ?? true,
          sourceLang: input.sourceLang ?? null,
          image: input.image ?? null,
          seo: input.seo ?? null,
          pinAt: input.pinAt ?? null,
          pinOrder: input.pinOrder ?? null,
        })
        .returning()
      await this.replaceAuthors(tx, inserted.id, input.authorIds)
      return inserted
    })
    return this.hydrateOne(mapBase(row))
  }

  async update(
    id: EntityId | string,
    patch: PostPatchInput,
  ): Promise<PostRow | null> {
    const idBig = parseEntityId(id)
    const update: Partial<typeof posts.$inferInsert> = {}
    if (patch.title !== undefined) update.title = patch.title
    if (patch.createdAt !== undefined) update.createdAt = patch.createdAt
    if (patch.slug !== undefined) update.slug = patch.slug
    if (patch.text !== undefined) update.text = patch.text
    if (patch.content !== undefined) update.content = patch.content
    if (patch.contentFormat !== undefined)
      update.contentFormat = patch.contentFormat
    if (patch.summary !== undefined) update.summary = patch.summary
    if (patch.images !== undefined) update.images = patch.images
    if (patch.meta !== undefined) update.meta = patch.meta
    if (patch.tags !== undefined) update.tags = patch.tags
    if (patch.categoryId !== undefined)
      update.categoryId = parseEntityId(patch.categoryId)
    if (patch.isPublished !== undefined) update.isPublished = patch.isPublished
    if (patch.sourceLang !== undefined) update.sourceLang = patch.sourceLang
    if (patch.image !== undefined) update.image = patch.image
    if (patch.seo !== undefined) update.seo = patch.seo
    if (patch.pinAt !== undefined) update.pinAt = patch.pinAt
    if (patch.pinOrder !== undefined) update.pinOrder = patch.pinOrder
    update.modifiedAt = patch.modifiedAt ?? new Date()
    const row = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(posts)
        .set(update)
        .where(eq(posts.id, idBig))
        .returning()
      if (updated && patch.authorIds !== undefined) {
        await this.replaceAuthors(tx, updated.id, patch.authorIds)
      }
      return updated
    })
    return row ? this.hydrateOne(mapBase(row)) : null
  }

  async deleteById(id: EntityId | string): Promise<PostRow | null> {
    const idBig = parseEntityId(id)
    const [row] = await this.db
      .delete(posts)
      .where(eq(posts.id, idBig))
      .returning()
    return row ? mapBase(row) : null
  }

  async countByCategoryId(
    categoryId: EntityId | string,
    options: { publishedOnly?: boolean } = {},
  ): Promise<number> {
    const filters: SQL[] = [eq(posts.categoryId, parseEntityId(categoryId))]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(...filters))
    return Number(row?.count ?? 0)
  }

  async count(): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(posts)
    return Number(row?.count ?? 0)
  }

  async findRecent(
    size: number,
    options: { publishedOnly?: boolean; metaOnly?: boolean } = {},
  ): Promise<PostRow[]> {
    const where = options.publishedOnly
      ? eq(posts.isPublished, true)
      : undefined
    const rows = await this.db
      .select(options.metaOnly ? postMetaColumns : postColumns)
      .from(posts)
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(Math.max(1, size))
    return this.hydrate(rows.map(mapBase))
  }

  async findManyByIds(ids: Array<EntityId | string>): Promise<PostRow[]> {
    if (ids.length === 0) return []
    const bigInts = ids.map((id) => parseEntityId(id))
    const rows = await this.db
      .select()
      .from(posts)
      .where(inArray(posts.id, bigInts))
    return this.hydrate(rows.map(mapBase))
  }

  async findIdsByTitle(search: string): Promise<EntityId[]> {
    const rows = await this.db
      .select({ id: posts.id })
      .from(posts)
      .where(ilike(posts.title, `%${search}%`))
    return rows.map((row) => toEntityId(row.id) as EntityId)
  }

  async aggregateAllTagCounts(
    options: { publishedOnly?: boolean } = {},
  ): Promise<PostTagCount[]> {
    const tagAlias = sql<string>`tag`
    const rows = await this.db
      .select({
        name: sql<string>`unnest(${posts.tags})`.as('tag'),
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(options.publishedOnly ? eq(posts.isPublished, true) : undefined)
      .groupBy(tagAlias)
      .orderBy(sql`count(*) desc`, sql`tag asc`)
    return rows.map((row) => ({
      name: row.name,
      count: Number(row.count ?? 0),
    }))
  }

  async aggregateTagCountsByCategory(
    categoryId: EntityId | string,
    options: { publishedOnly?: boolean } = {},
  ): Promise<PostTagCount[]> {
    const filters: SQL[] = [eq(posts.categoryId, parseEntityId(categoryId))]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))
    const tagAlias = sql<string>`tag`
    const rows = await this.db
      .select({
        name: sql<string>`unnest(${posts.tags})`.as('tag'),
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(and(...filters))
      .groupBy(tagAlias)
      .orderBy(sql`count(*) desc`, sql`tag asc`)
    return rows.map((row) => ({
      name: row.name,
      count: Number(row.count ?? 0),
    }))
  }

  async findByTag(
    tag: string,
    options: {
      includeCategory?: boolean
      metaOnly?: boolean
      publishedOnly?: boolean
    } = {},
  ): Promise<PostRow[]> {
    const filters: SQL[] = [sql`${posts.tags} @> array[${tag}]::text[]`]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))
    const rows = await this.db
      .select(options.metaOnly ? postMetaColumns : postColumns)
      .from(posts)
      .where(and(...filters))
      .orderBy(pinAtDescNullsLast, desc(posts.createdAt))

    const mapped = rows.map(mapBase)
    if (!options.includeCategory) return this.attachAuthors(mapped)
    return this.hydrate(mapped)
  }

  async listByCategory(
    categoryId: EntityId | string,
    options: PostListByCategoryOptions = {},
  ): Promise<PostRow[]> {
    const filters: SQL[] = [eq(posts.categoryId, parseEntityId(categoryId))]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))

    const query = this.db
      .select(options.metaOnly ? postMetaColumns : postColumns)
      .from(posts)
      .where(and(...filters))
      .orderBy(pinAtDescNullsLast, desc(posts.createdAt))

    const rows =
      options.limit === undefined
        ? await query
        : await query.limit(Math.max(1, options.limit))
    const mapped = rows.map(mapBase)
    if (options.includeCategory === false) return this.attachAuthors(mapped)
    return this.hydrate(mapped)
  }

  async listByCategoryIds(
    categoryIds: ReadonlyArray<EntityId | string>,
    options: Omit<PostListByCategoryOptions, 'limit'> = {},
  ): Promise<Map<string, PostRow[]>> {
    const grouped = new Map<string, PostRow[]>()
    if (categoryIds.length === 0) return grouped

    const parsedIds = categoryIds.map((id) => parseEntityId(id))
    const filters: SQL[] = [inArray(posts.categoryId, parsedIds)]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))

    const rows = await this.db
      .select(options.metaOnly ? postMetaColumns : postColumns)
      .from(posts)
      .where(and(...filters))
      .orderBy(pinAtDescNullsLast, desc(posts.createdAt))

    const mapped = rows.map(mapBase)
    const withCategory =
      options.includeCategory === false
        ? await this.attachAuthors(mapped)
        : await this.hydrate(mapped)

    for (const post of withCategory) {
      const key = String(post.categoryId)
      const bucket = grouped.get(key)
      if (bucket) bucket.push(post)
      else grouped.set(key, [post])
    }
    return grouped
  }

  async findByCategoryAndSlug(
    categoryId: EntityId | string,
    slug: string,
    options: { publishedOnly?: boolean } = {},
  ): Promise<PostRow | null> {
    const filters: SQL[] = [
      eq(posts.categoryId, parseEntityId(categoryId)),
      eq(posts.slug, slug),
    ]
    if (options.publishedOnly) filters.push(eq(posts.isPublished, true))
    const [row] = await this.db
      .select()
      .from(posts)
      .where(and(...filters))
      .limit(1)
    if (!row) return null
    return this.hydrateOne(mapBase(row))
  }

  async findAdjacent(
    direction: 'before' | 'after',
    pivotDate: Date,
    options: { publishedOnly?: boolean } = {},
  ): Promise<PostRow | null> {
    const filters: SQL[] = [
      direction === 'before'
        ? sql`${posts.createdAt} < ${pivotDate}`
        : sql`${posts.createdAt} > ${pivotDate}`,
    ]
    if (options.publishedOnly) {
      filters.push(eq(posts.isPublished, true))
    }
    const where = and(...filters)
    const [row] = await this.db
      .select()
      .from(posts)
      .where(where)
      .orderBy(direction === 'before' ? desc(posts.createdAt) : posts.createdAt)
      .limit(1)
    if (!row) return null
    return this.hydrateOne(mapBase(row))
  }

  async findPublishedForSitemap(): Promise<PostRow[]> {
    const rows = await this.db
      .select(postMetaColumns)
      .from(posts)
      .where(eq(posts.isPublished, true))
      .orderBy(desc(posts.createdAt))
    return this.hydrate(rows.map(mapBase))
  }

  private async attachCategories(rows: PostRow[]): Promise<PostRow[]> {
    if (rows.length === 0) return rows

    const categoryIds = [
      ...new Set(rows.map((row) => parseEntityId(row.categoryId))),
    ]
    const categoryRows = await this.db
      .select()
      .from(categories)
      .where(inArray(categories.id, categoryIds))
    const categoryById = new Map(
      categoryRows.map((cat) => [
        cat.id.toString(),
        {
          id: toEntityId(cat.id) as EntityId,
          name: cat.name,
          slug: cat.slug,
          type: cat.type,
        },
      ]),
    )

    for (const row of rows) {
      row.category = categoryById.get(parseEntityId(row.categoryId).toString())
    }
    return rows
  }

  private async attachAuthors(rows: PostRow[]): Promise<PostRow[]> {
    if (rows.length === 0) return rows
    const links = await this.db
      .select({
        postId: postAuthors.postId,
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        bio: users.bio,
        url: users.url,
      })
      .from(postAuthors)
      .innerJoin(users, eq(users.id, postAuthors.userId))
      .where(
        inArray(
          postAuthors.postId,
          rows.map((row) => parseEntityId(row.id)),
        ),
      )
      .orderBy(asc(postAuthors.postId), asc(postAuthors.position))

    const byPost = new Map<string, PublicUserProfile[]>()
    for (const link of links) {
      const list = byPost.get(link.postId) ?? []
      list.push(
        toPublicProfile({
          id: link.id,
          displayName: link.name,
          username: link.username,
          avatar: link.image,
          bio: link.bio,
          url: link.url,
        }),
      )
      byPost.set(link.postId, list)
    }
    for (const row of rows) {
      row.authors = byPost.get(String(row.id)) ?? []
    }
    return rows
  }

  private async hydrate(rows: PostRow[]): Promise<PostRow[]> {
    await this.attachCategories(rows)
    return this.attachAuthors(rows)
  }

  private async hydrateOne(row: PostRow): Promise<PostRow> {
    const [hydrated] = await this.hydrate([row])
    return hydrated
  }

  private async replaceAuthors(
    tx: Pick<AppDatabase, 'delete' | 'insert'>,
    postId: string,
    authorIds: string[],
  ) {
    await tx.delete(postAuthors).where(eq(postAuthors.postId, postId))
    const unique = [...new Set(authorIds)]
    if (unique.length === 0) return
    await tx
      .insert(postAuthors)
      .values(unique.map((userId, position) => ({ postId, userId, position })))
  }
}
