import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { readers } from './auth'
import { createdAt, pkText, refText, tsCol } from './columns'

export const options = pgTable(
  'options',
  {
    id: pkText(),
    name: text('name').notNull(),
    value: jsonb('value').$type<unknown>(),
  },
  (table) => [uniqueIndex('options_name_uniq').on(table.name)],
)

export const fileReferences = pgTable(
  'file_references',
  {
    id: pkText(),
    createdAt: createdAt(),
    fileUrl: text('file_url').notNull(),
    fileName: text('file_name').notNull(),
    status: text('status').notNull(),
    refId: refText('ref_id'),
    refType: text('ref_type'),
    s3ObjectKey: text('s3_object_key'),
    readerId: text('reader_id').references((): AnyPgColumn => readers.id, {
      onDelete: 'set null',
    }),
    uploadedBy: text('uploaded_by'),
    mimeType: text('mime_type'),
    byteSize: bigint('byte_size', { mode: 'number' }),
    detachedAt: timestamp('detached_at', {
      withTimezone: false,
      mode: 'date',
    }),
  },
  (table) => [
    index('file_references_file_url_idx').on(table.fileUrl),
    index('file_references_ref_idx').on(table.refId, table.refType),
    index('file_references_status_created_idx').on(
      table.status,
      table.createdAt,
    ),
    index('file_references_reader_status_created_idx').on(
      table.readerId,
      table.status,
      table.createdAt,
    ),
    index('file_references_status_detached_idx').on(
      table.status,
      table.detachedAt,
    ),
  ],
)

export const fileUsages = pgTable(
  'file_usages',
  {
    id: pkText(),
    createdAt: createdAt(),
    fileReferenceId: refText('file_reference_id')
      .notNull()
      .references(() => fileReferences.id, { onDelete: 'cascade' }),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    sourceField: text('source_field').notNull(),
  },
  (table) => [
    uniqueIndex('file_usages_reference_source_uniq').on(
      table.fileReferenceId,
      table.sourceType,
      table.sourceId,
      table.sourceField,
    ),
    index('file_usages_source_idx').on(table.sourceType, table.sourceId),
  ],
)

export const slugTrackers = pgTable(
  'slug_trackers',
  {
    id: pkText(),
    slug: text('slug').notNull(),
    type: text('type').notNull(),
    targetId: refText('target_id').notNull(),
  },
  (table) => [
    index('slug_trackers_type_target_idx').on(table.type, table.targetId),
    index('slug_trackers_slug_type_idx').on(table.slug, table.type),
  ],
)

export const webhooks = pgTable(
  'webhooks',
  {
    id: pkText(),
    timestamp: tsCol('timestamp'),
    payloadUrl: text('payload_url').notNull(),
    events: text('events').array().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    secret: text('secret').notNull(),
    scope: integer('scope'),
  },
  (table) => [index('webhooks_enabled_idx').on(table.enabled)],
)

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: pkText(),
    timestamp: tsCol('timestamp'),
    headers: jsonb('headers').$type<Record<string, unknown> | null>(),
    payload: jsonb('payload').$type<unknown>(),
    event: text('event'),
    response: jsonb('response').$type<unknown>(),
    success: boolean('success'),
    hookId: refText('hook_id')
      .notNull()
      .references(() => webhooks.id, { onDelete: 'cascade' }),
    status: integer('status').notNull().default(0),
  },
  (table) => [
    index('webhook_events_hook_id_idx').on(table.hookId),
    index('webhook_events_timestamp_idx').on(table.timestamp),
  ],
)
