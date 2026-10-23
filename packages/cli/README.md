# @mx-space/byline-cli

Command line tools for the [Byline](https://github.com/mx-space/byline) headless CMS.

## Install

Requires Node.js 22 or later.

```sh
pnpm add -g @mx-space/byline-cli
# or run without installing
npx @mx-space/byline-cli import mdx --help
```

The package installs a `byline` binary. API credentials come from flags or the
environment:

| Flag        | Environment      | Purpose                                             |
| ----------- | ---------------- | --------------------------------------------------- |
| `--api-url` | `BYLINE_API_URL` | API base URL, e.g. `https://cms.example.com/api/v3` |
| `--api-key` | `BYLINE_API_KEY` | API key sent as `x-api-key`                         |
| `--token`   | `BYLINE_TOKEN`   | session token sent as `Authorization: Bearer`       |

The importer is also exported as a library (`planImport`, `executeImport`,
`convertMdx`, `loadImportConfig`) for scripted migrations.

## `byline import mdx <dir>`

Imports an MDX or Markdown content tree as Byline posts. It works with any
MDX-based blog: site-specific components are mapped through a configuration file.

```sh
byline import mdx ./content/blog \
  --config ./byline.import.json \
  --api-url https://cms.example.com/api/v3 \
  --api-key "$BYLINE_API_KEY"
```

Run with `--dry-run` first. Without API credentials it plans offline; with them it
also looks up existing posts, users and categories (read-only).

### Content layout

- A post is a folder with `index.mdx`, or a single `<slug>.mdx` file.
- Translations sit next to the source as `index.<locale>.mdx` or `<slug>.<locale>.mdx`.
  Files without a locale suffix are in `--source-locale` (default `en`).
- The slug comes from the folder or file name, unless frontmatter sets `slug`.
- The category comes from frontmatter `category`, then the parent folder name, then `--category`.

### Frontmatter

| Field                                         | Used as                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `title` (or `seo.title`)                      | post title                                       |
| `date` / `createdAt`                          | creation time, sent only with `--preserve-dates` |
| `image` / `cover`                             | cover image (see image paths below)              |
| `author` / `authors`                          | author keys, in byline order                     |
| `seo.title`, `seo.description`, `seo.image`   | SEO of the post or of that locale's translation  |
| `tags` / `seo.tags`                           | tags                                             |
| `summary` / `description` / `seo.description` | summary                                          |
| `draft: true` / `published: false`            | the post is skipped                              |

Translation files use `title`, `summary`, `tags` and `seo` from their own frontmatter.
The source file decides category, date, cover and authors for every locale. A
translation's `seo` block is stored on its translation row, and the server merges its
non-empty fields over the source SEO when the post is read in that language.

### What the import does

1. Converts each file to Lexical JSON with haklex nodes and validates it with
   `@haklex/rich-headless`.
2. Resolves authors against existing users by `username`, then by display name.
   Unknown authors become profile-only users from the authors file. They stay
   profile-only; to let one sign in later, invite them from the admin or with
   `users.invite(id)` in the api-client, which keeps their id and bylines.
3. Finds or creates categories.
4. Creates the post in the source locale, or updates it when a post with the slug
   exists, through the draft and publish flow, without running AI resources.
5. Writes every other locale as a locked manual translation with its own SEO,
   which publish-time AI translation will not overwrite.

The import is idempotent: a content hash is stored in the post's `meta.bylineImport`,
and unchanged posts are skipped unless `--force` is passed.

### Configuration

`--config` points to a JSON file. `components` and `authors` can be inline objects
or paths relative to the config file.

```json
{
  "sourceLocale": "en",
  "localeAliases": { "zh": "zh-CN" },
  "components": "./components.json",
  "authors": "./authors.json",
  "categories": { "product": { "name": "Product" } },
  "defaultAuthors": ["team"],
  "siteUrl": "https://example.com"
}
```

Image paths in frontmatter (cover and `seo.image`, per locale) and the body are
handled by kind: relative paths
(`./hero.png`) are uploaded to Byline, URLs are kept, and site-absolute paths
(`/images/hero.png`) are resolved against `siteUrl`. Without `siteUrl` they are
kept as-is, which Byline accepts in the body but not as a post cover.

The component map turns JSX components into haklex nodes:

```json
{
  "unknown": "placeholder",
  "components": {
    "Callout": {
      "node": "banner",
      "props": {
        "bannerType": {
          "from": "type",
          "map": { "info": "note" },
          "default": "note"
        }
      },
      "children": { "state": "content" }
    },
    "Cards": {
      "node": "grid-container",
      "props": { "cols": { "value": 2 } },
      "children": { "cells": "cells" }
    },
    "Card": { "markdown": "![{title}]({image})\n\n[{title}]({href})" },
    "Steps": {
      "node": "steps",
      "children": { "sections": "steps", "heading": 3 }
    },
    "Tweet": {
      "node": "embed",
      "props": { "url": { "template": "https://x.com/i/status/{id}" } }
    },
    "Chart": {
      "dynamic": {
        "url": "https://cdn.example.com/chart.mjs",
        "initialHeight": 480
      }
    },
    "Wrapper": { "unwrap": true },
    "Ad": { "skip": true }
  }
}
```

- `node` maps to a native haklex node type. A prop spec is an attribute name or
  `{ from, value, template, map, default, type }`.
- `children` is `drop` (default), `unwrap` (children follow the node),
  `{ "state": key }` (children become a nested editor state, as banners use) or
  `{ "cells": key }` (each child becomes one nested state, as grids use) or
  `{ "sections": key, "heading": n }` (children are split at each heading of
  depth `n` into `{ id, title, content }` items, as steps use; the heading's
  plain text is the title). Content before the first heading joins the first
  item, and a component with no heading of that depth is unwrapped; both are
  reported. `"title": { "replace": [...], "reportUnmatched": true }` rewrites
  each title, for example to strip a "Step 1:" prefix the node already numbers,
  and reports titles no rule matched.
- `replace` is a list of `{ "pattern", "with", "flags" }` regular-expression
  rules (flags default to `u`). A prop spec accepts it too and applies it to
  string values after `map`.
- `markdown` renders a component from a Markdown template. `{prop}` is
  replaced by the attribute value, escaped as literal text, and the result is
  converted like the rest of the post. A template line whose props are missing
  is dropped and reported. Use it for components that only lay out their props,
  such as a card with an image and a link.
- `dynamic` produces a haklex Dynamic Node `{ url, props }`. Its props are not
  translatable, so components carrying prose should map to native nodes.
- Unmapped components follow `unknown` or `--unknown`: `placeholder` keeps a
  Dynamic Node pointing at `urn:byline:unmapped-component:<Name>` with the
  original props, `skip` drops it, `unwrap` keeps its children.

The authors file maps frontmatter keys to profiles:

```json
{
  "ada": {
    "displayName": "Ada Lovelace",
    "avatar": "https://…",
    "bio": "…",
    "url": "https://…"
  }
}
```

Add `"user": "<username or id>"` to point a key at an existing account.

## Example: LobeHub blog

`examples/lobehub/` is the configuration for the LobeHub marketing blog: posts in
`<category>/<slug>/index.mdx` with 16 translations each (`index.zh.mdx`,
`index.pt-BR.mdx`, …), authors keyed by GitHub handle and LobeHub's MDX components
mapped to haklex nodes.

```sh
byline import mdx ./docs/blogs \
  --config node_modules/@mx-space/byline-cli/examples/lobehub/byline.import.json \
  --dry-run
```

```text
Dry run of ./docs/blogs (offline: no API lookups)
Posts: 72 found; would create 72, update 0; unchanged 0, skipped 0, errors 0
Locales: 17 (source en); 1152 translation files [en 72, ar 72, bg 72, de 72, …]
SEO: 72 posts, 1152 translations
Authors: 7 keys; 0 existing, would create 7 profile-only
Categories: 0 existing, would create 4
Components: Image 3701 -> image; X 935 -> embed; Callout 850 -> banner; …
Unmapped components: none
Issues: none
```

Then import for real, keeping the original publication dates:

```sh
BYLINE_API_URL=https://cms.example.com/api/v3 BYLINE_API_KEY=… \
  byline import mdx ./docs/blogs \
  --config node_modules/@mx-space/byline-cli/examples/lobehub/byline.import.json \
  --preserve-dates
```

`zh` files become `zh-CN` through `localeAliases`, site-absolute image paths resolve
against `https://lobehub.com`, and `LobeEvalLeaderboard` becomes a Dynamic Node. Point
its `url` in `components.json` at the site's real component bundle before importing.
Re-running the import only touches posts whose content changed.

## License

MIT
