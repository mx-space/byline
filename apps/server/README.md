# @mx-space/byline-server

The Byline API server: NestJS on PostgreSQL 16+ and Redis. It serves posts as Lexical JSON plus metadata over a `{ data, meta? }` envelope; consumers render posts themselves. See the repository root `README.md` and `docs/superpowers/specs/2026-10-22-byline-design.md` for scope.

## Development

```sh
REDISMS_DISABLE_POSTINSTALL=1 pnpm install
PG_URL=postgres://byline:byline@127.0.0.1:5432/byline pnpm -C apps/server dev
```

In development routes have no `/api/v{n}` prefix, so `GET http://localhost:2333/health` answers directly.

## Database

- Drizzle schema: `src/database/schema/`.
- SQL migrations: `src/database/migrations/` (generate with `pnpm -C apps/server exec drizzle-kit generate`).
- Migrations run as a release-phase step (`pnpm -C apps/server migrate`, or `node migrate.mjs` in the image). The server refuses to boot when the schema is behind.
- `pnpm -C apps/server lint:migrations` enforces expand-contract for every migration after `0000`.

## Tests

```sh
pnpm -C apps/server test -- run
```

The suite starts a PostgreSQL testcontainer and an in-memory Redis, so Docker must be running.
