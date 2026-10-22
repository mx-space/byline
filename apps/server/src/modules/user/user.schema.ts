import { z } from 'zod'

import { zAllowedUrl, zPaginationPage } from '~/common/zod'

const zUsername = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\w.-]+$/, 'Username may only contain letters, digits, _ . -')
  .transform((value) => value.toLowerCase())

const zOptionalText = (max: number) =>
  z
    .preprocess(
      (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
      z.string().trim().max(max).nullable(),
    )
    .optional()

const zOptionalUrl = z
  .preprocess((val) => (val === '' ? null : val), zAllowedUrl.nullable())
  .optional()

export const UserProfileFieldsSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  avatar: zOptionalUrl,
  bio: zOptionalText(2000),
  url: zOptionalUrl,
})

export const UpdateUserSchema = UserProfileFieldsSchema.extend({
  email: z
    .preprocess((val) => (val === '' ? null : val), z.email().nullable())
    .optional(),
  username: zUsername.optional(),
})

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>

export const CreateProfileOnlyUserSchema = UserProfileFieldsSchema.extend({
  displayName: z.string().trim().min(1).max(120),
  email: z.email().optional(),
  username: zUsername.optional(),
})

export type CreateProfileOnlyUserDto = z.infer<
  typeof CreateProfileOnlyUserSchema
>

export const UserListQuerySchema = z.object({
  page: zPaginationPage,
  size: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'deactivated', 'profile_only']).optional(),
})

export type UserListQueryDto = z.infer<typeof UserListQuerySchema>

export const AuthorListQuerySchema = z.object({
  page: zPaginationPage,
  size: z.coerce.number().int().positive().max(100).default(20),
})

export type AuthorListQueryDto = z.infer<typeof AuthorListQuerySchema>

export const AuthorIdentitySchema = z.object({
  idOrUsername: z.string().trim().min(1).max(64),
})

export type AuthorIdentityDto = z.infer<typeof AuthorIdentitySchema>

export const CreateInviteSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().min(1).max(120).optional(),
})

export type CreateInviteDto = z.infer<typeof CreateInviteSchema>

export const InviteExistingUserSchema = z.object({
  email: z.email().optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
})

export type InviteExistingUserDto = z.infer<typeof InviteExistingUserSchema>

export const InviteTokenSchema = z.object({
  token: z.string().min(16).max(256),
})

export type InviteTokenDto = z.infer<typeof InviteTokenSchema>

export const AcceptInviteSchema = z.object({
  username: zUsername,
  password: z.string().min(8).max(256),
  displayName: z.string().trim().min(1).max(120).optional(),
})

export type AcceptInviteDto = z.infer<typeof AcceptInviteSchema>

export const CreateFirstUserSchema = z.object({
  username: zUsername,
  password: z.string().min(1),
  mail: z.string().trim().pipe(z.email()),
  name: z.string().trim().min(1).optional(),
  url: zAllowedUrl.optional(),
  avatar: zAllowedUrl.optional(),
  bio: z.string().trim().optional(),
})

export type CreateFirstUserDto = z.infer<typeof CreateFirstUserSchema>
