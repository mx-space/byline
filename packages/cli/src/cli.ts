import { runLogin, runLogout, runWhoami } from './commands/auth'
import { runAuthor } from './commands/author'
import { runDraft } from './commands/draft'
import { IMPORT_MDX_HELP, runImportMdx } from './commands/import-mdx'
import { runMxs } from './commands/mxs'
import { runPost } from './commands/post'

const HELP = `Usage: byline <command>

Commands:
  login              sign in through the browser and save the session
  logout             remove the saved session
  whoami             show the signed-in user
  post               list, read and create post drafts (create never publishes)
  draft              list, read, update and delete drafts
  author             list the users that can appear in a byline
  ai                 AI summaries, translations, insights, TTS (runs mxs)
  skill              bundled AI agent chapters (runs mxs)
  import mdx <dir>   import an MDX content tree as posts and locked translations

Run "byline <command> --help" for options.
`

export const run = async (argv: string[]): Promise<number> => {
  const [command, ...args] = argv
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(HELP)
    return 0
  }
  if (command === 'login') return runLogin(args)
  if (command === 'logout') return runLogout()
  if (command === 'whoami') return runWhoami()
  if (command === 'post') return runPost(args)
  if (command === 'draft') return runDraft(args)
  if (command === 'author') return runAuthor(args)
  if (command === 'ai') return runMxs('ai', args, { api: true })
  if (command === 'skill') return runMxs('skill', args, { api: false })
  const [subcommand, ...rest] = args
  if (command === 'import' && subcommand === 'mdx') return runImportMdx(rest)
  if (command === 'import') {
    process.stderr.write(IMPORT_MDX_HELP)
    return 2
  }
  process.stderr.write(`Unknown command "${command}"\n\n${HELP}`)
  return 2
}
