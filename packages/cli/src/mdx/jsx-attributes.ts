import type { Expression, Node as EstreeNode, Program } from 'estree'
import type {
  MdxJsxAttribute,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from 'mdast-util-mdx-jsx'

export class UnresolvedExpression {
  constructor(readonly source: string) {}
}

const UNRESOLVED = Symbol('unresolved')

const evaluate = (node: EstreeNode | null | undefined): unknown => {
  if (!node) return UNRESOLVED
  switch (node.type) {
    case 'Literal': {
      return 'regex' in node || 'bigint' in node ? UNRESOLVED : node.value
    }
    case 'TemplateLiteral': {
      if (node.expressions.length) return UNRESOLVED
      return node.quasis.map((quasi) => quasi.value.cooked ?? '').join('')
    }
    case 'ArrayExpression': {
      const items = node.elements.map((element) =>
        element && element.type !== 'SpreadElement'
          ? evaluate(element)
          : UNRESOLVED,
      )
      return items.includes(UNRESOLVED) ? UNRESOLVED : items
    }
    case 'ObjectExpression': {
      const out: Record<string, unknown> = {}
      for (const property of node.properties) {
        if (property.type !== 'Property' || property.computed) return UNRESOLVED
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'Literal'
              ? String(property.key.value)
              : undefined
        const value = evaluate(property.value as Expression)
        if (key === undefined || value === UNRESOLVED) return UNRESOLVED
        out[key] = value
      }
      return out
    }
    case 'UnaryExpression': {
      const value = evaluate(node.argument)
      if (value === UNRESOLVED) return UNRESOLVED
      if (node.operator === '-' && typeof value === 'number') return -value
      if (node.operator === '+' && typeof value === 'number') return value
      if (node.operator === '!') return !value
      return UNRESOLVED
    }
    case 'Identifier': {
      return node.name === 'undefined' ? undefined : UNRESOLVED
    }
    default: {
      return UNRESOLVED
    }
  }
}

const evaluateProgram = (program: Program | undefined) => {
  const statement = program?.body[0]
  if (!statement || statement.type !== 'ExpressionStatement') return UNRESOLVED
  return evaluate(statement.expression)
}

export type JsxElement = MdxJsxFlowElement | MdxJsxTextElement

export interface ReadAttributesResult {
  attributes: Record<string, unknown>
  unresolved: string[]
}

export const readAttributes = (element: JsxElement): ReadAttributesResult => {
  const attributes: Record<string, unknown> = {}
  const unresolved: string[] = []
  for (const attribute of element.attributes as Array<
    MdxJsxAttribute | MdxJsxExpressionAttribute
  >) {
    if (attribute.type === 'mdxJsxExpressionAttribute') {
      const argument = evaluateSpread(
        attribute.data?.estree as Program | undefined,
      )
      if (
        argument &&
        typeof argument === 'object' &&
        !Array.isArray(argument)
      ) {
        Object.assign(attributes, argument)
      } else {
        unresolved.push(`{${attribute.value}}`)
      }
      continue
    }
    const { name, value } = attribute
    if (value === null || value === undefined) {
      attributes[name] = true
    } else if (typeof value === 'string') {
      attributes[name] = value
    } else {
      const evaluated = evaluateProgram(
        value.data?.estree as Program | undefined,
      )
      if (evaluated === UNRESOLVED) {
        attributes[name] = new UnresolvedExpression(value.value)
        unresolved.push(name)
      } else {
        attributes[name] = evaluated
      }
    }
  }
  return { attributes, unresolved }
}

const evaluateSpread = (program: Program | undefined) => {
  const statement = program?.body[0]
  if (statement?.type !== 'ExpressionStatement') return UNRESOLVED
  const expression = statement.expression
  if (expression.type !== 'ObjectExpression') return UNRESOLVED
  const [first] = expression.properties
  if (expression.properties.length !== 1 || first?.type !== 'SpreadElement') {
    return UNRESOLVED
  }
  return evaluate(first.argument)
}

export const toPlainValue = (value: unknown): unknown => {
  if (value instanceof UnresolvedExpression) return `{${value.source}}`
  if (Array.isArray(value)) return value.map(toPlainValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, toPlainValue(item)]),
    )
  }
  return value
}
