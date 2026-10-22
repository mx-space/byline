import { z } from 'zod'

const zDate = z.date().or(z.string())

const PublicProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  url: z.string().nullable(),
})

const AuthorSchema = PublicProfileSchema.extend({
  username: z.string().nullable(),
}).strip()

const UserDetailSchema = PublicProfileSchema.extend({
  email: z.string().nullable(),
  username: z.string().nullable(),
  permissions: z.number().int(),
  isProfileOnly: z.boolean(),
  deactivatedAt: zDate.nullable(),
  createdAt: zDate,
  updatedAt: zDate.nullable(),
  lastLoginAt: zDate.nullable().optional(),
})

const InviteSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string().nullable(),
  invitedBy: z.string().nullable(),
  userId: z.string().nullable(),
  expiresAt: zDate,
  acceptedAt: zDate.nullable(),
  createdAt: zDate,
})

const CreatedInviteSchema = InviteSchema.extend({
  token: z.string(),
  acceptUrl: z.string(),
  emailQueued: z.boolean(),
})

const PublicInviteSchema = z.object({
  email: z.string(),
  displayName: z.string().nullable(),
  expiresAt: zDate,
})

export const UserViews = {
  publicProfile: PublicProfileSchema,
  author: AuthorSchema,
  detail: UserDetailSchema,
  invite: InviteSchema,
  createdInvite: CreatedInviteSchema,
  publicInvite: PublicInviteSchema,
} as const

export type UserView = keyof typeof UserViews
