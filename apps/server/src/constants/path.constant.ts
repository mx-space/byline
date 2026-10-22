import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

import { cwd, isDev } from '~/global/env.global'

export const HOME = homedir()

export const TEMP_DIR = isDev ? join(cwd, './tmp') : '/tmp/byline'

export const DATA_DIR = isDev ? join(cwd, './tmp') : join(HOME, '.byline')

export const USER_ASSET_DIR = join(DATA_DIR, 'assets')

export const STATIC_FILE_DIR = join(DATA_DIR, 'static')
export const STATIC_FILE_TRASH_DIR = join(TEMP_DIR, 'trash')

export const ADMIN_MOUNT_PATH = '/admin'

export const ADMIN_ASSET_DIR = process.env.ADMIN_ASSET_DIR
  ? resolve(process.env.ADMIN_ASSET_DIR)
  : isDev
    ? join(cwd, '../admin/dist')
    : join(cwd, './admin')

export const NODE_REQUIRE_PATH = join(DATA_DIR, 'node_modules')
