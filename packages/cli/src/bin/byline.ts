import { run } from '../cli'

run(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    process.stderr.write(
      `byline: ${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  },
)
