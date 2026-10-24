# AGENTS.md — apps/admin

Guidance for coding agents working in the Byline admin app.

## Project Overview

This is the Byline admin dashboard, a React 19 SPA (package `@mx-space/byline-admin`).
It lives at `apps/admin` and is built into the server release and Docker image; the
sibling app `apps/server` serves the built output. It was derived from mx-core's admin
and pruned to Byline's v1 inventory (see `../../docs/superpowers/specs/2026-10-22-byline-design.md`):
write (editor, publish dialog and dock, AI agent with the dynamic component flow), posts,
drafts, categories, files (including orphan cleanup), AI resources, tasks, webhooks,
settings, auth and setup. Built with Base UI primitives, React Router (HashRouter),
TanStack Query, Sonner, and a Tailwind v4 layer.

Do not reintroduce personal-blog modules (notes, pages, comments, says, recently,
friends, subscriptions, snippets, topics, readers, analytics, backup, and so on).

## Development Commands

Run from the monorepo root (the workspace install is governed by the root) — see
`apps/admin/package.json` scripts, or target the package directly with
`pnpm --filter @mx-space/byline-admin run <script>`.

Scope checks to changed files only — never run lint/typecheck/build over the whole
tree just to verify a small edit. One-off file typecheck:
`pnpm -C apps/admin exec tsc --noEmit --pretty false`.

Env vars live in `apps/admin/.env` (see `apps/admin/.env.example`). `VITE_APP_BASE_API`
is the Byline API endpoint. All vars are optional and fall back to empty/same-origin,
so a build with empty env will not crash.

## Architecture Overview

### Entry & Shell

`main.tsx` → `App.tsx` (mounts providers, `HashRouter`, auth gate, installs theme tokens
via `installThemeTokens`) → admin shell (nav chrome + `SocketBridge` + routes). All views
in `routes.tsx` are `lazy()`-loaded and wrapped in `<Suspense>`; add new pages by
registering a lazy import there. The `checkLogged` auth gate wraps everything except
`/setup`, `/setup-api`, `/login`. Headless UI wrappers live in `apps/admin/src/ui/`.

### API Layer (`apps/admin/src/api/`)

API services use the fetch-based helpers in `apps/admin/src/api/http.ts`.

When using TanStack Query, extract arrays with:
```typescript
select: (res: any) => Array.isArray(res) ? res : res?.data ?? []
```

**Error Classes:**
- `BusinessError` — application-level errors (4xx responses)
- `SystemError` — network/server errors (5xx responses, network failures)

### Responsive Breakpoints

- `phone:` — max-width: 768px
- `tablet:` — max-width: 1023px
- `desktop:` — min-width: 1024px

## Code Style Rules

### Validation

After modifying code, run focused type checking and linting on the changed files only.
Run a production build before reporting completion for broad application changes.

### Typography

Text, surfaces, and borders use `@lobehub/ui` `cssVar` tokens. Do not add Tailwind
utilities (`text-*`, `bg-*`, `text-neutral-*`) or one-off pixel font sizes.

## Color

Surfaces, text, borders, and accents come from `@lobehub/ui` (`cssVar` / `--lobe-color-*`).
Do not reintroduce `apps/admin/src/styles/tokens.css` or the old `--color-surface-*`,
`--color-fg*`, and `--color-accent*` theme.

### Empty state

Import from `~/ui/patterns/EmptyState` for standard "nothing here" surfaces:

```tsx
import { EmptyState } from '~/ui/patterns/EmptyState'

<EmptyState
  icon={Inbox}
  title="No drafts yet"
  description="Drafts you save will appear here."
  action={<Button>Write something</Button>}
/>
```

It wraps `@lobehub/ui`'s `Empty`. Two-line copy (title + helper), optional CTA below.

### Legacy aliases

`--color-primary`, `--color-primary-shallow`, and `--color-primary-deep` are legacy
aliases written by `installThemeTokens()` in `src/theme.ts`. Do not add new references
to them.

### Notes

- Sidebar nav has a right-aligned tabular count column plumbed in the component, but
  the route data model does not yet carry per-route counts. Populate when the model
  surfaces them.

## Layout Conventions

New admin views use `MasterDetailShell` in `apps/admin/src/ui/layout/master-detail-shell.tsx`
for list and detail. Page headers come from `@lobehub/ui/dashboard`.

## Configuration Files

- `apps/admin/vite.config.mts` — Vite + react-compiler + checker; `base` uses
  `VITE_APP_PUBLIC_URL` in production (empty = relative paths, the safe default); the html
  plugin injects `WEB_URL`/`GATEWAY`/`BASE_API` into `window.injectData`
- `apps/admin/src/constants/env.ts` — resolves API/web/gateway URLs (injected env first,
  then `VITE_APP_*`)

## AI Agent Chat (post pi-ai migration)

The AI agent chat surface lives under `apps/admin/src/features/write/components/agent/`
and `apps/admin/src/api/ai-agent.ts`. After the pi-ai migration:

- **Transport** — `apps/admin/src/api/ai-agent.ts` consumes the
  JSON-framed `AiAgentSseEvent` union via the shared TypeBox schema imported
  from the neutral `@mx-space/ai` package
  (`packages/ai/src/ai-agent-sse.ts`). Each SSE line is a single
  `data: <json>\n\n` event — there is no `event:` prefix line. The transport
  parses each frame and dispatches typed events to the session manager.
- **Session manager** — buffers a draft `AssistantMessage` per turn,
  accumulating text/thinking blocks by `contentIndex`. Tool-call blocks are
  ONLY committed on `toolcall_end`; partial `toolcall_delta` is dropped on
  abort or network drop.
- **Multi-block rendering** — `MessageBubble` renders text, thinking, and
  toolcall blocks in monotonic `contentIndex` order. Toolcall events for
  haklex (`insert_node`/`replace_node`) wire back to the lexical editor via
  a callback prop, NOT global state.
- **Network drop** — the transport surfaces a `connection lost` UI without
  crashing. Covered by `apps/admin/src/features/write/components/agent/*.test.tsx`
  (jsdom vitest integration tests + a 50-frame interleaved fixture).
- **Provider config** — `AIProviderDrawer` exposes 3 provider types
  (`OpenAICompatible`, `Anthropic`, `Generic`), with a model `Combobox`
  sourced from `GET /api/ai/registry/models` (10-minute stale, build-hash
  cache key). Unknown legacy localStorage values (`openai`, `openrouter`)
  are rewritten to `openai-compatible` on app boot by
  `apps/admin/src/bootstrap/migrate-legacy-provider-type.ts`. The
  `contextWindow` and `maxTokens` numeric inputs only render when the typed
  model id is NOT in the registry (case-insensitive trim match).

See `apps/server/AGENTS.md` for the server-side wire-format invariants.

## Related Projects

- **apps/server**: the Byline API server (NestJS), the sibling workspace app.
- **haklex**: rich editor packages (`@haklex/*`), consumed as published dependencies.

## Dynamic Component Catalog

`src/vendor/rich-editor/utils/dynamic-catalog.ts` keeps the editor-facing interface
(`DynamicCatalogEntry`, `registerDynamicComponent`, `isAllowedDynamicUrl`, the agent system
message). Storage goes through `src/api/dynamic-components.ts`: `GET /dynamic-components`
returns `{ version, components }`, and `POST /dynamic-components` appends one entry on the
server atomically and returns the updated catalog. Entry `propsSchema` is free-form JSON, so
the module reads responses without the shared deep key camelizing.

### Rich Editor Integration

Rich editor work is integrated as ordinary React components.
