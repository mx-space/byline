import { runLogin, runLogout, runWhoami } from './commands/auth'
import { IMPORT_MDX_HELP, runImportMdx } from './commands/import-mdx'

const HELP = `Usage: byline <command>

Commands:
  login              sign in through the browser and save the session
  logout             remove the saved session
  whoami             show the signed-in user
  import mdx <dir>   import an MDX content tree as posts and locked translations

Run "byline login --help" or "byline import mdx --help" for options.
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
  const [subcommand, ...rest] = args
  if (command === 'import' && subcommand === 'mdx') return runImportMdx(rest)
  if (command === 'import') {
    process.stderr.write(IMPORT_MDX_HELP)
    return 2
  }
  process.stderr.write(`Unknown command "${command}"\n\n${HELP}`)
  return 2
}
