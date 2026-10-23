import { describe, expect, it } from 'vitest'

import {
  ALL_PERMISSIONS,
  applyPermissionRole,
  describeCustomPermissions,
  hasPermission,
  matchPermissionRole,
  Permission,
  PERMISSION_ROLES,
  togglePermission,
} from './permissions'

describe('permission roles', () => {
  it('names the preset a mask equals, otherwise custom', () => {
    expect(matchPermissionRole(ALL_PERMISSIONS)).toBe('owner')
    expect(matchPermissionRole(PERMISSION_ROLES.author)).toBe('author')
    expect(
      matchPermissionRole(PERMISSION_ROLES.author | Permission.EditOthersPost),
    ).toBe('custom')
  })

  it('checks and toggles single bits', () => {
    const mask = togglePermission(
      PERMISSION_ROLES.author,
      Permission.EditOthersPost,
    )
    expect(hasPermission(mask, Permission.EditOthersPost)).toBe(true)
    expect(
      hasPermission(
        togglePermission(mask, Permission.EditOthersPost),
        Permission.EditOthersPost,
      ),
    ).toBe(false)
    expect(hasPermission(ALL_PERMISSIONS, Permission.ManageUsers)).toBe(true)
    expect(hasPermission(undefined, Permission.EditPost)).toBe(false)
  })

  it('turns owner into the known bits when one is switched off', () => {
    const mask = togglePermission(ALL_PERMISSIONS, Permission.ManageSettings)
    expect(hasPermission(mask, Permission.ManageSettings)).toBe(false)
    expect(hasPermission(mask, Permission.ManageUsers)).toBe(true)
    expect(mask).toBeLessThan(1 << 8)
  })

  it('explains a custom set as its nearest preset plus extra bits', () => {
    expect(
      describeCustomPermissions(
        PERMISSION_ROLES.author | Permission.EditOthersPost,
      ),
    ).toEqual({ base: 'author', added: [Permission.EditOthersPost] })
    expect(describeCustomPermissions(Permission.ManageSettings)).toEqual({
      base: null,
      added: [Permission.ManageSettings],
    })
  })

  it('gives the owner mask back when every bit is switched on again', () => {
    const off = togglePermission(ALL_PERMISSIONS, Permission.ManageSettings)
    expect(togglePermission(off, Permission.ManageSettings)).toBe(
      ALL_PERMISSIONS,
    )
  })

  it('keeps Manage users when members pick a role for themselves', () => {
    expect(applyPermissionRole('editor', { isSelf: true })).toBe(
      PERMISSION_ROLES.editor | Permission.ManageUsers,
    )
    expect(applyPermissionRole('editor', { isSelf: false })).toBe(
      PERMISSION_ROLES.editor,
    )
  })
})
