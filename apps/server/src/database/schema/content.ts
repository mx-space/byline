import { sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  boolean,
  check,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { users } from './auth'
import { createdAt, pkText, refText, tsCol, updatedAt } from './columns'

const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType: () => 'bytea',
  toDriver: (value) => Buffer.from(value),
  fromDriver: (value) => new Uint8Array(value),
})

export interface PostSeo {
  title?: string | null
  description?: string | null
  image?: string | null
}

export interface DocumentAiSeo {
  description: string
  sourceHash: string
}

export const categories = pgTable(
  'categories',
  {
    id: pkText(),
    createdAt: createdAt(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    type: integer('type').notNull().default(0),
  },
  (table) => [
    uniqueIndex('categories_name_uniq').on(table.name),
    uniqueIndex('categories_slug_uniq').on(table.slug),
  ],
)

export const posts = pgTable(
  'posts',
  {
    id: pkText(),
    createdAt: createdAt(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    text: text('text'),
    content: text('content'),
    contentFormat: text('content_format').$type<'lexical'>().notNull(),
    summary: text('summary'),
    images: jsonb('images').$type<unknown[]>(),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    modifiedAt: tsCol('modified_at'),
    categoryId: refText('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    isPublished: boolean('is_published').notNull().default(true),
    publicAt: tsCol('public_at'),
    publicNotifiedAt: tsCol('public_notified_at'),
    sourceLang: text('source_lang'),
    image: text('image'),
    seo: jsonb('seo').$type<PostSeo | null>(),
    pinAt: tsCol('pin_at'),
    pinOrder: integer('pin_order'),
  },
  (table) => [
    uniqueIndex('posts_slug_uniq').on(table.slug),
    index('posts_modified_at_idx').on(table.modifiedAt),
    index('posts_pending_public_idx')
      .on(table.publicAt)
      .where(
        sql`${table.isPublished} = true and ${table.publicAt} is not null and ${table.publicNotifiedAt} is null`,
      )
      .concurrently(),
    index('posts_created_at_idx').on(table.createdAt),
    index('posts_category_id_idx').on(table.categoryId),
    index('posts_published_created_at_idx')
      .on(
        table.isPublished,
        table.pinAt.desc().nullsLast(),
        table.createdAt.desc(),
      )
      .concurrently(),
    index('posts_category_published_created_idx')
      .on(
        table.categoryId,
        table.isPublished,
        table.pinAt.desc().nullsLast(),
        table.createdAt.desc(),
      )
      .concurrently(),
    index('posts_tags_gin_idx').using('gin', table.tags).concurrently(),
  ],
)

export const postAuthors = pgTable(
  'post_authors',
  {
    postId: refText('post_id')
      .notNull()
      .references((): AnyPgColumn => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.userId] }),
    index('post_authors_user_idx').on(table.userId),
    index('post_authors_post_position_idx').on(table.postId, table.position),
  ],
)

export const contentDocuments = pgTable(
  'content_documents',
  {
    id: pkText(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    refType: text('ref_type').notNull(),
    refId: refText('ref_id'),
    createdBy: text('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    publishedRevisionId: refText('published_revision_id').references(
      (): AnyPgColumn => contentRevisions.id,
      { onDelete: 'set null' },
    ),
    publishAiResources: jsonb('publish_ai_resources').$type<
      {
        mode: 'sync' | 'async'
        resource: 'insights' | 'seo' | 'summary' | 'translation' | 'tts'
      }[]
    >(),
    aiSeo: jsonb('ai_seo').$type<DocumentAiSeo | null>(),
    crdtEpoch: integer('crdt_epoch').notNull().default(0),
  },
  (table) => [
    uniqueIndex('content_documents_ref_uniq')
      .on(table.refType, table.refId)
      .where(sql`${table.refId} is not null`),
  ],
)

export const contentRevisions = pgTable(
  'content_revisions',
  {
    id: pkText(),
    documentId: refText('document_id')
      .notNull()
      .references(() => contentDocuments.id, { onDelete: 'cascade' }),
    parentRevisionId: refText('parent_revision_id').references(
      (): AnyPgColumn => contentRevisions.id,
      { onDelete: 'restrict' },
    ),
    createdAt: createdAt(),
    title: text('title').notNull().default(''),
    text: text('text').notNull().default(''),
    content: text('content'),
    contentFormat: text('content_format').$type<'lexical'>().notNull(),
    images: jsonb('images').$type<unknown[]>(),
    meta: jsonb('meta').$type<Record<string, unknown>>(),
    typeSpecificData: jsonb('type_specific_data').$type<Record<
      string,
      unknown
    > | null>(),
    frontiers: jsonb('frontiers').$type<
      { counter: number; peer: `${number}` }[] | null
    >(),
    kind: text('kind'),
  },
  (table) => [
    index('content_revisions_document_idx').on(table.documentId),
    index('content_revisions_parent_idx').on(table.parentRevisionId),
  ],
)

export const drafts = pgTable(
  'drafts',
  {
    id: pkText(),
    documentId: refText('document_id')
      .notNull()
      .references(() => contentDocuments.id, { onDelete: 'cascade' }),
    baseRevisionId: refText('base_revision_id')
      .notNull()
      .references(() => contentRevisions.id, { onDelete: 'restrict' }),
    headRevisionId: refText('head_revision_id')
      .notNull()
      .references(() => contentRevisions.id, { onDelete: 'restrict' }),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check(
      'drafts_status_check',
      sql`${table.status} in ('active', 'archived')`,
    ),
    index('drafts_document_status_idx').on(table.documentId, table.status),
    index('drafts_updated_at_idx').on(table.updatedAt),
  ],
)

export const contentPublicationEvents = pgTable(
  'content_publication_events',
  {
    id: pkText(),
    documentId: refText('document_id')
      .notNull()
      .references(() => contentDocuments.id, { onDelete: 'cascade' }),
    revisionId: refText('revision_id')
      .notNull()
      .references(() => contentRevisions.id, { onDelete: 'restrict' }),
    previousRevisionId: refText('previous_revision_id').references(
      () => contentRevisions.id,
      { onDelete: 'restrict' },
    ),
    createdAt: createdAt(),
  },
  (table) => [
    index('content_publication_events_document_idx').on(
      table.documentId,
      table.createdAt,
    ),
  ],
)

export const dynamicComponents = pgTable(
  'dynamic_components',
  {
    id: pkText(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    url: text('url').notNull(),
    initialHeight: integer('initial_height').notNull(),
    propsSchema: jsonb('props_schema')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    parentUrl: text('parent_url'),
    previousUrls: text('previous_urls')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdBy: text('created_by').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('dynamic_components_name_uniq').on(table.name),
    uniqueIndex('dynamic_components_url_uniq').on(table.url),
  ],
)

export const contentCrdtDocs = pgTable('content_crdt_docs', {
  documentId: refText('document_id')
    .primaryKey()
    .notNull()
    .references(() => contentDocuments.id, { onDelete: 'cascade' }),
  snapshot: bytea('snapshot').notNull(),
  snapshotVersion: bytea('snapshot_version').notNull(),
  syncedRevisionId: refText('synced_revision_id').references(
    () => contentRevisions.id,
    { onDelete: 'set null' },
  ),
  editedAt: tsCol('edited_at'),
  fields: jsonb('fields').$type<{
    meta: Record<string, unknown> | null
    typeSpecificData: Record<string, unknown> | null
  } | null>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const contentCrdtUpdates = pgTable(
  'content_crdt_updates',
  {
    id: pkText(),
    documentId: refText('document_id')
      .notNull()
      .references(() => contentDocuments.id, { onDelete: 'cascade' }),
    bytes: bytea('bytes').notNull(),
    createdAt: createdAt(),
  },
  (table) => [index('content_crdt_updates_document_idx').on(table.documentId)],
)
