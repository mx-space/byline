const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]'

export const camelcase = (key: string) =>
  key.replaceAll(/_([\da-z])/gi, (_, char: string) => char.toUpperCase())

const splitPath = (path: string) =>
  path
    .replaceAll('[]', '.[]')
    .split('.')
    .filter((segment) => segment.length > 0)

type PathTree = Map<string, PathTree | true>

const buildTree = (paths: readonly string[]): PathTree => {
  const root: PathTree = new Map()
  for (const path of paths) {
    const segments = splitPath(path)
    let node = root
    segments.forEach((segment, index) => {
      if (index === segments.length - 1) {
        node.set(segment, true)
        return
      }
      const next = node.get(segment)
      if (next === true) return
      const child: PathTree = next ?? new Map()
      node.set(segment, child)
      node = child
    })
  }
  return root
}

const walk = (value: unknown, tree: PathTree | undefined): unknown => {
  if (Array.isArray(value)) {
    const element = tree?.get('[]')
    if (element === true) return value
    return value.map((item) => walk(item, element))
  }
  if (!isPlainObject(value)) return value
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    const nextKey = camelcase(key)
    const branch = tree?.get(nextKey)
    out[nextKey] = branch === true ? item : walk(item, branch)
  }
  return out
}

export const camelcaseKeys = <T>(
  value: unknown,
  preservePaths: readonly string[] = [],
): T => walk(value, buildTree(preservePaths)) as T
