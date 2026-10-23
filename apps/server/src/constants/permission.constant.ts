export const UserPermission = {
  EditPost: 1 << 0,
  EditOthersPost: 1 << 1,
  PublishPost: 1 << 2,
  ManageCategories: 1 << 3,
  ManageSettings: 1 << 4,
  ManageUsers: 1 << 5,
  ManageFiles: 1 << 6,
  EditTranslation: 1 << 7,
} as const

export type UserPermissionFlag =
  (typeof UserPermission)[keyof typeof UserPermission]

// Every bit of a signed int4 is set so permissions added later are granted to existing users without a backfill.
export const ALL_PERMISSIONS = 0x7fffffff

export const PERMISSION_PRESETS = {
  owner: ALL_PERMISSIONS,
  editor:
    UserPermission.EditPost |
    UserPermission.EditOthersPost |
    UserPermission.PublishPost |
    UserPermission.ManageCategories |
    UserPermission.ManageFiles |
    UserPermission.EditTranslation,
  author: UserPermission.EditPost | UserPermission.ManageFiles,
  translator: UserPermission.EditTranslation,
} as const

export type PermissionPreset = keyof typeof PERMISSION_PRESETS

export function matchPermissionPreset(mask: number): PermissionPreset | null {
  for (const [name, value] of Object.entries(PERMISSION_PRESETS)) {
    if (value === mask) return name as PermissionPreset
  }
  return null
}
