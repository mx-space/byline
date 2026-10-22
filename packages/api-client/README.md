# @mx-space/byline-api-client

Typed `fetch` client for the [Byline](https://github.com/mx-space/byline) headless CMS API.

```ts
import { createClient } from '@mx-space/byline-api-client'

const byline = createClient({
  endpoint: 'https://cms.example.com/api/v3',
  lang: 'zh-TW',
})

const { data: posts, meta } = await byline.posts.list({ size: 20 })
const { data: post } = await byline.posts.getBySlug('product', 'hello-world')
```

Every method resolves to `{ data, meta? }`, mirroring the server envelope. Responses
are converted from the snake_case wire format to camelCase, except free-form
subtrees (post `meta`, dynamic component `propsSchema`). Pass `camelCase: false` to
keep the wire keys. Failures throw `BylineApiError` with the server's `status`,
`code`, `message` and `details`.

## Authentication

Reads of published content are public. Writes need either an API key (sent as
`x-api-key`) or a session token (sent as `Authorization: Bearer`):

```ts
const admin = createClient({ endpoint, apiKey: process.env.BYLINE_API_KEY })
```

## Resources

| Resource            | Methods                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `posts`             | `list`, `get`, `getBySlug`, `getPath`, `findBySlug`, `latest`, `create`, `revise`, `update`, `setPublished`, `delete`                               |
| `drafts`            | `list`, `get`, `context`, `create`, `update`, `delete`                                                                                              |
| `publishJobs`       | `create`, `run` (create and wait)                                                                                                                   |
| `tasks`             | `get`, `wait`, `cancel`                                                                                                                             |
| `categories`        | `list`, `get`, `create`, `update`, `delete`                                                                                                         |
| `translations`      | `getForArticle`, `languages`, `listByRef`, `writeManual`, `update`, `delete`, `createTask`                                                          |
| `users`             | `allowLogin`, `checkLogged`, `me`, `updateMe`, `list`, `listAll`, `get`, `update`, `createProfileOnly`, `deactivate`, `reactivate`, `initFirstUser` |
| `invites`           | `list`, `create`, `revoke`, `get`, `accept`                                                                                                         |
| `dynamicComponents` | `list`, `register`                                                                                                                                  |
| `files`             | `upload`                                                                                                                                            |

`posts.create` and `posts.revise` go through the draft and publish-job flow the
admin uses: they save a draft revision, start a publish job and wait for it.
`revise` branches from the post's published revision, so fields you omit keep
their current values.

```ts
const { postId } = await admin.posts.create(
  {
    title: 'Hello',
    content: lexicalState,
    text: 'Hello',
    categoryId,
    authors: [userId],
    sourceLang: 'en',
  },
  { aiResources: [] },
)

await admin.translations.writeManual(postId!, 'zh-TW', {
  title: '你好',
  content: translatedLexicalState,
})
```

## License

MIT
