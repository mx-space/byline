# Byline: permission bits, v1

Date: 2026-10-23
Status: draft, pending approval

## Intent

Byline ships permission bits in the data model, but nothing enforces them.
Every account gets all bits, the admin cannot change them, and the server only
checks `ManageUsers`. LobeHub is about to invite operations staff and
translators who must not publish on their own; the boss publishes.

v1 makes the bits real: the server checks them and an admin can set them.
Review happens by convention: members without `PublishPost` save drafts and the
boss publishes them.

## Goals

- Every mutating endpoint checks the bit it needs, for sessions and API keys alike.
- An admin sets a member's bits on the user detail page, by picking a preset or ticking bits.
- Actions a member lacks the bit for are hidden or disabled in the admin.

## Non-goals (later)

- A review workflow (submit, pending list, return with reason, locks).
- Notifications of any kind.
- Per-post ownership rules beyond the `EditOthersPost` bit.
- Rules against granting more bits than one holds.

## Bits

Existing, in `apps/server/src/constants/permission.constant.ts`: `EditPost`,
`EditOthersPost`, `PublishPost`, `ManageCategories`, `ManageSettings`,
`ManageUsers`, `ManageFiles`.

New: `EditTranslation`, for editing translations without `EditPost`.

Presets are named bit combinations shown in the admin. They are not stored; a
combination that matches no preset shows as "Custom".

| Preset | Bits |
| --- | --- |
| Owner | all (`ALL_PERMISSIONS`) |
| Editor | EditPost, EditOthersPost, PublishPost, ManageCategories, ManageFiles, EditTranslation |
| Author | EditPost, ManageFiles |
| Translator | EditTranslation |

## Rules

- `@RequirePermissions` plus the existing `PermissionsGuard` on each endpoint.
- API keys act as the user who created them; `AuthGuard` already resolves this.
- "Own post" for `EditPost` without `EditOthersPost`: the member is one of the post's authors or created the draft.
- A member cannot remove `ManageUsers` from themselves.
- Existing accounts keep `ALL_PERMISSIONS`. The migration downgrades nobody.

## Admin UI

Mockups: https://claude.ai/artifact/UwGkYwtVZYCsFmSWNyw7YP (the author picked "方案 B").

- **User detail**: a "权限" card with a role dropdown (the presets, plus "自定义" shown when the bits match none) and the bits as switches in two columns. Picking a role overwrites the switches; a one-line note under the dropdown says what a custom set adds to its nearest preset. Save and cancel at the bottom.
- **Invite dialog**: a role radio list (编辑 / 作者 / 译者, default 作者). Owner is not offered. The invite stores those bits and the accepted account receives them; invites carry no bits today, so this is a schema addition (designer's call).
- **User list**: a role badge per member and a role filter. Custom sets get a dashed badge; profile-only authors show "仅署名" (designer's call).

## Left to the builder

- Which bit each endpoint needs. Publishing, unpublishing and deleting posts need `PublishPost`.
- Error code and status for a missing bit, following the repo's error conventions.
- Copy details and spacing within the admin's existing patterns.
