# Dynamic component authoring and catalog insert

Date: 2026-10-23
Status: approved
Canvas: https://claude.ai/artifact/2pNzvPd8xQvpVR51F8UWzv (row "v2 · Code editing + insert from catalog")

## Why

The admin now has a Dynamic components panel (list, detail with preview, register, edit metadata, delete). Two gaps remain:

1. A registered component's JavaScript can't be seen or changed in the admin. Fixing a component means writing a file somewhere else and uploading it again.
2. The editor ignores the catalog. Typing `/dynamic` opens a form that asks for a module URL, an initial height and a props JSON blob. That's a poor experience, and it's the same form whether or not the component is already registered.

The writers want to edit a component's code and see the result immediately, and want to insert a registered component by choosing it and filling in its parameters.

## Goals

- View and edit a component's JS source in the admin, with a live preview next to the code.
- In the editor, inserting a Dynamic Node first offers the registered components; choosing one leads to a parameter form built from its Props Schema.
- Clicking an inserted Dynamic Node opens the same parameter panel; its back button returns to the picker to switch components.
- Keep the existing URL + JSON form for modules that are not registered.

## Non-goals

- A full JSON Schema form engine. Only the field kinds listed below.
- Usage counts or "used in posts" lists (dropped earlier in this conversation).
- Rewriting posts when a component changes.
- Changes to haklex packages.

## Anti-goals

- The picker must not hide the unregistered path. Writers can still insert any allowed module URL.
- Editing source must not break posts that already use a component without the writer knowing.

## Design

### 1. Source tab (admin, Dynamic components detail)

- The detail panel's tabs become: Preview, Props Schema, Source. They sit at the same level.
- Source is a split view: the Monaco `CodeEditor` (`ui/primitives/code-editor.tsx`, language `javascript`) on the left, a live preview on the right.
- The source is loaded with `fetch(entry.url)`. Entries whose URL is not a Byline-hosted file (the `/objects/` check in `isAllowedDynamicUrl`) show the source read-only, or a "source unavailable" state when the fetch fails (CORS).
- Live preview: 600 ms after the last keystroke, the current buffer is turned into a `blob:` module URL and mounted with `DynamicHostRenderer`. If importing or mounting fails, the preview keeps the last working version and the error is shown under the editor.
- The preview's props come from the same schema-driven form as the editor's insert panel (section 3), seeded from schema defaults.
- Dirty state: "unsaved changes" indicator, Revert, Save, and ⌘S. Leaving the tab or route with unsaved changes asks for confirmation.
- Save uploads the buffer as a new immutable file (`uploadFile(file, 'file', true)`), then `PATCH`es the entry: `url` becomes the new file, `parentUrl` becomes the previous `url`. Posts already using the old URL keep it. Anyone with `EditPost` may save.

### 2. Editor: `/dynamic` opens a picker

- The `/dynamic` slash item still inserts an empty Dynamic Node. In edit mode, an empty node opens the **picker** instead of the URL form.
- Picker: search box (matches name and description), list of registered components (name, description, field count), keyboard navigation (↑↓, Enter, Esc). Esc on a fresh empty node removes it.
- Footer link "Not registered? Enter a URL" switches to the existing URL + height + JSON form.
- Choosing a component sets the node's `url` and `initialHeight` from the catalog entry and `props` from schema defaults, then opens the parameter panel.
- The catalog comes from `GET /dynamic-components`, through the module cache in `vendor/rich-editor/utils/dynamic-catalog.ts`.

### 3. Parameter panel

- Opened after picking, and when clicking an existing Dynamic Node whose URL is in the catalog. For a URL not in the catalog, clicking opens the existing URL + JSON form.
- Header: back arrow to the picker, component name, Form / JSON toggle.
- Form fields are generated from the entry's `propsSchema.properties`:
  - `string` → text input; `string` with `enum` → select
  - `number` / `integer` → number input
  - `boolean` → switch
  - anything else (object, array, unknown) → not shown in the form; the JSON view still edits it
  - `required` fields are marked; `default` is shown as a hint and used as the initial value
  - `description` / `title` on a property, when present, label the field
- Every change updates the node's props right away, so the component in the document re-renders live.
- JSON view edits the whole props object; invalid JSON is not applied and shows an error.
- "Done" or Enter closes the panel.
- The node stores only `{ url, props, initialHeight }`. It does not record a catalog id. The panel finds the entry by URL.

### 4. Implementation notes (verified)

- haklex `DynamicEditNode.decorate` always renders its own `LazyEditRenderer` in edit mode; `rendererConfig` cannot override it. Byline should subclass `DynamicEditNode` in `vendor/rich-editor` with its own `decorate`, and register it in place of the haklex class via Lexical node replacement in `RichEditor.tsx` (where `DynamicEditNode` is listed in `defaultExtraNodes`). Node type and JSON shape stay `dynamic`, so stored content is unchanged.
- `INSERT_DYNAMIC_COMMAND` (haklex `DynamicPlugin`) inserts a node with `{ url, props, initialHeight }`.
- `SlashMenuPlugin` accepts `extraItems`, if per-component slash entries are wanted later. Not part of this design.
- The schema-driven form is shared by the Source tab preview and the editor panel; put it in one component.

## Also in scope: orphan scan bug

`file-reference-usage.repository.ts` (`findReferencedUrls`) does not check `dynamic_components.url` / `parent_url`. A registered component file that no post uses yet is reported as orphaned, and orphan cleanup deletes it. Add `dynamic_components` to that query, with a PostgreSQL test.

## Calls made during review (builder may push back)

- **Which sources are editable.** A component's source is editable whenever `fetch(entry.url)` succeeds, wherever it is hosted (API origin, S3, custom domain). Saving never writes to the original file under option A, so "Byline-hosted" is not needed as a test. Read-only only when the fetch fails.
- **Versions in the picker.** The picker hides any row whose `url` appears as another row's `parentUrl` (it has been superseded). The parameter panel matches a node by `url` first, then by following `parentUrl` links back from current rows; a node on an older version uses the current row's schema and shows an "older version" hint. `isAllowedDynamicUrl` also accepts every `parentUrl` in the catalog, so older-version nodes keep rendering in read-only mode.
- **Agent publish flow.** `publish-dynamic-component.ts` carries the parent entry's `propsSchema` and `description` forward when it registers a revision, instead of `{}` and the name.
- **Closing the panel.** Changes apply live and stay when the panel closes (Done, Enter, Esc, click outside). Esc on a freshly inserted node that has no component picked yet removes the node. Prop edits made while one panel is open merge into one undo step.
- **How the panel opens.** Keep a settings button on the node (as haklex does today) so interactive components still receive clicks in the editor. Selecting a fresh empty node opens the picker automatically.
- **Manual URL form.** Behaviour unchanged: no new URL validation. The existing mismatch (edit mode accepts any URL, read-only mode checks `isAllowedDynamicUrl`) is out of scope.

## Decisions (2026-10-23)

- **Save semantics:** new version (option A). Upload a new immutable file, point the entry at it, keep the old URL as `parentUrl`. Existing posts keep the old version.
- **Version history (after review):** `dynamic_components.previous_urls text[]` (migration 0003, expand-only). Any `PATCH` that changes `url` appends the old URL on the server, so the whole chain survives repeated saves, URL edits in the metadata dialog, and concurrent saves. The orphan scan, the orphan list, `isAllowedDynamicUrl` and `resolveCatalogEntry` all read it.
- **Who may save:** any user with `EditPost`, same as the existing catalog routes. No new permission guard.
- **mx-core:** tracked as a todo in `mx-core/docs/plans/2026-10-23-dynamic-component-authoring.md`.

## Left to the builder

- Exact picker and panel placement (popover anchored to the node is the design intent).
- Debounce tuning, Monaco options, empty and loading states.
- Test split between unit tests (schema → fields mapping, props parsing) and component tests.
