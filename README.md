<p align="center">
  <img src="docs/assets/hero.webp" alt="Byline: headless CMS for teams, AI built in" width="100%">
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-ee7099" alt="MIT"></a>
  <a href="https://hub.docker.com/r/innei/byline"><img src="https://img.shields.io/docker/v/innei/byline?label=docker&color=d1508f" alt="Docker"></a>
  <a href="https://www.npmjs.com/package/@mx-space/byline-api-client"><img src="https://img.shields.io/npm/v/@mx-space/byline-api-client?label=api-client&color=a64283" alt="api-client"></a>
</p>

<p align="center">
  Multi-author, API-only CMS. Derived from <a href="https://github.com/mx-space/core">Mix Space</a>.
  <br>
  🤖 Agents and LLMs: read <a href="./llms.txt"><code>llms.txt</code></a> for the full reference.
</p>

<img src="docs/assets/screenshot-editor.webp" alt="The Byline editor with post settings" width="100%">

## Run

```sh
export JWT_SECRET="$(openssl rand -hex 32)"
docker compose up -d
open http://localhost:2333/admin/
```

<img src="docs/assets/features.webp" alt="Multi-author, AI built in, API only, WYSIWYG editor, Webhooks, One Docker image" width="100%">

<img src="docs/assets/feat-authors.webp" alt="Ordered bylines and invitations" width="100%">

Ordered bylines. Invite-only accounts. Guest authors without a login.

<img src="docs/assets/feat-ai.webp" alt="One post becomes translations, a summary and SEO" width="100%">

Translations, summaries and SEO descriptions run on publish. Hand-written translations stay locked.

<img src="docs/assets/feat-dynamic.webp" alt="A site component dropped into the editor" width="100%">

Site-specific blocks are haklex Dynamic Nodes: `{ url, props }`. Byline stores them; your site renders them.

<img src="docs/assets/feat-webhooks.webp" alt="A signed webhook revalidates the site" width="100%">

Signed webhooks with a replayable event log.

## How it fits

<img src="docs/assets/flow.webp" alt="Write, publish with AI, serve over the Byline API, render on your site" width="100%">

```sh
curl 'https://cms.example.com/api/v3/posts/slug/hello-world?lang=zh-CN'
```

## More screens

<table>
  <tr>
    <td><img src="docs/assets/screenshot-dashboard.webp" alt="Overview dashboard"></td>
    <td><img src="docs/assets/screenshot-posts.webp" alt="Published posts"></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screenshot-users.webp" alt="Users with byline-only profiles"></td>
    <td><img src="docs/assets/screenshot-login.webp" alt="Sign in"></td>
  </tr>
</table>

## Develop

```sh
pnpm install && pnpm migrate && pnpm dev
```

| Read this | For |
| --- | --- |
| [`llms.txt`](./llms.txt) | Config, API, webhooks, releases |
| [`AGENTS.md`](./AGENTS.md) | Changing this repo |

[MIT](./LICENSE) © Innei
