# @mx-space/byline-cli

Command line tools for the [Byline](https://github.com/mx-space/byline) headless CMS.

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
| `seo.title`, `seo.description`, `seo.image`   | post SEO                                         |
| `tags` / `seo.tags`                           | tags                                             |
| `summary` / `description` / `seo.description` | summary                                          |
| `draft: true` / `published: false`            | the post is skipped                              |

### What the import does

1. Converts each file to Lexical JSON with haklex nodes and validates it with
   `@haklex/rich-headless`.
2. Resolves authors against existing users by `username`, then by display name.
   Unknown authors become profile-only users from the authors file.
3. Finds or creates categories.
4. Creates the post in the source locale, or updates it when a post with the slug
   exists, through the draft and publish flow, without running AI resources.
5. Writes every other locale as a locked manual translation, which publish-time
   AI translation will not overwrite.

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

Image paths in frontmatter and the body are handled by kind: relative paths
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
  `{ "cells": key }` (each child becomes one nested state, as grids use).
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

See `examples/lobehub/` for a complete configuration.

## License

MIT
