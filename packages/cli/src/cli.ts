import { IMPORT_MDX_HELP, runImportMdx } from './commands/import-mdx'

const HELP = `Usage: byline <command>

Commands:
  import mdx <dir>   import an MDX content tree as posts and locked translations

Run "byline import mdx --help" for options.
`

export const run = async (argv: string[]): Promise<number> => {
  const [command, subcommand, ...rest] = argv
  if (!command || command === '--help' || command === '-h') {
    process.stdout.write(HELP)
    return 0
  }
  if (command === 'import' && subcommand === 'mdx') return runImportMdx(rest)
  if (command === 'import') {
    process.stderr.write(IMPORT_MDX_HELP)
    return 2
  }
  process.stderr.write(`Unknown command "${command}"\n\n${HELP}`)
  return 2
}
