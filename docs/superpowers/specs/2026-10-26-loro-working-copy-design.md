# Byline: one Loro working copy per article

Date: 2026-10-26
Status: draft, pending approval

## Intent

Byline drafts follow a git-like branch model. Two bugs reported by the LobeHub
team come straight out of it:

1. **The same article shows up several times in the draft inbox.** Opening a
   published article without `?draftId=` makes the first autosave call
   `POST /drafts` with `refId`, and `DraftService.create` always inserts a new
   branch. Publishing never archives the published branch either. After the
   next publish, the old branch's head is an ancestor of the new published
   revision (`relationToPublished: 'descendant'`), and
   `draftChangeKind` maps that to `changed` ("有改动"). A local DB had one
   document with six active branches.
2. **Opening an article without touching it marks it "改动".** Imported
   content (`byline import-mdx`) has no `$.blockId`. On load, haklex
   `BlockIdPlugin` mints block ids and the editor adds fields such as
   `textFormat`. `OnChangePlugin` reports that normalization as a change, so
   `markDirty` runs, the fingerprint differs, and the 10-second autosave
   writes a new revision. Two opens of the same article produced two
   revisions that differ only in random block ids. Separately, the client's
   `typeSpecificData` adds `pin: false` and drops `createdAt`, so the server's
   `sameRevisionContent` never matches the published revision, and even an
   empty Cmd+S writes a new revision.

Byline is multi-user: authors and editors work on the same article at the same
time, and the AI agent edits too. mx-core moved to a single Loro working copy
per document in commit `cfb24a0d2` ("collaborative editing on Loro"). Byline
adopts the same model so both products share one mental model, and the
duplicate-branch bug becomes impossible by construction.

mx-core has its own version of bug 2 (see "mx-core fix" below). This work
fixes both repos.

## Goals

- One article has exactly one working copy: a Loro document plus a linear
  checkpoint timeline with restore and undo. No branches in the UI or the API.
- Authors, editors and the AI edit the same document live. Each sees the
  others' carets, selections and avatars.
- AI writes land in the shared document as their own peer, with an AI caret,
  as in mx-core.
- Opening an article and closing it without an edit leaves it "in sync": no
  Loro ops, no checkpoint that counts as a change, no draft-inbox entry.
- The draft inbox lists each article at most once, and only when the working
  copy holds something the published version does not.
- The same open-without-edit guarantee holds in mx-core.

## Non-goals

- Invite links and guests without an account (mx-core's `CollabJoinPage`,
  `CollaboratorsSection`, `CoauthorEditor`, `content_collaborators` table and
  its migrations 0044/0045). Byline collaboration is for signed-in members only.
- Markdown content. Byline is Lexical only; drop the branch path completely
  instead of keeping mx-core's dual Markdown/Lexical flow.
- Compatibility with the published byline CLI (≤ 0.4.1). The draft API may
  change shape; the in-repo CLI is updated to the new API in the same change,
  and older CLI builds may stop working against the new server.
- mx-core's draft cleanup / storage reclamation and bulk organization pages
  (`draft-cleanup.*`, `draft-organizer.*`, `draft-storage.*`).

## Anti-goals

- A second source of truth. The Loro doc is the draft; revisions are
  checkpoints of it, never edited in parallel.
- Silent loss of unpublished work while collapsing existing branches.
- Any client-only normalization (block ids, default fields) turning into
  stored ops.

## What carries over from mx-core

Treat mx-core `cfb24a0d2` plus later fixes on `master` as the reference
implementation. Port, then fit to byline's module layout, naming and
permission model.

Server (`apps/core/src/modules/draft/` in mx-core):

- `draft-crdt.service.ts`, `draft-crdt.repository.ts`, `draft-crdt.doc.ts`:
  working copy, import, reconcile, checkpoints, restore, undo, history,
  compaction, epoch handling.
- `collab-room.service.ts`, `collab-room.ws.ts`, `collab.service.ts`,
  `collab.controller.ts`, `collab.schema.ts`: room join/leave, `collab.update`
  relay across pods, presence relay, HTTP sync fallback. Strip everything
  about collaborators/invites.
- Gateway changes: admin socket refuses room events before auth, room join
  races (see the "close join races" commit message in `cfb24a0d2`).
- Migration `0043_loro_content_storage.sql` (`content_crdt_docs`,
  `content_crdt_updates`, `content_revisions.frontiers`, `content_revisions.kind`)
  plus later columns mx-core added (`edited_at` on `content_crdt_docs`,
  `crdt_epoch` on `content_documents`). Byline ids are `text` like mx-core's.
- Publish: publishing creates a `publish` checkpoint from the working copy and
  records it as published, so after a publish the working copy's head equals
  the published revision.

Shared package: `@mx-space/editor/loro` (published in `@mx-space/editor`
0.5.0; byline is on 0.4.0) holds `createContentDoc`, `readDocContent`,
`editDocAt`, `vetUpdate` etc. Byline imports it instead of copying.

Admin (`apps/admin/src/features/write/crdt/` and `collab/` in mx-core):
`crdt-draft-session`, `crdt-sync`, `collab-channel`, `collab-presence`,
`use-crdt-draft`, `ready-gate`, `resync-rejected`, `draft-fields`,
`peers-store`, `TimelinePanel`, `PeerAvatars`, `RemoteCarets`, the agent
commit path in `use-write-agent.ts`, and the document-bash tool changes.

Byline already runs an admin WebSocket gateway (`ws` +
`@mx-space/ws-client` 0.2.0, `processors/gateway/admin`). Collab rooms ride
on it; no new transport.

## Byline-specific decisions

- **Who can join a room:** the same rule as editing today,
  `DraftService.assertCanEdit` (document creator, post author, or
  `EditOthersPost`). Checked on join and on every `collab.update`.
- **Title** is a Loro text (`doc.getText('title')`), as in mx-core. Other
  fields (slug, tags, authors, cover, summary, category, meta…) live in
  `meta` / `typeSpecificData` and go through the field-patch path.
  *(Builder's call, following mx-core.)*
- **Existing branches are collapsed by a one-time backfill** run as a release
  step, not lazily on open, so the inbox is right on day one and the inbox
  query never has to handle multi-branch documents. When comparing branch
  heads with the published revision, ignore normalization noise (block ids,
  `textFormat`, `pin: false`, dropped `createdAt`); a head equal to published
  under that comparison counts as published. *(Builder's call.)*
- **Which branch becomes the working copy** (decided): among active branches
  whose head descends from the current published revision *and* differs from
  it after the noise-insensitive comparison, take the most recently updated.
  If none qualifies (or the document was never published, in which case take
  the most recent active branch), build the working copy from the published
  revision. Archive every other active branch. The timeline shows a one-time
  notice "N 条旧草稿已归档，可在历史中查看" for that document.
- **Snapshot write followed by publish** (CLI `posts.revise` / `posts.create`,
  `import-mdx` re-import) (decided): if the working copy is `ahead` of the
  published revision with changes the caller did not write, refuse with a
  clear error and publish nothing. Only when the working copy equals the
  published revision may the CLI write its snapshot and publish it.
- **Snapshot writes** (CLI, api-client, `import-mdx`) mint missing block ids
  before applying, same as import. *(Builder's call.)*
- **`@mx-space/byline-api-client` may break** together with the CLI; bump both.
  `byline import-mdx` (including re-import through `posts.revise`) must keep
  working. *(Builder's call.)*
- **Draft inbox page** stays: clicking an entry opens a detail pane with the
  diff against published, as today. "Delete" on a `fresh` document deletes it;
  on an `ahead` document it becomes "撤销改动": restore the published revision
  as a `restore` checkpoint. `byline draft delete` keeps those semantics.
  *(Builder's call.)*
- **Draft inbox** classifies each document as `fresh` (never published),
  `in_sync`, or `ahead`. Only `fresh` and `ahead` show up. `same` /
  `descendant` / `diverged` and the "behind / 有改动 / 改动" copy go away.
- **Draft list/detail, version tree, branch picker, conflict merge dialog,
  `expectedHeadRevisionId`, `DRAFT_HEAD_CONFLICT`, and the
  `draft.update` "use new version" banner** are removed, replaced by the
  timeline panel and live sync.
- **Share links:** `follow` mode resolves to the latest checkpoint of the
  working copy (mx-core keeps a 10-second idle checkpoint for this).
- **CLI:** `byline draft` / `byline post create` move to the new endpoints.
  The CLI never holds a Loro doc: it writes whole snapshots through a
  server-side endpoint that applies them with `editDocAt` (mx-core's "legacy
  write" path is the model, minus the expected-head contract).

## Fixing "changed on open" (both repos)

1. **Mint block ids once, on the server, at import.** When a working copy is
   created from a revision (`createContentDoc` path), assign a block id to
   every root child that lacks one before binding to Loro. The ids then live in
   the Loro doc, so the client's `BlockIdPlugin` finds nothing to mint and
   produces no op. Ids need not be deterministic: they are stored once.
   Put this in `@mx-space/editor/loro` so both repos get it.
2. **The import checkpoint is not a change.** A document whose head is the
   `import` checkpoint made directly from the published revision, with no
   Loro update or field patch after it, is `in_sync`. In mx-core this means
   `RELATION` in `draft-storage.repository.ts`, `has_changes` in
   `draft-organizer.repository.ts`, and `relationToPublished` from
   `DraftService.hydrate` (dashboard "已发布 · 有改动").
3. **Verify any other client-side normalization stays out of the doc.** After
   1 and 2, open an imported article in the real admin, wait past the idle
   checkpoint, and confirm zero Loro updates were sent and the inbox does not
   list it. If the editor still emits ops (e.g. `textFormat`), fix at the
   source (import-time normalization or a haklex change) rather than by
   filtering on the server.

4. **Repair mx-core docs already imported without block ids** (decided): a
   one-time script rebuilds only Loro docs with no update or field patch since
   their import checkpoint, minting block ids and bumping `crdt_epoch` so open
   clients reload. Docs with edits are left alone.

The `OnChangePlugin` / fingerprint autosave path that causes byline bug 2
disappears with the branch model; it does not need a separate fix.

## Constraints

- Byline deploys on Railway. Migrations run as a release step; keep them
  additive first (new tables/columns), and drop branch-only columns or tables
  only after the new code is live, if at all.
- Byline uses haklex 0.54.x; mx-core is on 0.58.0 with `@haklex/rich-collab-loro`.
  Upgrade byline's haklex packages to the version mx-core uses.
- Follow byline conventions (AGENTS.md): response envelope, error codes,
  permission bits, i18n copy files per feature.

## Acceptance

- Open a published article, edit nothing, leave after 30 s: no draft-inbox
  entry, no new revision other than the import checkpoint, no rows in
  `content_crdt_updates`. Same check in mx-core.
- Open the same article from two accounts: edits and carets appear in both
  within a second; both close; one working copy, one inbox entry.
- Run the AI agent while a human types: the AI's edits land as its own peer
  with an AI caret; human text typed meanwhile is not duplicated.
- Publish, then reopen: inbox shows nothing for that article.
- A document that had several active branches before the migration opens as
  one working copy; the other branches are archived and visible in history.
- `byline draft list/get/update` and `byline post create` work against the new
  server.

## Left to the builder

- Module/file names and how the ported code splits across byline's modules.
- Whether the HTTP sync fallback, compaction threshold and idle-checkpoint
  interval keep mx-core's values.
- Exact new CLI command shapes, as long as the commands above keep working.
- Whether to delete branch-only tables/columns in this change or a later one.
