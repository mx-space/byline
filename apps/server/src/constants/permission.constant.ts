export const UserPermission = {
  EditPost: 1 << 0,
  EditOthersPost: 1 << 1,
  PublishPost: 1 << 2,
  ManageCategories: 1 << 3,
  ManageSettings: 1 << 4,
  ManageUsers: 1 << 5,
  ManageFiles: 1 << 6,
} as const

export type UserPermissionFlag =
  (typeof UserPermission)[keyof typeof UserPermission]

// Every bit of a signed int4 is set so permissions added later are granted to existing users without a backfill.
export const ALL_PERMISSIONS = 0x7fffffff
