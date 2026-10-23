import { UnresolvedExpression } from './jsx-attributes'

export type PropValueType = 'string' | 'number' | 'boolean' | 'json'

export interface ReplaceRule {
  pattern: string
  with?: string
  flags?: string
}

export interface StringTransform {
  replace: ReplaceRule[]
  reportUnmatched?: boolean
}

export type PropSpec =
  | string
  | {
      from?: string
      value?: unknown
      template?: string
      map?: Record<string, unknown>
      replace?: ReplaceRule[]
      default?: unknown
      type?: PropValueType
    }

export type ChildrenMode =
  | 'drop'
  | 'unwrap'
  | { state: string }
  | { cells: string }
  | { sections: string; heading: number; title?: StringTransform }

export interface NativeComponentMapping {
  node: string
  props?: Record<string, PropSpec>
  children?: ChildrenMode
  inline?: boolean
}

export interface DynamicComponentMapping {
  dynamic: {
    url: string
    initialHeight?: number
    props?: Record<string, PropSpec> | 'all'
  }
}

export interface MarkdownComponentMapping {
  markdown: string
}

export type ComponentMapping =
  | NativeComponentMapping
  | DynamicComponentMapping
  | MarkdownComponentMapping
  | { unwrap: true }
  | { skip: true }

export type UnknownComponentPolicy = 'placeholder' | 'skip' | 'unwrap'

export interface ComponentMap {
  components: Record<string, ComponentMapping>
  unknown: UnknownComponentPolicy
  placeholderUrl: string
}

export const DEFAULT_PLACEHOLDER_URL = 'urn:byline:unmapped-component:{name}'

export const BUILTIN_HTML_COMPONENTS: Record<string, ComponentMapping> = {
  img: {
    node: 'image',
    props: {
      src: 'src',
      altText: { from: 'alt', default: '' },
      width: { from: 'width', type: 'number' },
      height: { from: 'height', type: 'number' },
    },
  },
  video: {
    node: 'video',
    props: {
      src: 'src',
      poster: 'poster',
      width: { from: 'width', type: 'number' },
      height: { from: 'height', type: 'number' },
    },
  },
  p: { unwrap: true },
  div: { unwrap: true },
  span: { unwrap: true },
  center: { unwrap: true },
  picture: { unwrap: true },
  source: { skip: true },
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const toRegExp = (rule: ReplaceRule) =>
  new RegExp(rule.pattern, rule.flags ?? 'u')

const checkReplaceRules = (rules: unknown, where: string) => {
  if (!Array.isArray(rules)) {
    throw new TypeError(`${where}.replace must be an array`)
  }
  for (const rule of rules) {
    if (!isRecord(rule) || typeof rule.pattern !== 'string') {
      throw new TypeError(
        `${where}.replace needs a string pattern in every rule`,
      )
    }
    try {
      toRegExp(rule as unknown as ReplaceRule)
    } catch (error) {
      throw new Error(
        `${where}.replace pattern ${JSON.stringify(rule.pattern)} is invalid: ${(error as Error).message}`,
        { cause: error },
      )
    }
  }
}

export const applyReplace = (
  value: string,
  rules: readonly ReplaceRule[],
): { value: string; matched: boolean } => {
  let matched = false
  let next = value
  for (const rule of rules) {
    const regex = toRegExp(rule)
    if (!regex.test(next)) continue
    matched = true
    regex.lastIndex = 0
    next = next.replace(regex, rule.with ?? '')
  }
  return { value: next, matched }
}

export const parseComponentMap = (
  raw: unknown,
  source = 'component map',
): ComponentMap => {
  if (raw !== undefined && !isRecord(raw)) {
    throw new Error(`${source}: expected an object`)
  }
  const value = (raw ?? {}) as Record<string, unknown>
  const components = value.components ?? {}
  if (!isRecord(components)) {
    throw new Error(`${source}: "components" must be an object`)
  }
  for (const [name, mapping] of Object.entries(components)) {
    if (!isRecord(mapping)) {
      throw new Error(`${source}: components.${name} must be an object`)
    }
    const kinds = ['node', 'dynamic', 'markdown', 'unwrap', 'skip'].filter(
      (key) => key in mapping,
    )
    if (kinds.length !== 1) {
      throw new Error(
        `${source}: components.${name} needs exactly one of node, dynamic, markdown, unwrap, skip`,
      )
    }
    if ('markdown' in mapping && typeof mapping.markdown !== 'string') {
      throw new Error(`${source}: components.${name}.markdown must be a string`)
    }
    if (isRecord(mapping.props)) {
      for (const [prop, spec] of Object.entries(mapping.props)) {
        if (isRecord(spec) && 'replace' in spec) {
          checkReplaceRules(
            spec.replace,
            `${source}: components.${name}.props.${prop}`,
          )
        }
      }
    }
    const children = mapping.children
    if (isRecord(children) && 'sections' in children) {
      if (children.title !== undefined) {
        if (!isRecord(children.title)) {
          throw new TypeError(
            `${source}: components.${name}.children.title must be an object`,
          )
        }
        checkReplaceRules(
          children.title.replace,
          `${source}: components.${name}.children.title`,
        )
      }
      const { heading } = children
      if (
        typeof children.sections !== 'string' ||
        !Number.isInteger(heading) ||
        (heading as number) < 1 ||
        (heading as number) > 6
      ) {
        throw new Error(
          `${source}: components.${name}.children.sections needs a key and a heading depth from 1 to 6`,
        )
      }
    }
    if ('dynamic' in mapping) {
      const dynamic = mapping.dynamic
      if (!isRecord(dynamic) || typeof dynamic.url !== 'string') {
        throw new Error(`${source}: components.${name}.dynamic.url is required`)
      }
    }
  }
  const unknown = value.unknown ?? 'placeholder'
  if (!['placeholder', 'skip', 'unwrap'].includes(unknown as string)) {
    throw new Error(`${source}: "unknown" must be placeholder, skip or unwrap`)
  }
  const placeholderUrl = value.placeholderUrl ?? DEFAULT_PLACEHOLDER_URL
  if (typeof placeholderUrl !== 'string') {
    throw new Error(`${source}: "placeholderUrl" must be a string`)
  }
  return {
    components: components as Record<string, ComponentMapping>,
    unknown: unknown as UnknownComponentPolicy,
    placeholderUrl,
  }
}

export const resolveMapping = (
  map: ComponentMap,
  name: string,
): ComponentMapping | undefined =>
  map.components[name] ?? BUILTIN_HTML_COMPONENTS[name]

const coerce = (value: unknown, type: PropValueType | undefined): unknown => {
  if (value === undefined || value === null || !type) return value
  switch (type) {
    case 'string': {
      return typeof value === 'string' ? value : JSON.stringify(value)
    }
    case 'number': {
      const number = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(number) ? number : undefined
    }
    case 'boolean': {
      return value === 'false' ? false : Boolean(value)
    }
    case 'json': {
      if (typeof value !== 'string') return value
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
  }
}

const fillTemplate = (
  template: string,
  attributes: Record<string, unknown>,
) => {
  let missing = false
  const filled = template.replaceAll(/\{(\w+)\}/gu, (_, key: string) => {
    const value = attributes[key]
    if (
      value === undefined ||
      value === null ||
      value instanceof UnresolvedExpression
    ) {
      missing = true
      return ''
    }
    return encodeURIComponent(String(value))
  })
  return missing ? undefined : filled
}

export interface MappedProps {
  props: Record<string, unknown>
  unresolved: string[]
}

export const applyPropSpecs = (
  specs: Record<string, PropSpec> | undefined,
  attributes: Record<string, unknown>,
): MappedProps => {
  const props: Record<string, unknown> = {}
  const unresolved: string[] = []
  for (const [target, spec] of Object.entries(specs ?? {})) {
    const normalized = typeof spec === 'string' ? { from: spec } : spec
    let value =
      'value' in normalized
        ? normalized.value
        : normalized.template
          ? fillTemplate(normalized.template, attributes)
          : normalized.from
            ? attributes[normalized.from]
            : undefined
    if (value instanceof UnresolvedExpression) {
      unresolved.push(normalized.from ?? target)
      value = undefined
    }
    if (normalized.map && value !== undefined) {
      const key = String(value)
      value = key in normalized.map ? normalized.map[key] : normalized.default
    }
    if (normalized.replace && typeof value === 'string') {
      value = applyReplace(value, normalized.replace).value
    }
    value = coerce(value, normalized.type)
    if (value === undefined) value = normalized.default
    if (value !== undefined) props[target] = value
  }
  return { props, unresolved }
}
