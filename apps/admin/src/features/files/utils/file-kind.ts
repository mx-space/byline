import { isImageByName, isImageMime, mimeFromName } from './isImageMime'

export type FileKind = 'audio' | 'image' | 'other' | 'video'

const AUDIO_EXT = new Set([
  'aac',
  'flac',
  'm4a',
  'mp3',
  'oga',
  'ogg',
  'opus',
  'wav',
])
const VIDEO_EXT = new Set(['m4v', 'mov', 'mp4', 'ogv', 'webm'])

export function extensionOf(name: string) {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? undefined : name.slice(dot + 1).toLowerCase()
}

export function fileKindOf(name: string, mime?: null | string): FileKind {
  if (isImageMime(mime) || isImageByName(name)) return 'image'
  const ext = extensionOf(name) ?? ''
  if (mime?.startsWith('audio/') || AUDIO_EXT.has(ext)) return 'audio'
  if (mime?.startsWith('video/') || VIDEO_EXT.has(ext)) return 'video'
  return 'other'
}

export function mimeOf(name: string, mime?: null | string) {
  if (mime) return mime
  const fromImage = mimeFromName(name)
  if (fromImage) return fromImage
  const ext = extensionOf(name)
  if (!ext) return undefined
  if (AUDIO_EXT.has(ext)) return `audio/${ext === 'mp3' ? 'mpeg' : ext}`
  if (VIDEO_EXT.has(ext)) return `video/${ext === 'mov' ? 'quicktime' : ext}`
  if (ext === 'pdf') return 'application/pdf'
  return undefined
}

export function pathOf(url: string) {
  try {
    return decodeURIComponent(new URL(url, window.location.href).pathname)
  } catch {
    return url
  }
}
