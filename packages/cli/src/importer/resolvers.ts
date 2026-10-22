import type {
  BylineClient,
  Category,
  UserDetail,
} from '@mx-space/byline-api-client'

import type { AuthorProfile, CategoryProfile } from './config'

export type ResolveAction = 'existing' | 'create'

export interface ResolvedRef {
  key: string
  action: ResolveAction
  id?: string
  label: string
}

const PLANNED = 'planned:'

const sameText = (left?: string | null, right?: string | null) =>
  !!left && !!right && left.trim().toLowerCase() === right.trim().toLowerCase()

export const toUsername = (key: string) =>
  key
    .trim()
    .toLowerCase()
    .replaceAll(/[^\w.-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 64)

const titleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ')

export class AuthorResolver {
  private users?: UserDetail[]
  private readonly resolved = new Map<string, Promise<ResolvedRef>>()

  constructor(
    private readonly client: BylineClient | null,
    private readonly profiles: Record<string, AuthorProfile>,
    private readonly dryRun: boolean,
  ) {}

  get all() {
    return Promise.all(this.resolved.values())
  }

  resolve(key: string): Promise<ResolvedRef> {
    let pending = this.resolved.get(key)
    if (!pending) {
      pending = this.lookup(key)
      this.resolved.set(key, pending)
    }
    return pending
  }

  private profile(key: string): AuthorProfile {
    return this.profiles[key] ?? this.profiles[key.toLowerCase()] ?? {}
  }

  private async lookup(key: string): Promise<ResolvedRef> {
    const profile = this.profile(key)
    const displayName = profile.displayName ?? key
    this.users ??= this.client
      ? await this.client.users.listAll({ status: 'all' })
      : []
    const username = toUsername(key)
    const wanted = profile.user?.toLowerCase()
    const match =
      (wanted &&
        this.users.find(
          (user) => user.id === profile.user || user.username === wanted,
        )) ||
      this.users.find((user) => user.username === username) ||
      this.users.find((user) => sameText(user.displayName, displayName))
    if (match) {
      return {
        key,
        action: 'existing',
        id: match.id.startsWith(PLANNED) ? undefined : match.id,
        label: match.displayName,
      }
    }
    if (this.dryRun || !this.client) {
      this.users.push({
        id: `${PLANNED}${username}`,
        username,
        displayName,
      } as UserDetail)
      return { key, action: 'create', label: displayName }
    }

    const { data: created } = await this.client.users.createProfileOnly({
      displayName,
      username,
      avatar: profile.avatar,
      bio: profile.bio,
      url: profile.url,
      email: profile.email,
    })
    this.users.push(created)
    return { key, action: 'create', id: created.id, label: created.displayName }
  }
}

export class CategoryResolver {
  private categories?: Category[]
  private readonly resolved = new Map<string, Promise<ResolvedRef>>()

  constructor(
    private readonly client: BylineClient | null,
    private readonly profiles: Record<string, CategoryProfile>,
    private readonly dryRun: boolean,
  ) {}

  get all() {
    return Promise.all(this.resolved.values())
  }

  resolve(key: string): Promise<ResolvedRef> {
    let pending = this.resolved.get(key)
    if (!pending) {
      pending = this.lookup(key)
      this.resolved.set(key, pending)
    }
    return pending
  }

  private async lookup(key: string): Promise<ResolvedRef> {
    const profile = this.profiles[key] ?? {}
    const slug = (profile.slug ?? key).toLowerCase()
    const name = profile.name ?? titleCase(key)
    this.categories ??= this.client
      ? (await this.client.categories.list()).data
      : []
    const match =
      this.categories.find((category) => category.slug === slug) ||
      this.categories.find((category) => sameText(category.name, name))
    if (match) {
      return {
        key,
        action: 'existing',
        id: match.id.startsWith(PLANNED) ? undefined : match.id,
        label: match.name,
      }
    }
    if (this.dryRun || !this.client) {
      this.categories.push({ id: `${PLANNED}${slug}`, name, slug, type: 0 })
      return { key, action: 'create', label: name }
    }

    const { data: created } = await this.client.categories.create({
      name,
      slug,
    })
    this.categories.push(created)
    return { key, action: 'create', id: created.id, label: created.name }
  }
}
