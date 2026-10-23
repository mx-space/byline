import type { TranslationKey } from '~/i18n/types'

export const Permission = {
  EditPost: 1 << 0,
  EditOthersPost: 1 << 1,
  PublishPost: 1 << 2,
  ManageCategories: 1 << 3,
  ManageSettings: 1 << 4,
  ManageUsers: 1 << 5,
  ManageFiles: 1 << 6,
  EditTranslation: 1 << 7,
} as const

export type PermissionBit = (typeof Permission)[keyof typeof Permission]

export const ALL_PERMISSIONS = 0x7fffffff

const KNOWN_PERMISSIONS = Object.values(Permission).reduce(
  (mask, bit) => mask | bit,
  0,
)

export const PERMISSION_ROLES = {
  owner: ALL_PERMISSIONS,
  editor:
    Permission.EditPost |
    Permission.EditOthersPost |
    Permission.PublishPost |
    Permission.ManageCategories |
    Permission.ManageFiles |
    Permission.EditTranslation,
  author: Permission.EditPost | Permission.ManageFiles,
  translator: Permission.EditTranslation,
} as const

export type PermissionRole = keyof typeof PERMISSION_ROLES
export type PermissionRoleOrCustom = PermissionRole | 'custom'

export const INVITABLE_ROLES = ['editor', 'author', 'translator'] as const

export type InvitableRole = (typeof INVITABLE_ROLES)[number]

export const ROLE_LABEL_KEYS: Record<PermissionRoleOrCustom, TranslationKey> = {
  author: 'users.role.author',
  custom: 'users.role.custom',
  editor: 'users.role.editor',
  owner: 'users.role.owner',
  translator: 'users.role.translator',
}

export const ROLE_DESCRIPTION_KEYS: Record<PermissionRole, TranslationKey> = {
  author: 'users.role.author.description',
  editor: 'users.role.editor.description',
  owner: 'users.role.owner.description',
  translator: 'users.role.translator.description',
}

export const PERMISSION_FIELDS: {
  bit: PermissionBit
  description: TranslationKey
  label: TranslationKey
}[] = [
  {
    bit: Permission.EditPost,
    description: 'users.permission.editPost.description',
    label: 'users.permission.editPost',
  },
  {
    bit: Permission.ManageCategories,
    description: 'users.permission.manageCategories.description',
    label: 'users.permission.manageCategories',
  },
  {
    bit: Permission.EditOthersPost,
    description: 'users.permission.editOthersPost.description',
    label: 'users.permission.editOthersPost',
  },
  {
    bit: Permission.ManageFiles,
    description: 'users.permission.manageFiles.description',
    label: 'users.permission.manageFiles',
  },
  {
    bit: Permission.PublishPost,
    description: 'users.permission.publishPost.description',
    label: 'users.permission.publishPost',
  },
  {
    bit: Permission.ManageSettings,
    description: 'users.permission.manageSettings.description',
    label: 'users.permission.manageSettings',
  },
  {
    bit: Permission.EditTranslation,
    description: 'users.permission.editTranslation.description',
    label: 'users.permission.editTranslation',
  },
  {
    bit: Permission.ManageUsers,
    description: 'users.permission.manageUsers.description',
    label: 'users.permission.manageUsers',
  },
]

export function hasPermission(
  mask: number | null | undefined,
  bit: PermissionBit,
) {
  return ((mask ?? 0) & bit) === bit
}

export function togglePermission(mask: number, bit: PermissionBit) {
  const known = mask === ALL_PERMISSIONS ? KNOWN_PERMISSIONS : mask
  const next = known ^ bit
  return next === KNOWN_PERMISSIONS ? ALL_PERMISSIONS : next
}

export function applyPermissionRole(
  role: PermissionRole,
  options: { isSelf: boolean },
) {
  const mask = PERMISSION_ROLES[role]
  return options.isSelf ? mask | Permission.ManageUsers : mask
}

export function matchPermissionRole(mask: number): PermissionRoleOrCustom {
  for (const [role, value] of Object.entries(PERMISSION_ROLES)) {
    if (value === mask) return role as PermissionRole
  }
  return 'custom'
}

export function describeCustomPermissions(mask: number): {
  added: PermissionBit[]
  base: PermissionRole | null
} {
  let base: PermissionRole | null = null
  let baseSize = 0
  for (const [role, value] of Object.entries(PERMISSION_ROLES)) {
    if (value === ALL_PERMISSIONS || (value & mask) !== value) continue
    const size = bitsOf(value).length
    if (size > baseSize) {
      base = role as PermissionRole
      baseSize = size
    }
  }
  const covered = base ? PERMISSION_ROLES[base] : 0
  return { added: bitsOf(mask & ~covered), base }
}

function bitsOf(mask: number): PermissionBit[] {
  return Object.values(Permission).filter((bit) => (mask & bit) === bit)
}
