# @mx-space/byline-api-client

Typed `fetch` client for the [Byline](https://github.com/mx-space/byline) headless CMS API.
It has no runtime dependencies and works in Node.js 20+, browsers, Deno, Bun and edge
runtimes. It ships ESM and CommonJS builds with type declarations.

## Install

```sh
pnpm add @mx-space/byline-api-client
# or: npm install @mx-space/byline-api-client
```

## Usage

```ts
import { createClient } from '@mx-space/byline-api-client'

const byline = createClient({
  endpoint: 'https://cms.example.com/api/v3',
  lang: 'zh-TW',
})

const { data: posts, meta } = await byline.posts.list({ size: 20 })
const { data: post } = await byline.posts.getBySlug('product', 'hello-world')
const { data: same } = await byline.posts.getBySlugOnly('hello-world')
```

`getBySlugOnly` reads a post by its slug alone (`GET /posts/slug/:slug`, one request);
old slugs resolve to the current post.

`endpoint` is the server's API prefix (`/api/v{version}` in production). Every method
resolves to `{ data, meta? }`, mirroring the server envelope. Responses are converted
from the snake_case wire format to camelCase, except free-form subtrees (post `meta`,
dynamic component `propsSchema`). Pass `camelCase: false` to keep the wire keys.
Failures throw `BylineApiError` with the server's `status`, `code`, `message` and
`details`; use `isBylineApiError(error)` to narrow.

| Option      | Purpose                                                         |
| ----------- | --------------------------------------------------------------- |
| `endpoint`  | API base URL, required                                          |
| `lang`      | default `?lang=` for post and category reads                    |
| `apiKey`    | sent as `x-api-key`                                             |
| `token`     | session token sent as `Authorization: Bearer`                   |
| `headers`   | extra headers on every request                                  |
| `fetch`     | custom `fetch` implementation (tests, proxies, Next.js caching) |
| `camelCase` | `false` keeps snake_case keys                                   |

### Languages

Reads take `lang` per call or from the client option. The server tries the exact
language, then its base (`en-US` falls back to `en`, `zh-Hant-HK` to `zh`), then serves
the source. Sibling regions are never used. `meta.translation` reports the language
actually served, and the post `seo` is the source SEO with the translation's non-empty
`title`, `description` and `image` merged over it.

### Authors

Public author profiles are readable without credentials. Listed authors are active and
either profile-only or credited on a published post.

```ts
const { data: authors, meta } = await byline.authors.list({ page: 1, size: 20 })
const everyone = await byline.authors.listAll()
const { data: ada } = await byline.authors.get('ada')
const { data: posts } = await byline.posts.list({ authorId: ada.id })
```

`authors.get` accepts an id or a username (case-insensitive). Hidden or unknown authors
throw `USER_NOT_FOUND` (404).

## Authentication

Reads of published content are public. Writes need either an API key or a session
token:

```ts
const admin = createClient({ endpoint, apiKey: process.env.BYLINE_API_KEY })
```

### Writing posts and translations

`posts.create` and `posts.revise` go through the draft and publish-job flow the admin
uses: they save a draft revision, start a publish job and wait for it. `revise`
writes into the post's working copy on top of its published revision, so fields you
omit keep their current values. When it publishes, `revise` refuses with
`DRAFT_WORKING_COPY_AHEAD` (409) if someone has unpublished changes in the working
copy; pass `{ publish: false }` to write into the working copy without publishing.

```ts
const { postId } = await admin.posts.create(
  {
    title: 'Hello',
    content: lexicalState,
    text: 'Hello',
    categoryId,
    authors: [userId],
    sourceLang: 'en',
    seo: { title: 'Hello', description: 'A greeting' },
  },
  { aiResources: [] },
)

await admin.translations.writeManual(postId!, 'zh-TW', {
  title: '你好',
  content: translatedLexicalState,
  seo: { title: '你好', description: '一句問候' },
})
```

A manual translation is stored locked, so publish-time AI translation skips it unless
regeneration is requested. Writing into the post's source language is rejected with
`INVALID_PARAMETER`. `translations.update(id, { seo })` edits a stored row; pass
`seo: null` to clear it.

### Users and invites

Byline is invite-only. A profile-only user (an author without credentials) can be
upgraded into a sign-in account, keeping its id and bylines:

```ts
const { data: author } = await admin.users.createProfileOnly({
  displayName: 'Ada Lovelace',
  username: 'ada',
})

const { data: invite } = await admin.users.invite(author.id, {
  email: 'ada@example.com',
})
console.log(invite.acceptUrl)

await byline.invites.accept(invite.token, { username: 'ada', password: '…' })
```

`users.invite` defaults the email and display name to the stored profile.
`invites.create({ email })` with the email of an existing profile-only user attaches the
invite to that user too (`invite.userId`).

## Resources

| Resource            | Methods                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `posts`             | `list`, `get`, `getBySlug`, `getBySlugOnly`, `getPath`, `findBySlug`, `latest`, `create`, `revise`, `update`, `setPublished`, `delete`                        |
| `authors`           | `list`, `listAll`, `get`                                                                                                                                      |
| `drafts`            | `list`, `get`, `context`, `create`, `update`, `delete`                                                                                                        |
| `publishJobs`       | `create`, `run` (create and wait)                                                                                                                             |
| `tasks`             | `get`, `wait`, `cancel`                                                                                                                                       |
| `categories`        | `list`, `get`, `create`, `update`, `delete`                                                                                                                   |
| `translations`      | `getForArticle`, `languages`, `listByRef`, `writeManual`, `update`, `delete`, `createTask`                                                                    |
| `users`             | `allowLogin`, `checkLogged`, `me`, `updateMe`, `list`, `listAll`, `get`, `update`, `createProfileOnly`, `invite`, `deactivate`, `reactivate`, `initFirstUser` |
| `invites`           | `list`, `create`, `revoke`, `get`, `accept`                                                                                                                   |
| `dynamicComponents` | `list`, `register`                                                                                                                                            |
| `files`             | `upload`                                                                                                                                                      |

## Example: LobeHub blog

A LobeHub-style marketing site serves its blog in 17 locales from one Byline instance.
Category slugs, locales and author profiles live in Byline, not in the site.

```ts
import { createClient, isBylineApiError } from '@mx-space/byline-api-client'

const byline = createClient({ endpoint: process.env.BYLINE_API_URL! })

export const loadBlogIndex = async (locale: string, page = 1) => {
  const { data: posts, meta } = await byline.posts.list({
    lang: locale,
    page,
    size: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  return { posts, pagination: meta?.pagination }
}

export const loadBlogPost = async (locale: string, slug: string) => {
  try {
    const { data: post, meta } = await byline.posts.getBySlugOnly(slug, {
      lang: locale,
    })
    return { post, seo: post.seo, translation: meta?.translation }
  } catch (error) {
    if (isBylineApiError(error) && error.status === 404) return null
    throw error
  }
}

export const loadAuthorPage = async (username: string, locale: string) => {
  const { data: author } = await byline.authors.get(username)
  const { data: posts } = await byline.posts.list({
    authorId: author.id,
    lang: locale,
  })
  return { author, posts }
}
```

`post.content` is Lexical JSON; render it with a haklex renderer. LobeHub-specific
components are haklex Dynamic Nodes (`{ url, props }`) that the site resolves itself.

## License

MIT
