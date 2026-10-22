import { readFile } from 'node:fs/promises'
import path from 'node:path'

import {
  type ComponentMap,
  parseComponentMap,
  type UnknownComponentPolicy,
} from '../mdx/component-map'
import { assertMappableNodeTypes } from '../mdx/normalize'

export interface AuthorProfile {
  displayName?: string
  avatar?: string
  bio?: string
  url?: string
  email?: string
  user?: string
}

export interface CategoryProfile {
  name?: string
  slug?: string
}

export interface ImportConfig {
  sourceLocale: string
  localeAliases: Record<string, string>
  componentMap: ComponentMap
  authors: Record<string, AuthorProfile>
  categories: Record<string, CategoryProfile>
  defaultCategory?: string
  defaultAuthors: string[]
}

export interface ImportConfigOverrides {
  configPath?: string
  mapPath?: string
  authorsPath?: string
  sourceLocale?: string
  localeAliases?: Record<string, string>
  unknown?: UnknownComponentPolicy
  defaultCategory?: string
  defaultAuthors?: string[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const readJson = async (file: string): Promise<unknown> => {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read ${file}: ${(error as Error).message}`, {
      cause: error,
    })
  }
}

const loadSection = async (
  value: unknown,
  baseDir: string,
): Promise<unknown> =>
  typeof value === 'string' ? readJson(path.resolve(baseDir, value)) : value

const stringRecord = (value: unknown, label: string) => {
  if (value === undefined) return {}
  if (!isRecord(value)) throw new Error(`${label} must be an object`)
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (typeof item !== 'string') {
        throw new Error(`${label}.${key} must be a string`)
      }
      return [key, item]
    }),
  )
}

const profileRecord = <T>(value: unknown, label: string) => {
  if (value === undefined) return {} as Record<string, T>
  if (!isRecord(value)) throw new Error(`${label} must be an object`)
  for (const [key, item] of Object.entries(value)) {
    if (!isRecord(item)) throw new Error(`${label}.${key} must be an object`)
  }
  return value as Record<string, T>
}

export const loadImportConfig = async (
  overrides: ImportConfigOverrides = {},
): Promise<ImportConfig> => {
  const configDir = overrides.configPath
    ? path.dirname(path.resolve(overrides.configPath))
    : process.cwd()
  const file = overrides.configPath
    ? await readJson(path.resolve(overrides.configPath))
    : {}
  if (!isRecord(file)) throw new Error('Import config must be a JSON object')

  const componentsRaw = overrides.mapPath
    ? await readJson(path.resolve(overrides.mapPath))
    : await loadSection(file.components, configDir)
  const componentMap = parseComponentMap(
    isRecord(componentsRaw) && !('components' in componentsRaw)
      ? { components: componentsRaw }
      : componentsRaw,
    overrides.mapPath ?? 'components',
  )
  if (overrides.unknown) componentMap.unknown = overrides.unknown
  assertMappableNodeTypes(componentMap)

  const authorsRaw = overrides.authorsPath
    ? await readJson(path.resolve(overrides.authorsPath))
    : await loadSection(file.authors, configDir)

  const sourceLocale =
    overrides.sourceLocale ??
    (typeof file.sourceLocale === 'string' ? file.sourceLocale : 'en')

  const defaultAuthors =
    overrides.defaultAuthors ??
    (Array.isArray(file.defaultAuthors) ? file.defaultAuthors.map(String) : [])

  return {
    sourceLocale,
    localeAliases: {
      ...stringRecord(file.localeAliases, 'localeAliases'),
      ...overrides.localeAliases,
    },
    componentMap,
    authors: profileRecord<AuthorProfile>(authorsRaw, 'authors'),
    categories: profileRecord<CategoryProfile>(file.categories, 'categories'),
    defaultCategory:
      overrides.defaultCategory ??
      (typeof file.defaultCategory === 'string'
        ? file.defaultCategory
        : undefined),
    defaultAuthors,
  }
}
