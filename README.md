# Byline

A slim, multi-author, AI-native headless CMS for product sites and landing-page blogs. Byline is derived from [Mix Space](https://github.com/mx-space/core) and keeps its editor and AI tooling. It drops the personal-blog features.

## What it is

- **API-only, headless.** Byline does not render your site. Consumers fetch posts as Lexical JSON plus metadata and render them with [haklex](https://github.com/Innei/haklex) on their side.
- **Multi-author.** Every writer has their own account. A post carries an ordered `authors` list, and responses expand it into author profiles (display name, avatar, bio, URL). Accounts are invite-only, and authors who only need a byline can exist as profiles without login credentials.
- **WYSIWYG editing.** The admin's Lexical editor is the preview. Site-specific components plug in as haklex Dynamic Nodes, so the CMS stays unaware of what they are.
- **AI built in.** Writing assistance, translation into configurable target languages, summaries, insights, and TTS, all runnable on publish.
- **Webhooks.** Consumers can revalidate their pages when a post is published.
- **Docker deployment.** One image ships the API server and the admin SPA, backed by PostgreSQL and Redis.
- **`mxs` compatible.** The [`@mx-space/cli`](https://www.npmjs.com/package/@mx-space/cli) works against Byline through a profile.

## Quick start with Docker Compose

Requirements: Docker with Compose v2.

1. Build the image. Set `BYLINE_IMAGE` to use another tag; extra arguments go to `docker build`.

   ```sh
   ./scripts/docker-build.sh            # tags byline:latest
   ```

2. Start the stack. `JWT_SECRET` is required. It signs sessions and tokens, so keep it stable across restarts.

   ```sh
   export JWT_SECRET="$(openssl rand -hex 32)"
   docker compose up -d
   ```

   Compose starts PostgreSQL 16 and Redis. Then the one-shot `migrate` service applies the database migrations and exits, and the `byline` service starts on port 2333.

3. Check that it is up:

   ```sh
   curl http://localhost:2333/api/v3/health     # {"data":{"ok":true}}
   ```

4. Open `http://localhost:2333/admin/` and finish the setup wizard (see [First user](#first-user)).

To stop the stack, run `docker compose down`. Data lives in the named volumes `byline-data`, `postgres-data` and `redis-data`. Add `-v` to remove them as well.

### Running the image without Compose

The image migrates on boot unless `BYLINE_AUTO_MIGRATE=false`. Migrations hold a PostgreSQL advisory lock, so several replicas starting together are safe.

```sh
docker run -d -p 2333:2333 \
  -e JWT_SECRET=... -e SNOWFLAKE_WORKER_ID=1 \
  -e PG_URL=postgres://byline:byline@db:5432/byline \
  -e REDIS_URL=redis://redis:6379 \
  -v byline-data:/root/.byline \
  byline:latest
```

Run `docker run --rm ... byline:latest node migrate.mjs` to migrate as a separate release step.

## Configuration

The server reads environment variables. Each one also has a command-line flag (`--pg_host`, `--allowed_origins` and so on), and `--config <file>` loads the same keys from a YAML file.

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | none (required in production) | Secret for sessions and signed tokens. Use 32 or more random characters. |
| `SNOWFLAKE_WORKER_ID` | `0` in development, required in production | Worker id for Snowflake ids, an integer from 0 to 1023. Every process that writes to the same database needs its own id. |
| `PORT` | `2333` | HTTP port. |
| `PG_URL` / `PG_CONNECTION_STRING` | none | PostgreSQL connection string. Overrides the `PG_*` fields below. |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | `127.0.0.1`, `5432`, `mx`, `mx`, `byline` | PostgreSQL connection fields. PostgreSQL 16 or newer is required. |
| `PG_SSL`, `PG_MAX_POOL_SIZE` | `false`, `20` | TLS and pool size. |
| `REDIS_URL` / `REDIS_CONNECTION_STRING` | none | Redis connection string, for example `redis://:password@host:6379/0`. |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | `localhost`, `6379`, none | Redis connection fields. Redis is required. |
| `ALLOWED_ORIGINS` | empty | Comma-separated browser origins (hosts, `*` wildcards allowed) that may call the API cross-origin with credentials, for example `example.com,*.example.com,localhost:*`. Same-origin requests are always allowed. Server-side consumers do not need an entry. |
| `TRUST_PROXY` | `1` | Number of reverse-proxy hops to trust for the client IP, or a comma-separated list of proxy addresses. |
| `ENCRYPT_ENABLE`, `ENCRYPT_KEY` | `false`, none | Encrypt secrets stored in settings (API keys and the like). The key must be 64 hex characters (`openssl rand -hex 32`) and must never change afterwards. |
| `THROTTLE_TTL`, `THROTTLE_LIMIT` | `10`, `100` | Per-IP rate limit window (seconds) and request count. |
| `CDN_CACHE_HEADER`, `FORCE_CACHE_HEADER` | `true`, `false` | Emit `s-maxage` and `max-age` cache headers on cacheable GET responses. |
| `ADMIN_ASSET_DIR` | `./admin` next to the server bundle | Directory holding the built admin SPA. |
| `BYLINE_AUTO_MIGRATE` | `true` | Docker image only: run migrations before starting the server. |

Compose adds `BYLINE_IMAGE` (image tag), `BYLINE_PORT` (published port) and `TZ`.

Everything else, such as site URLs, AI providers, mail, storage, OAuth and Passkey, is configured in the admin under **Settings**.

## First user

Byline has no open sign-up. A fresh database has no users, and the server exposes the one-time setup endpoints until the first user exists.

- **In the admin:** open `/admin/`. The setup wizard asks for the site URLs and then creates the first account.
- **Over the API:** `POST /api/v3/init/user` with `{ "username", "password", "mail", "name?", "url?", "avatar?", "bio?" }`. Set the site URLs first with `PATCH /api/v3/init/configs/url` (`{ "web_url", "server_url", "admin_url", "ws_url" }`). Invite links, password-reset mails and login redirects are built from them. Once a user exists, the setup endpoints are closed.

Everyone after that joins by invitation, from the admin's user list or with `POST /api/v3/users/invites` with `{ "email", "display_name?" }`. The invitee opens the accept link (`<admin_url>/#/invite/<token>`) and picks a username and password. Authors who only need a byline can be added as profile-only users that can never sign in (`POST /api/v3/users/profile-only`).

## Consuming the API

In production every route is under `/api/v3`. Responses use one envelope: `{ "data": ..., "meta"?: ... }` on success and `{ "error": { "code", "message", "details"? } }` on failure. Keys on the wire are `snake_case`, and ids are strings.

```sh
curl 'https://cms.example.com/api/v3/posts?page=1&size=10'
curl 'https://cms.example.com/api/v3/posts?author_id=<user id>'
curl 'https://cms.example.com/api/v3/posts/<category slug>/<post slug>'
curl 'https://cms.example.com/api/v3/posts/<post id>'
```

List responses carry `meta.pagination` (`page`, `size`, `total`, `total_pages`).

A post includes:

- `content`: the post body as a serialized Lexical editor state (`content_format` is always `lexical`). Parse it and render it with haklex, for example `@haklex/rich-editor/static` in React. Site-specific blocks are haklex Dynamic Nodes that store `{ url, props }`. Mount the ES module at `url` the same way the editor does. The catalog of registered components is public at `GET /api/v3/dynamic-components`.
- `authors`: profiles in byline order, each `{ id, display_name, avatar, bio, url }`.
- `title`, `slug`, `summary`, `tags`, `category`, `image` (cover URL), `seo` (`{ title, description, image }`), `source_lang`, `pin_at`, `created_at` and `modified_at`.

### Translations

Pass `?lang=<code>` (or the `x-lang` header, or `Accept-Language`) to read a translation. Regional codes stay distinct: `zh-CN`, `zh-TW` and `pt-BR` are separate languages. When a translation exists, the response carries the translated title, content and summary, and `meta.translation` describes it. Without one, the source-language post is returned. The site's default source language is the `site.default_source_lang` setting, and each post can override it with `source_lang`.

### Authenticated calls

Write endpoints need a session or an API key. Create one in the admin under **Settings → Account → API Token** and send it as `x-api-key: <key>`. The [`mxs`](https://www.npmjs.com/package/@mx-space/cli) CLI uses the same keys.

## Webhooks

Webhooks let a consumer revalidate its pages when content changes. Add one on the admin's **Webhooks** page, or `POST /api/v3/webhooks` with `{ "payload_url", "events", "enabled", "secret", "scope" }`. Use `["all"]` to receive every event.

Byline sends each event as a JSON `POST` with these headers:

| Header | Value |
| --- | --- |
| `X-Webhook-Event` | Event name, for example `post.create`, `post.update`, `post.delete`, `post.unpublish`, `post.republish`, `category.update`, `translation.create`, `translation.update` or `summary.generated`. Saving a webhook sends a `health_check` event. |
| `X-Webhook-Signature256` | Hex HMAC-SHA256 of the raw body, keyed with the webhook's secret. |
| `X-Webhook-Signature` | Hex HMAC-SHA1 of the raw body (legacy). |
| `X-Webhook-Id`, `X-Webhook-Timestamp`, `X-Webhook-Source` | Webhook id, send time in milliseconds, and the event source. |

Verify a delivery before acting on it:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
const received = request.headers.get('x-webhook-signature256') ?? ''
const valid =
  received.length === expected.length &&
  timingSafeEqual(Buffer.from(received), Buffer.from(expected))
```

Targets must resolve to public addresses. Deliveries to private or loopback addresses are blocked and logged. Every delivery and its response are kept in the webhook's event log, where they can be replayed.

## Repository layout

| Path | Contents |
| --- | --- |
| `apps/server` | NestJS API server (PostgreSQL via Drizzle, Redis) |
| `apps/admin` | React admin SPA, bundled into the server image and served at `/admin/` |
| `packages/*` | Packages published under `@mx-space/byline-*` |
| `docs/` | Design notes and specs |

## Development

Requirements: Node.js 26 or newer, pnpm 12, PostgreSQL 16 or newer, Redis.

```sh
pnpm install
pnpm migrate      # apply database migrations
pnpm dev          # API server on :2333, routes without the /api/v3 prefix
pnpm dev:admin    # admin dev server on :9528
```

## CI and releases

`.github/workflows/ci.yml` runs lint, typecheck, the envelope and `validate: false` checks, the migration linter and every test suite on pushes and pull requests to `main`.

### Server image

Pushing a `v*` tag runs `.github/workflows/release.yml`, which builds `linux/amd64` and `linux/arm64` images, pushes them to Docker Hub as `innei/byline` (semver tags plus `latest` for stable versions) and creates a GitHub Release. It needs two repository secrets:

| Secret | Used for |
| --- | --- |
| `DOCKERHUB_USERNAME` | Docker Hub login for the image push |
| `DOCKERHUB_TOKEN` | Docker Hub access token with write access to `innei/byline` |

### npm packages

`.github/workflows/publish.yml` publishes `@mx-space/byline-api-client` and `@mx-space/byline-cli`. Bump `version` in the package's `package.json`, commit, then push a tag named after the package directory:

```sh
git tag api-client@0.2.0 && git push origin api-client@0.2.0
git tag cli@0.2.0 && git push origin cli@0.2.0
```

The workflow can also be started by hand (`workflow_dispatch`) with the package to publish. It refuses a tag whose version differs from `package.json`, runs the package's typecheck, tests and build, packs it with `pnpm pack` (which rewrites `workspace:` ranges and applies `publishConfig`), checks the packed manifest for leftover `workspace:` ranges, and publishes the tarball with `npm publish --provenance --access public`. Versions with a prerelease suffix go to the `next` dist-tag.

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). There is no `NPM_TOKEN` secret and nothing is published from a local machine. The workflow installs npm 12.2.0, since trusted publishing needs npm 11.5.1 or later and Node.js 22.14.0 or later, and runs on GitHub-hosted runners, the only kind trusted publishing supports.

Each package needs a Trusted Publisher configured on npmjs.com (package **Settings** > **Trusted publishing** > GitHub Actions):

| Field | Value |
| --- | --- |
| Organization or user | `mx-space` |
| Repository | `byline` |
| Workflow filename | `publish.yml` (file name only) |
| Environment name | leave empty |

The `repository.url` in each `package.json` must match `mx-space/byline`, and the configuration is only checked when a publish runs. Once the first trusted publish succeeds, set **Publishing access** to "Require two-factor authentication and disallow tokens"; trusted publishing keeps working because it does not use tokens. Provenance is only generated while the repository is public.

A Trusted Publisher can only be added to a package that already exists on the registry (the `npm trust` docs state "The package you're configuring must already exist on the npm registry"). `@mx-space/byline-api-client` and `@mx-space/byline-cli` have never been published, so each needs one bootstrap version published by an `@mx-space` org member before the workflow can take over. After that first version exists, add the Trusted Publisher, either in the web UI or with `npm trust github <package> --file publish.yml --repo mx-space/byline --allow-publish` (npm 11.15.0 or later), and publish every later version through the workflow.

## License

[MIT](./LICENSE) © Innei
