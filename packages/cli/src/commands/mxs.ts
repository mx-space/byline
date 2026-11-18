import { execFile, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

import {
  type Connection,
  type ConnectionFlags,
  requireConnection,
} from '../auth/client'
import { credentialsPath } from '../auth/credentials'

const CONNECTION_FLAGS = new Set(['--api-url', '--api-key', '--token'])

export const splitConnectionFlags = (args: string[]) => {
  const flags: ConnectionFlags = {}
  const rest: string[] = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const [name, inline] = arg.split(/=(.*)/s, 2)
    if (!CONNECTION_FLAGS.has(name)) {
      rest.push(arg)
      continue
    }
    const value = inline ?? args[++i]
    if (value === undefined) throw new Error(`${name} needs a value`)
    flags[name.slice(2) as keyof ConnectionFlags] = value
  }
  return { flags, rest }
}

export const mxsEnv = (
  connection: Connection | null,
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv => {
  const next: NodeJS.ProcessEnv = {}
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('MXS_')) next[key] = value
  }
  // An empty config home keeps mxs away from the user's own mx-space profiles.
  next.XDG_CONFIG_HOME = path.join(path.dirname(credentialsPath(env)), 'mxs')
  next.MXS_NO_AUTO_UPDATE = '1'
  next.MXS_NO_UPDATE_CHECK = '1'
  if (connection) {
    next.MXS_API_URL = connection.apiUrl
    if (connection.apiKey) next.MXS_API_KEY = connection.apiKey
    if (connection.token) next.MXS_TOKEN = connection.token
  }
  return next
}

const mxsBin = () => {
  const require = createRequire(import.meta.url)
  const manifestPath = require.resolve('@mx-space/cli/package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    bin: string | Record<string, string>
  }
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.mxs
  return path.join(path.dirname(manifestPath), bin)
}

const wantsHelp = (args: string[]) =>
  args.length === 0 || args.includes('--help') || args.includes('-h')

// mxs requires Node 26 and appends a versioned prefix to bare API URLs.
export const canUseMxs = (connection: Connection) =>
  Number(process.versions.node.split('.')[0]) >= 26 &&
  /\/api\/v\d+$/.test(connection.apiUrl)

export const createMxsPublishJob = (
  connection: Connection,
  draft: {
    id: string
    headRevisionId: string
    publishedRevisionId: string | null
  },
): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [
        mxsBin(),
        'draft',
        'publish',
        draft.id,
        '--expected-head',
        draft.headRevisionId,
        '--expected-published',
        draft.publishedRevisionId ?? 'none',
        '--json',
      ],
      { env: mxsEnv(connection) },
      (error, stdout) => {
        try {
          if (error && !stdout.trim()) throw error
          const response = JSON.parse(stdout) as {
            ok?: boolean
            data?: { data?: { task_id?: string; taskId?: string } }
            message?: string
          }
          if (response.ok === false && response.message) {
            throw new Error(response.message)
          }
          if (error) throw error
          const taskId =
            response.data?.data?.task_id ?? response.data?.data?.taskId
          if (response.ok !== true || typeof taskId !== 'string' || !taskId) {
            throw new Error('mxs did not return a publish job ID')
          }
          resolve(taskId)
        } catch (cause) {
          reject(cause)
        }
      },
    )
  })

export const runMxsCommand = (
  args: string[],
  connection: Connection | null,
  stdout: 'inherit' | 'ignore' = 'inherit',
): Promise<number> => {
  const child = spawn(process.execPath, [mxsBin(), ...args], {
    stdio: ['inherit', stdout, 'inherit'],
    env: mxsEnv(connection),
  })
  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)))
  })
}

export const runMxs = async (
  command: string,
  args: string[],
  options: { api: boolean },
): Promise<number> => {
  const { flags, rest } = splitConnectionFlags(args)
  const connection =
    options.api && !wantsHelp(rest) ? await requireConnection(flags) : null
  return runMxsCommand([command, ...rest], connection)
}
