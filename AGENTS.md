# AGENTS.md

This file provides guidance to coding agents working in this repository.

## Project Overview

Byline is a slim, multi-author, AI-native headless CMS built with NestJS, PostgreSQL, and Redis. It is derived from mx-core (Mix Space) but is its own MIT-licensed project. It serves content over an API only; consumers render posts themselves.

- `apps/server/`: the API server.
- `apps/admin/`: the admin SPA (React 19), built into the server release and Docker image.
- `packages/*`: Byline's own packages, published under `@mx-space/byline-*` (for example the api-client).

The approved design lives at `docs/superpowers/specs/2026-10-22-byline-design.md`. Read it before changing scope.

## Scope Rules

- **No consumer-specific code.** Never hardcode a consumer's categories, locales, author lists, or components. Consumer behaviour comes from settings, the dynamic component catalog, or plugin configuration.
- **Personal-blog modules are out of scope.** Do not add comments, notes, says, links, subscriptions, recently, polls, serverless, feeds, topics, snippets, backup, or similar mx-core modules.
- **Shared logic goes through packages.** Logic shared with mx-core (Lexical translation parsing, translation strategies, prompts, the AI engine, LiteXML) is consumed from npm packages that mx-core also uses. Do not copy-paste it into this repo. Shared packages hold pure logic and reach data through adapter interfaces that this repo implements against its own tables.
- **Byline owns its schema.** `@mx-space/db-schema` is not shared; Byline has its own Drizzle schema and migrations.

## Related Projects

- **mx-core**: `../mx-core`, the upstream project Byline was derived from. Its tables and behaviour must not change for Byline's sake.
- **haklex**: `../haklex` (standalone), the rich editor packages (`@haklex/*`). Versions are pinned; after a haklex release, update the pins and the `lexical` overrides in `pnpm-workspace.yaml` together.

### Lexical Content Processing

Posts are stored and served as Lexical JSON. The server uses `@haklex/rich-headless` (zero-React, server-side only) for Lexical processing such as Markdown conversion and AI translation parsing. Consumers render with haklex renderers; Byline ships no rendering package.

Site-specific components are haklex Dynamic Nodes (`@haklex/rich-ext-dynamic`), stored as `{ url, props }`. Prose must stay in native haklex nodes, because the translation parser cannot see inside Dynamic Node `props`.

## Architecture Overview

### Domain

- **Users**: multiple accounts, invite-only, with deactivation that keeps posts and bylines. A user can be profile-only (no credentials). Each user has a `permissions` bitmask (`EDIT_POST`, `EDIT_OTHERS_POST`, `MANAGE_SETTINGS`, `MANAGE_USERS`, ...). v1 grants every bit and does not enforce it, but enforcement must later be addable without a schema change.
- **Posts**: `authors` is an ordered list of user ids, and the order is the byline order. A new post's author defaults to the current user. Posts keep drafts, the revision tree, publish jobs with AI resources, and translations. Responses expand `authors` into profiles.
- **Translations**: read via `?lang=`. Regional locales (`zh-CN`, `zh-TW`, `pt-BR`) are distinct targets. Imported translations carry a locked flag, and publish-time AI translation skips locked locales unless regeneration is requested.
- **Categories**: managed in admin, never an enum.

### Key Architectural Patterns

**API Route Prefix**: The `@ApiController()` decorator adds `/api/v{version}` prefix in production but no prefix in development.

**Processors**: Infrastructure services organized in `processors/`:
- `database/`: PostgreSQL connection (Drizzle ORM), repository registry, base repository class
- `redis/`: Redis caching, pub/sub, task queue and AI locks (Redis is required)
- `gateway/`: WebSocket gateways for real-time features
- `helper/`: Utility services (email, image, JWT, Lexical, etc.)

**Database**: PostgreSQL 16+ with Drizzle ORM. Schema definitions in `src/database/schema/`. Drizzle SQL migrations in `src/database/migrations/`. IDs are Snowflake `bigint`, serialized as strings at API boundaries. Repositories extend `BaseRepository` and are registered via `repository.tokens.ts`.

**Authentication**: Better Auth-based session management with decorators `@Auth()` for route protection and `@CurrentUser()` for accessing the authenticated user. Supports password, OAuth, Passkey, and API key (`x-api-key` header).

## API Response Rules

Every successful JSON response has the shape `{ data, meta? }`. Every error has the shape `{ error: { code, message, details? } }`. The post endpoints must keep mx-core's contract (envelope, LiteXML round-trip, `post create/get/update/publish` semantics) so that `mxs` keeps working.

**Success envelope**: `ResponseInterceptor` (global `APP_INTERCEPTOR`) wraps controller return values:
- A bare value `T` → `{ data: T }`
- A value produced via `withMeta(data, meta)` (from `~/common/response/envelope.types`) → emitted as `{ data, meta }`. Detection is by an internal `Symbol`, **not** by the presence of a `data` key. Returning a literal `{ data, ... }` will be double-wrapped. CI enforces this via `scripts/check-controller-response-envelope.ts`.
- `undefined` → `204 No Content`

**Error envelope**: `AppExceptionFilter` (global `APP_FILTER`) maps every thrown error:
- `AppException` (and subclasses) → `{ error: { code, message, details? } }` at the exception's HTTP status
- `ZodError` → 400 `VALIDATION_FAILED` with `details.issues`
- Other `HttpException` → `{ error: { code: 'HTTP_ERROR', message } }`
- Unknown errors → 500 `INTERNAL_ERROR`

**Exceptions**: extend `AppException` with a stable code:
```ts
throw new BizException(ErrorCodeEnum.PostNotFound)    // code: 'PostNotFound', 404
throw new CannotFindException()                        // code: 'NOT_FOUND', 404
throw new NoContentCanBeModifiedException()            // code: 'NO_CONTENT_MODIFIABLE', 400
```

**Meta**: use `MetaObjectBuilder` for cross-cutting per-request data (pagination, translation, enrichment). Located in `src/common/response/meta-builder.ts`.

**Named views**: field selection uses `*.views.ts` Zod schemas (e.g. `PostViews.card`, `PostViews.detail`) instead of a `?select=` parameter. Views are parsed at the controller layer.

**Case conversion**: code is camelCase end to end (Drizzle column TS props, Zod DTOs, services). The `RequestCaseNormalizationPipe` (global, runs before the Zod validation pipe) folds incoming request keys to camelCase: query and path params are camelized recursively; request bodies are camelized **only at the top level** so freeform JSON values (`meta`, AI agent `messages`, Dynamic Node `props`) survive verbatim. Both `?sort_by=` and `?sortBy=` reach the controller as `sortBy`. `ResponseInterceptor` converts the response `data`/`meta` back to snake_case at the wire boundary (`transformResponseCase` in `src/common/response/case-transform.ts`); the wire format stays snake_case. DB column names keep their explicit snake_case name strings. Never call a manual `snakeCaseKeys`-style helper in a controller.

**`@BypassCaseTransform([paths])`**: opt a field subtree out of snake_case conversion (free-form JSON columns). Paths root at `data`, dotted segments, `[]` marks an array level (e.g. `'items[].rawPayload'`). Located in `src/common/decorators/bypass-case-transform.decorator.ts`.

**`@HTTPDecorators.RawResponse`**: opt out of the whole envelope and casing pipeline for non-JSON responses (streams, HTML, redirects). Located in `src/common/decorators/http.decorator.ts`.

**Writing a new endpoint:**
1. Return `<value>` for a bare envelope, or `withMeta(<value>, new MetaObjectBuilder()...build())` for `{ data, meta }`. Never return an object literal whose top-level keys include `data`.
2. Throw `AppException` subclasses (or `BizException` with an `ErrorCodeEnum` code) for errors.
3. Use `@HTTPDecorators.RawResponse` only if the response is not JSON.
4. Define or reuse a view in `<resource>.views.ts` and parse through it before returning.

## Testing

Vitest with PostgreSQL testcontainers (`@testcontainers/postgresql`) and Redis memory server. Fresh installs on machines where the Redis binary download fails need `REDISMS_DISABLE_POSTINSTALL=1`.

## Database Migrations

Migrations use Drizzle Kit. SQL migration files live in `apps/server/src/database/migrations/`.

**Release-phase migration**: schema migrations run as a one-shot pre-deploy step, NOT on app startup. The app boot guard (`assertSchemaCurrent` in `processors/database/postgres.provider.ts`) refuses to start if the schema is behind. Run via `pnpm migrate` (or `pnpm -C apps/server run migrate`) locally, or via the migrate service in compose.

Migrations must follow expand-contract, because rolling deploys run old and new pods side by side during cutover:
- A migration must stay compatible with the previous release's code.
- Drop, rename, and type changes are staged across releases: expand now, contract in a follow-up release.
- Indexes on large tables use `CREATE INDEX CONCURRENTLY`, outside Drizzle's default transaction.

## Configuration

Configuration via `apps/server/src/app.config.ts` supports environment variables, command line arguments, and YAML configuration files.

## Conventions

- Default to zero comments. Add one only for unexpected behaviour (workarounds, quirks, races) or a non-obvious design constraint.
- Only lint and typecheck the packages you touched.

<!-- lobe-design:begin · managed by scripts/bootstrap.mjs · 不要手动编辑本块 -->
<!-- lobe-design:mode=compact lang=en -->
## UI design guide (lobe-design · compact)

UI work (new pages, interaction, visuals, design-system cleanup, screenshot restore, pre-launch review) goes through **lobe-design**: `https://github.com/lobehub/lobe-design-skill` (skill version 5.8.0).

```bash
export LOBE_DESIGN="./.agents/skills/lobe-design"   # global install: ${HOME}/.claude/skills/lobe-design
```

- **Entry**: read `$LOBE_DESIGN/SKILL.md`; run `node "$LOBE_DESIGN/scripts/route.mjs" "<request verbatim>"` first, then enter one stage at a time and load only what it lists.
- **Read the project layer first**: `.agents/ux/product.md` (platform and applicability), `.agents/ux/components.md` (which component to use); run 05-init to create any missing one.
- **Platform: web**: atoms come from `@lobehub/ui`; styles are StyleX (`stylex.create`) with values from `@lobehub/ui/stylex/cssVar.stylex` and `media.stylex`. Rules: `.agents/ux/lobe-design-rules.md` §6.
- **Precedence**: platform and applicability in `product.md` (rules marked not applicable, platform-scoped rules) override the skill's generic rules; other conflicts follow the skill. A project rule that contradicts a universal principle (accessibility, P-xx archetypes) must state its reason.
- **After code changes**: run `node "$LOBE_DESIGN/scripts/lint-lobe.mjs" <changed paths>` (rule set follows the platform in product.md); every FAIL must be fixed.
- **Record corrections**: in `.agents/ux/lobe-design-rules.md`; criteria, layering and upstreaming are in `$LOBE_DESIGN/learnings/README.md` and `$LOBE_DESIGN/CONTRIBUTING.md`.
- **After install or upgrade**: run 05-init (two rounds); `node "$LOBE_DESIGN/scripts/project-scan.mjs" --check` reports a missing or stale project layer.

> Managed by `$LOBE_DESIGN/scripts/bootstrap.mjs`; rerun to update. Pass `--full` for the detailed (Chinese) version with self-iteration and upstreaming rules.
<!-- lobe-design:end -->
