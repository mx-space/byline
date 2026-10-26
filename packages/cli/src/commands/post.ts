import { parseArgs } from 'node:util'

import { connect, CONNECTION_HELP, CONNECTION_OPTIONS } from '../auth/client'
import { Directory, toWriteData } from '../writing/fields'
import { formatPost, formatPostRow, printJson } from '../writing/format'
import { readWriteInput, WRITE_HELP, WRITE_OPTIONS } from '../writing/input'
import { showDraft } from './draft'

export const POST_HELP = `Usage: byline post <command> [options]

Commands:
  list                     list posts (--page, --size)
  get <slugOrId>           show a post
  create                   create a post draft; it is not published

${WRITE_HELP}
Options:
  --json                   print the raw API response
${CONNECTION_HELP}`

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
      const pagination = meta?.pagination
      process.stdout.write(
        `${data.map(formatPostRow).join('\n') || 'No posts'}\n${pagination ? `page ${pagination.page}/${pagination.totalPages}, ${pagination.total} posts\n` : ''}`,
      )
      return 0
    }
    case 'get': {
      const [key] = positionals
      if (!key) throw new Error('Usage: byline post get <slugOrId>')
      const client = (await connect(values, { required: true }))!
      const post = /^\d+$/.test(key)
        ? (await client.posts.get(key)).data
        : (await client.posts.findBySlug(key))?.data
      if (!post) throw new Error(`Post "${key}" not found`)
      if (values.json) return printJson(post)
      process.stdout.write(`${formatPost(post)}\n`)
      return 0
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
    default: {
      process.stderr.write(`Unknown post command "${command}"\n\n${POST_HELP}`)
      return 2
    }
  }
}
