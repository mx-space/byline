import type { PostModel } from '~/models/post'

export function postTitle(post: PostModel, untitled: string) {
  const title = post.title.trim()
  return title || untitled
}

export function bylineNames(post: PostModel) {
  return (post.authors ?? [])
    .map((author) => author.displayName.trim())
    .filter((name) => name.length > 0)
}

export function formatUpdatedAt(value: string | null, empty: string) {
  if (!value) return empty
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return empty
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
