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

## Repository layout

| Path | Contents |
| --- | --- |
| `apps/server` | NestJS API server (PostgreSQL via Drizzle, Redis) |
| `apps/admin` | React admin SPA, bundled into the server image |
| `packages/*` | Packages published under `@mx-space/byline-*` |
| `docs/` | Design notes and specs |

## Development

Requirements: Node.js 26 or newer, pnpm 12, PostgreSQL 16 or newer, Redis.

```sh
pnpm install
pnpm migrate
pnpm dev
pnpm dev:admin
```

## License

[MIT](./LICENSE) © Innei
