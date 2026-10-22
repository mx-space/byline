// Tables users, accounts, sessions, apiKeys, passkeys, verifications intentionally keep camelCase property names for Better Auth drizzle-adapter compatibility.
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { ALL_PERMISSIONS } from '../../constants/permission.constant'
import { createdAt, tsCol, updatedAt } from './columns'

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    email: text('email'),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name'),
    handle: text('handle'),
    username: text('username'),
    displayUsername: text('display_username'),
    image: text('image'),
    bio: text('bio'),
    url: text('url'),
    permissions: integer('permissions').notNull().default(ALL_PERMISSIONS),
    isProfileOnly: boolean('is_profile_only').notNull().default(false),
    deactivatedAt: tsCol('deactivated_at'),
  },
  (table) => [
    uniqueIndex('users_email_uniq')
      .on(table.email)
      .where(sql`${table.email} is not null`),
    uniqueIndex('users_username_uniq')
      .on(table.username)
      .where(sql`${table.username} is not null`),
  ],
)

export const userInvites = pgTable(
  'user_invites',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    tokenHash: text('token_hash').notNull(),
    invitedBy: text('invited_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: tsCol('expires_at').notNull(),
    acceptedAt: tsCol('accepted_at'),
    acceptedUserId: text('accepted_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [
    uniqueIndex('user_invites_token_hash_uniq').on(table.tokenHash),
    index('user_invites_email_idx').on(table.email),
    index('user_invites_user_id_idx').on(table.userId),
  ],
)

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id'),
    providerId: text('provider_id').notNull(),
    providerAccountId: text('provider_account_id'),
    password: text('password'),
    type: text('type'),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: tsCol('access_token_expires_at'),
    refreshTokenExpiresAt: tsCol('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    raw: jsonb('raw').$type<Record<string, unknown> | null>(),
  },
  (table) => [
    uniqueIndex('accounts_provider_uniq').on(
      table.providerId,
      table.providerAccountId,
    ),
    index('accounts_user_id_idx').on(table.userId),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: tsCol('expires_at'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    provider: text('provider'),
  },
  (table) => [
    uniqueIndex('sessions_token_uniq').on(table.token),
    index('sessions_user_id_idx').on(table.userId),
  ],
)

export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    referenceId: text('reference_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    configId: text('config_id'),
    name: text('name'),
    key: text('key').notNull(),
    start: text('start'),
    prefix: text('prefix'),
    enabled: boolean('enabled').notNull().default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').notNull().default(false),
    rateLimitTimeWindow: integer('rate_limit_time_window'),
    rateLimitMax: integer('rate_limit_max'),
    requestCount: integer('request_count').notNull().default(0),
    remaining: integer('remaining'),
    refillInterval: integer('refill_interval'),
    refillAmount: integer('refill_amount'),
    expiresAt: tsCol('expires_at'),
    lastRefillAt: tsCol('last_refill_at'),
    lastRequest: tsCol('last_request'),
    permissions: jsonb('permissions').$type<unknown>(),
    metadata: jsonb('metadata').$type<unknown>(),
  },
  (table) => [
    uniqueIndex('api_keys_key_uniq').on(table.key),
    index('api_keys_user_id_idx').on(table.userId),
  ],
)

export const passkeys = pgTable(
  'passkeys',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name'),
    credentialId: text('credential_id').notNull(),
    publicKey: text('public_key').notNull(),
    counter: integer('counter').notNull().default(0),
    deviceType: text('device_type'),
    backedUp: boolean('backed_up').notNull().default(false),
    transports: text('transports'),
    aaguid: text('aaguid'),
  },
  (table) => [
    uniqueIndex('passkeys_credential_id_uniq').on(table.credentialId),
    index('passkeys_user_id_idx').on(table.userId),
  ],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: tsCol('expires_at').notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

export const deviceCodes = pgTable(
  'device_codes',
  {
    id: text('id').primaryKey().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deviceCode: text('device_code').notNull(),
    userCode: text('user_code').notNull(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    expiresAt: tsCol('expires_at').notNull(),
    status: text('status').notNull(),
    lastPolledAt: tsCol('last_polled_at'),
    pollingInterval: integer('polling_interval'),
    clientId: text('client_id'),
    scope: text('scope'),
  },
  (table) => [
    uniqueIndex('device_codes_device_code_uniq').on(table.deviceCode),
    uniqueIndex('device_codes_user_code_uniq').on(table.userCode),
    index('device_codes_expires_at_idx').on(table.expiresAt),
  ],
)
