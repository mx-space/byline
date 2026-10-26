import type {
  BylineClient,
  Category,
  DraftWriteData,
  RevisionSnapshot,
  UserDetail,
} from '@mx-space/byline-api-client'

export interface WriteFields {
  title?: string
  slug?: string
  category?: string
  summary?: string
  tags?: string[]
  authors?: string[]
}

export const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const mergeFields = (...layers: WriteFields[]): WriteFields => {
  const merged: WriteFields = {}
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined) (merged as Record<string, unknown>)[key] = value
    }
  }
  return merged
}

export const hasFields = (fields: WriteFields) =>
  Object.values(fields).some((value) => value !== undefined)

export class Directory {
  private categories?: Category[]
  private users?: UserDetail[]

  constructor(private readonly client: BylineClient) {}

  private async allUsers() {
    this.users ??= await this.client.users.listAll({ status: 'all' })
    return this.users
  }

  async categoryId(key: string) {
    this.categories ??= (await this.client.categories.list()).data
    const wanted = key.toLowerCase()
    const match = this.categories.find(
      (category) =>
        category.id === key ||
        category.slug.toLowerCase() === wanted ||
        category.name.toLowerCase() === wanted,
    )
    if (!match) {
      const known = this.categories.map((category) => category.slug).join(', ')
      throw new Error(`Unknown category "${key}" (known: ${known})`)
    }
    return match.id
  }

  async authorIds(keys: string[]) {
    const users = await this.allUsers()
    const ids = keys.map((key) => {
      const wanted = key.toLowerCase()
      const match = users.find(
        (user) =>
          user.id === key ||
          user.username?.toLowerCase() === wanted ||
          user.email?.toLowerCase() === wanted,
      )
      if (!match) {
        throw new Error(
          `Unknown author "${key}"; run \`byline author list\` to see usernames`,
        )
      }
      return match.id
    })
    return [...new Set(ids)]
  }

  async authorNames(ids: unknown) {
    if (!Array.isArray(ids) || ids.length === 0) return []
    const users = await this.allUsers()
    return ids.map((id) => {
      const user = users.find((item) => item.id === id)
      return user ? user.username || user.displayName : String(id)
    })
  }

  async categoryName(id: unknown) {
    if (typeof id !== 'string') return undefined
    this.categories ??= (await this.client.categories.list()).data
    return this.categories.find((category) => category.id === id)?.slug ?? id
  }
}

export const toWriteData = async (
  fields: WriteFields,
  body: { content: string; text: string } | null,
  directory: Directory,
): Promise<DraftWriteData> => {
  const data: DraftWriteData = { contentFormat: 'lexical' }
  const typeSpecificData: Record<string, unknown> = {}
  if (fields.title !== undefined) data.title = fields.title
  if (body) Object.assign(data, body)
  if (fields.slug !== undefined) typeSpecificData.slug = fields.slug
  if (fields.summary !== undefined) typeSpecificData.summary = fields.summary
  if (fields.tags !== undefined) typeSpecificData.tags = fields.tags
  if (fields.category !== undefined) {
    typeSpecificData.categoryId = await directory.categoryId(fields.category)
  }
  if (fields.authors !== undefined) {
    typeSpecificData.authors = await directory.authorIds(fields.authors)
  }
  if (Object.keys(typeSpecificData).length > 0) {
    data.typeSpecificData = typeSpecificData
  }
  return data
}

export const applyPatch = (
  base: RevisionSnapshot,
  patch: DraftWriteData,
): DraftWriteData => ({
  title: base.title,
  text: base.text,
  content: base.content ?? undefined,
  images: base.images as DraftWriteData['images'],
  meta: base.meta,
  ...patch,
  contentFormat: 'lexical',
  typeSpecificData: { ...base.typeSpecificData, ...patch.typeSpecificData },
})
