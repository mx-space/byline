import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { BylineClient, FileType } from '@mx-space/byline-api-client'

import type { LexicalNode, LexicalState } from '../mdx/lexical-nodes'

const REMOTE = /^(?:[a-z][\d+.a-z-]*:|\/|#)/i
const MEDIA_FIELDS: Record<string, Array<{ key: string; type: FileType }>> = {
  image: [{ key: 'src', type: 'image' }],
  video: [
    { key: 'src', type: 'video' },
    { key: 'poster', type: 'image' },
  ],
  file: [{ key: 'src', type: 'file' }],
}

export interface LocalAssetRef {
  node: LexicalNode
  key: string
  type: FileType
  value: string
}

const visit = (value: unknown, refs: LocalAssetRef[]) => {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, refs)
    return
  }
  if (!value || typeof value !== 'object') return
  const node = value as LexicalNode
  for (const field of MEDIA_FIELDS[node.type] ?? []) {
    const src = node[field.key]
    if (typeof src === 'string' && src && !REMOTE.test(src)) {
      refs.push({ node, key: field.key, type: field.type, value: src })
    }
  }
  for (const item of Object.values(node)) {
    if (item && typeof item === 'object') visit(item, refs)
  }
}

export const findLocalAssets = (state: LexicalState): LocalAssetRef[] => {
  const refs: LocalAssetRef[] = []
  visit(state.root, refs)
  return refs
}

export class AssetUploader {
  private readonly uploaded = new Map<string, Promise<string>>()

  constructor(private readonly client: BylineClient) {}

  async rewrite(state: LexicalState, baseDir: string): Promise<LexicalState> {
    const copy = structuredClone(state)
    for (const ref of findLocalAssets(copy)) {
      ref.node[ref.key] = await this.resolveUrl(ref.value, baseDir, ref.type)
    }
    return copy
  }

  resolveUrl(value: string, baseDir: string, type: FileType = 'image') {
    if (REMOTE.test(value)) return Promise.resolve(value)
    const absPath = path.resolve(
      baseDir,
      decodeURIComponent(value.split(/[#?]/)[0]),
    )
    return this.upload(absPath, type)
  }

  private upload(absPath: string, type: FileType) {
    let pending = this.uploaded.get(absPath)
    if (!pending) {
      pending = readFile(absPath).then(async (buffer) => {
        const { data } = await this.client.files.upload(new Blob([buffer]), {
          type,
          filename: path.basename(absPath),
        })
        return data.url
      })
      this.uploaded.set(absPath, pending)
    }
    return pending
  }
}
