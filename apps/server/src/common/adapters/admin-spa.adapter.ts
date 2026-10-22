import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { lookup } from 'mime-types'

import { API_VERSION } from '~/app.config'
import { ADMIN_ASSET_DIR, ADMIN_MOUNT_PATH } from '~/constants/path.constant'
import { isDev } from '~/global/env.global'
import { ConfigsService } from '~/modules/configs/configs.service'

const INJECT_PLACEHOLDER = '<!-- injectable script -->'
const IMMUTABLE_DIRS = new Set(['assets', 'js'])

const serializeForScript = (value: unknown) =>
  JSON.stringify(value).replaceAll('<', '\\u003c')

const resolveAssetPath = (relativePath: string): string | null => {
  const root = path.resolve(ADMIN_ASSET_DIR)
  const resolved = path.resolve(root, relativePath)
  return resolved.startsWith(root + path.sep) ? resolved : null
}

const isFile = async (filePath: string) => {
  try {
    return (await stat(filePath)).isFile()
  } catch {
    return false
  }
}

export function registerAdminSpa(app: NestFastifyApplication) {
  const fastify = app.getHttpAdapter().getInstance()
  let entryTemplate: string | null = null

  const loadEntryTemplate = async () => {
    if (entryTemplate !== null && !isDev) return entryTemplate
    entryTemplate = await readFile(
      path.join(ADMIN_ASSET_DIR, 'index.html'),
      'utf8',
    ).catch(() => null)
    return entryTemplate
  }

  const renderEntry = async (template: string) => {
    const { webUrl } = await app.get(ConfigsService).get('url')
    const injectData = {
      BASE_API: isDev ? '/' : `/api/v${API_VERSION}`,
      GATEWAY: '/',
      WEB_URL: webUrl,
    }
    const script = `<script>window.pageSource='server';window.injectData=Object.assign(window.injectData||{},${serializeForScript(injectData)});</script>`
    return template.includes(INJECT_PLACEHOLDER)
      ? template.replace(INJECT_PLACEHOLDER, script)
      : template.replace('</head>', `${script}</head>`)
  }

  const sendEntry = async (reply: FastifyReply) => {
    const template = await loadEntryTemplate()
    if (!template) {
      return reply
        .code(404)
        .type('text/plain')
        .send('Admin is not built. Run `pnpm build:admin` first.')
    }
    return reply
      .header('cache-control', 'no-cache')
      .type('text/html; charset=utf-8')
      .send(await renderEntry(template))
  }

  fastify.get(ADMIN_MOUNT_PATH, (request, reply) => {
    const query = request.url.slice(ADMIN_MOUNT_PATH.length)
    return reply.redirect(`${ADMIN_MOUNT_PATH}/${query}`, 301)
  })

  fastify.get(
    `${ADMIN_MOUNT_PATH}/*`,
    async (request: FastifyRequest<{ Params: { '*': string } }>, reply) => {
      let relativePath: string
      try {
        relativePath = decodeURIComponent(request.params['*'] || '')
      } catch {
        return reply.code(400).type('text/plain').send('Bad Request')
      }
      if (!relativePath || relativePath === 'index.html') {
        return sendEntry(reply)
      }

      const assetPath = resolveAssetPath(relativePath)
      if (!assetPath || !(await isFile(assetPath))) {
        if (path.extname(relativePath)) {
          return reply.code(404).type('text/plain').send('Not Found')
        }
        return sendEntry(reply)
      }

      const topDir = relativePath.split('/')[0]
      reply.header(
        'cache-control',
        IMMUTABLE_DIRS.has(topDir)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      )
      const mimeType = lookup(assetPath)
      if (mimeType) reply.type(mimeType)
      return reply.send(createReadStream(assetPath))
    },
  )
}
