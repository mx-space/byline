import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { BylineClient } from '@mx-space/byline-api-client'

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value)

export const resolveCover = async (
  spec: string,
  client: BylineClient,
): Promise<string> => {
  const trimmed = spec.trim()
  if (!trimmed) throw new Error('Cover is empty')
  if (isRemoteUrl(trimmed)) return trimmed
  const filePath = path.resolve(trimmed)
  let bytes: Buffer
  try {
    bytes = await readFile(filePath)
  } catch {
    throw new Error(`Cover file not found: ${filePath}`)
  }
  const filename = path.basename(filePath)
  const payload = Uint8Array.from(bytes)
  const { data } = await client.files.upload(new File([payload], filename), {
    type: 'image',
    filename,
  })
  if (!data?.url) throw new Error('File upload did not return a URL')
  return data.url
}
