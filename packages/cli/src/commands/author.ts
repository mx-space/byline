import { parseArgs } from 'node:util'

import { connect, CONNECTION_HELP, CONNECTION_OPTIONS } from '../auth/client'
import { formatUserRow, printJson } from '../writing/format'

export const AUTHOR_HELP = `Usage: byline author list [options]

List the accounts and profiles that can appear in a byline. Use the username
(or id) with --authors.

Options:
  --json                   print the raw API response
${CONNECTION_HELP}`

export const runAuthor = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv
  const { values } = parseArgs({
    args: rest,
    options: {
      ...CONNECTION_OPTIONS,
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (!command || values.help) {
    process.stdout.write(AUTHOR_HELP)
    return 0
  }
  if (command !== 'list') {
    process.stderr.write(
      `Unknown author command "${command}"\n\n${AUTHOR_HELP}`,
    )
    return 2
  }
  const client = (await connect(values, { required: true }))!
  const users = await client.users.listAll({ status: 'all' })
  if (values.json) return printJson(users)
  process.stdout.write(`${users.map(formatUserRow).join('\n')}\n`)
  return 0
}
