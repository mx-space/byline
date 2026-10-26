import { parseArgs } from 'node:util'

import type { BylineClient, DraftBranch } from '@mx-space/byline-api-client'

import { connect, CONNECTION_HELP, CONNECTION_OPTIONS } from '../auth/client'
import {
  applyPatch,
  Directory,
  hasFields,
  toWriteData,
} from '../writing/fields'
import { formatDraft, formatDraftRow, printJson } from '../writing/format'
import { readWriteInput, WRITE_HELP, WRITE_OPTIONS } from '../writing/input'

export const DRAFT_HELP = `Usage: byline draft <command> [options]

Commands:
  list                     list post drafts (--page, --size, --new for unpublished ones)
  get <id>                 show a draft
  update <id>              append a revision; fields and body not given are kept
  delete <id>              delete a draft

Create drafts with "byline post create".

${WRITE_HELP}
Options:
  --json                   print the raw API response
${CONNECTION_HELP}`

export const showDraft = async (
  client: BylineClient,
  draft: DraftBranch,
  options: { json: boolean; heading?: string },
) => {
  if (options.json) return printJson(draft)
  const directory = new Directory(client)
  const data = draft.headRevision.typeSpecificData ?? {}
  const [authors, category] = await Promise.all([
    directory.authorNames(data.authors),
    directory.categoryName(data.categoryId),
  ])
  process.stdout.write(
    `${options.heading ? `${options.heading}\n` : ''}${formatDraft(draft, { authors, category })}\n`,
  )
  return 0
}

export const runDraft = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      ...WRITE_OPTIONS,
      ...CONNECTION_OPTIONS,
      page: { type: 'string' },
      size: { type: 'string' },
      new: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (!command || values.help || command === '--help' || command === '-h') {
    process.stdout.write(DRAFT_HELP)
    return 0
  }
  const [id] = positionals
  if (command !== 'list' && !id) {
    throw new Error(`Usage: byline draft ${command} <id>`)
  }

  switch (command) {
    case 'list': {
      const client = (await connect(values, { required: true }))!
      const { data, meta } = await client.drafts.list({
        refType: 'post',
        page: values.page ? Number(values.page) : undefined,
        size: values.size ? Number(values.size) : undefined,
        hasRef: values.new ? false : undefined,
      })
      if (values.json) return printJson({ data, meta })
      const pagination = meta?.pagination
      process.stdout.write(
        `${data.map(formatDraftRow).join('\n') || 'No drafts'}\n${pagination ? `page ${pagination.page}/${pagination.totalPages}, ${pagination.total} drafts\n` : ''}`,
      )
      return 0
    }
    case 'get': {
      const client = (await connect(values, { required: true }))!
      const { data } = await client.drafts.get(id!)
      return showDraft(client, data, { json: values.json })
    }
    case 'update': {
      const input = await readWriteInput(values)
      if (!input.body && !hasFields(input.fields)) {
        throw new Error(
          'Nothing to update: pass --file, --content or field flags',
        )
      }
      const client = (await connect(values, { required: true }))!
      const { data: current } = await client.drafts.get(id!)
      const patch = await toWriteData(
        input.fields,
        input.body,
        new Directory(client),
      )
      const { data } = await client.drafts.update(id!, {
        data: applyPatch(current.headRevision, patch),
        expectedHeadRevisionId: current.headRevisionId,
      })
      return showDraft(client, data, {
        json: values.json,
        heading: 'Updated draft',
      })
    }
    case 'delete': {
      const client = (await connect(values, { required: true }))!
      await client.drafts.delete(id!)
      process.stdout.write(
        `Deleted draft ${id} (the server keeps it archived)\n`,
      )
      return 0
    }
    default: {
      process.stderr.write(
        `Unknown draft command "${command}"\n\n${DRAFT_HELP}`,
      )
      return 2
    }
  }
}
