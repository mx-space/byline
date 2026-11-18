import { parseArgs } from 'node:util'

import type {
  BylineClient,
  Post,
  UrlOptions,
} from '@mx-space/byline-api-client'

import {
  connect,
  CONNECTION_HELP,
  CONNECTION_OPTIONS,
  createConnectedClient,
  requireConnection,
} from '../auth/client'
import { resolveCover } from '../writing/cover'
import { Directory, toWriteData } from '../writing/fields'
import { formatPost, formatPostRow, printJson } from '../writing/format'
import { readWriteInput, WRITE_HELP, WRITE_OPTIONS } from '../writing/input'
import { describePublicLink, publicPostLink } from '../writing/urls'
import { showDraft } from './draft'
import { runMxsCommand } from './mxs'

export const POST_HELP = `Usage: byline post <command> [options]

Commands:
  list                     list posts (--page, --size)
  get <slugOrId>           show a post (includes the public URL when published)
  url <slugOrId>           print the public URL, or say when there is not one
  create                   create a post draft; it is not published
  unpublish <slugOrId>     take a published post offline (does not delete it)

${WRITE_HELP}
Options:
  --url                    with get, print only the URL
  --json                   print the raw API response
${CONNECTION_HELP}`

const loadSiteUrls = async (client: BylineClient): Promise<UrlOptions> =>
  (await client.options.url()).data

const loadPost = async (client: BylineClient, key: string): Promise<Post> => {
  const post = /^\d+$/.test(key)
    ? (await client.posts.get(key)).data
    : (await client.posts.findBySlug(key))?.data
  if (!post) throw new Error(`Post "${key}" not found`)
  return post
}

const showPost = async (
  client: BylineClient,
  post: Post,
  options: { json: boolean; urlsOnly?: boolean },
) => {
  if (options.json) return printJson(post)
  const urls = await loadSiteUrls(client)
  const publicLink = publicPostLink(urls, post)
  if (options.urlsOnly) {
    process.stdout.write(`${describePublicLink(publicLink)}\n`)
    return 0
  }
  process.stdout.write(`${formatPost(post, publicLink)}\n`)
  return 0
}

export const runPost = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      ...WRITE_OPTIONS,
      ...CONNECTION_OPTIONS,
      page: { type: 'string' },
      size: { type: 'string' },
      json: { type: 'boolean', default: false },
      url: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (!command || values.help || command === '--help' || command === '-h') {
    process.stdout.write(POST_HELP)
    return 0
  }

  switch (command) {
    case 'list': {
      const client = (await connect(values, { required: true }))!
      const { data, meta } = await client.posts.list({
        page: values.page ? Number(values.page) : undefined,
        size: values.size ? Number(values.size) : undefined,
        truncate: 1,
      })
      if (values.json) return printJson({ data, meta })
      const urls = await loadSiteUrls(client)
      const pagination = meta?.pagination
      process.stdout.write(
        `${data.map((post) => formatPostRow(post, publicPostLink(urls, post))).join('\n') || 'No posts'}\n${pagination ? `page ${pagination.page}/${pagination.totalPages}, ${pagination.total} posts\n` : ''}`,
      )
      return 0
    }
    case 'get': {
      const [key] = positionals
      if (!key) throw new Error('Usage: byline post get <slugOrId>')
      const client = (await connect(values, { required: true }))!
      return showPost(client, await loadPost(client, key), {
        json: values.json,
        urlsOnly: values.url,
      })
    }
    case 'url': {
      const [key] = positionals
      if (!key) throw new Error('Usage: byline post url <slugOrId>')
      const client = (await connect(values, { required: true }))!
      return showPost(client, await loadPost(client, key), {
        json: values.json,
        urlsOnly: true,
      })
    }
    case 'create': {
      const input = await readWriteInput(values)
      if (!input.fields.title) {
        throw new Error(
          'A title is required: pass --title or <title> in --file',
        )
      }
      if (!input.body) {
        throw new Error('A body is required: pass --content or --file')
      }
      const client = (await connect(values, { required: true }))!
      if (input.coverSpec) {
        input.fields.image = await resolveCover(input.coverSpec, client)
      }
      const { data } = await client.drafts.create({
        refType: 'post',
        data: await toWriteData(
          input.fields,
          input.body,
          new Directory(client),
        ),
      })
      return showDraft(client, data, {
        json: values.json,
        heading: 'Created draft (not published)',
      })
    }
    case 'unpublish': {
      const [key] = positionals
      if (!key) throw new Error('Usage: byline post unpublish <slugOrId>')
      const connection = await requireConnection(values)
      const client = createConnectedClient(connection)
      const post = await loadPost(client, key)
      // Bundled mxs requires Node 26 and a versioned base, and treats short IDs as slugs.
      if (
        Number(process.versions.node.split('.')[0]) >= 26 &&
        /\/api\/v\d+$/.test(connection.apiUrl) &&
        /^\d{15,}$/.test(post.id)
      ) {
        const code = await runMxsCommand(
          ['post', 'unpublish', post.id],
          connection,
          'ignore',
        )
        if (code !== 0) return code
      } else {
        await client.posts.setPublished(post.id, false)
      }
      const { data: updated } = await client.posts.get(post.id)
      if (values.json) return printJson(updated)
      process.stdout.write(
        `Unpublished post ${updated.id} (${updated.title}); it is offline and was not deleted\n`,
      )
      return 0
    }
    default: {
      process.stderr.write(`Unknown post command "${command}"\n\n${POST_HELP}`)
      return 2
    }
  }
}
