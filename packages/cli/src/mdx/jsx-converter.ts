import type { Heading, PhrasingContent, RootContent } from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'

import {
  applyPropSpecs,
  applyReplace,
  type ComponentMap,
  type DynamicComponentMapping,
  type MarkdownComponentMapping,
  type NativeComponentMapping,
  resolveMapping,
  type StringTransform,
} from './component-map'
import {
  type JsxElement,
  readAttributes,
  toPlainValue,
  UnresolvedExpression,
} from './jsx-attributes'
import {
  dynamic,
  isInlineNode,
  type LexicalNode,
  lineBreak,
  paragraph,
  rootState,
  TEXT_FORMAT,
} from './lexical-nodes'
import { parseMarkdown } from './parse'
import type { InlineItem, MdastToLexical } from './to-lexical'
import { hasFlowChildren } from './to-lexical'

const INLINE_FORMAT_TAGS: Record<string, number> = {
  strong: TEXT_FORMAT.bold,
  b: TEXT_FORMAT.bold,
  em: TEXT_FORMAT.italic,
  i: TEXT_FORMAT.italic,
  del: TEXT_FORMAT.strikethrough,
  s: TEXT_FORMAT.strikethrough,
  u: TEXT_FORMAT.underline,
  code: TEXT_FORMAT.code,
  kbd: TEXT_FORMAT.code,
  sub: TEXT_FORMAT.subscript,
  sup: TEXT_FORMAT.superscript,
  mark: TEXT_FORMAT.highlight,
}

const INLINE_HTML = new Set(['a', 'br', ...Object.keys(INLINE_FORMAT_TAGS)])

const childText = (children: readonly unknown[]): string =>
  children
    .map((child) => {
      const node = child as { value?: unknown; children?: unknown[] }
      if (typeof node.value === 'string') return node.value
      return node.children ? childText(node.children) : ''
    })
    .join(' ')
    .replaceAll(/\s+/g, ' ')
    .trim()

const hasLink = (node: LexicalNode): boolean =>
  node.type === 'link' || (node.children ?? []).some(hasLink)

const plainText = (nodes: readonly PhrasingContent[]): string =>
  nodes
    .map((node) => {
      if ('value' in node && typeof node.value === 'string') return node.value
      if (node.type === 'break') return ' '
      return 'children' in node
        ? plainText(node.children as PhrasingContent[])
        : ''
    })
    .join('')
    .replaceAll(/\s+/g, ' ')
    .trim()

const isSectionHeading = (node: RootContent, depth: number): node is Heading =>
  node.type === 'heading' && node.depth === depth

const MARKDOWN_PUNCTUATION = /[!#()*<>[\\\]_`|~]/g

const isBlank = (node: RootContent) =>
  (node.type === 'text' && !node.value.trim()) ||
  (node.type === 'paragraph' && !childText(node.children))

export class JsxConverter {
  constructor(
    private readonly map: ComponentMap,
    private readonly host: MdastToLexical,
  ) {}

  flow(element: MdxJsxFlowElement): LexicalNode[] {
    const { name } = element
    if (!name) return this.host.childrenToBlocks(element.children)
    if (!this.map.components[name] && INLINE_HTML.has(name)) {
      if (hasFlowChildren(element.children)) {
        return this.inlineWrapperBlocks(element)
      }
      return this.host.paragraphs(this.inline(element as JsxElement, 0))
    }
    return this.host.paragraphs(this.component(element, 0))
  }

  private inlineWrapperBlocks(element: MdxJsxFlowElement): LexicalNode[] {
    const out = this.wrappedChildBlocks(element)
    if (element.name !== 'a') return out
    const { attributes } = readAttributes(element)
    const href = typeof attributes.href === 'string' ? attributes.href : ''
    const linked = out.some(
      (node) => node.type === 'paragraph' && hasLink(node),
    )
    if (!href || linked || !out.length) return out
    const title = typeof attributes.title === 'string' ? attributes.title : null
    return [...out, paragraph([this.host.linkAfterBlocks(href, title, out)])]
  }

  private wrappedChildBlocks(element: MdxJsxFlowElement): LexicalNode[] {
    return element.children.flatMap((child) => {
      if (child.type === 'paragraph') {
        const wrapped: MdxJsxTextElement = {
          type: 'mdxJsxTextElement',
          name: element.name,
          attributes: element.attributes,
          children: child.children,
          position: child.position,
        }
        return this.host.paragraphs(this.inline(wrapped, 0))
      }
      return this.host.blocks([child])
    })
  }

  inline(element: JsxElement, format: number): InlineItem[] {
    const { name } = element
    const children = element.children as PhrasingContent[]
    if (!name) return this.host.inline(children, format)
    if (!this.map.components[name]) {
      if (name === 'br') return [lineBreak()]
      if (name in INLINE_FORMAT_TAGS) {
        return this.host.inline(children, format | INLINE_FORMAT_TAGS[name])
      }
      if (name === 'a') {
        const { attributes } = readAttributes(element)
        const href = typeof attributes.href === 'string' ? attributes.href : ''
        if (!href) return this.host.inline(children, format)
        const title =
          typeof attributes.title === 'string' ? attributes.title : null
        return this.host.linkItems(href, title, children, format)
      }
    }
    return this.component(element, format)
  }

  private component(element: JsxElement, format: number): InlineItem[] {
    const name = element.name!
    this.host.countComponent(name)
    const mapping = resolveMapping(this.map, name)
    const line = element.position?.start.line
    if (!mapping) return this.unknown(element, format)
    if ('skip' in mapping) return []
    if ('unwrap' in mapping) return this.unwrapChildren(element, format)
    if ('dynamic' in mapping) {
      return [{ block: this.dynamicNode(element, mapping, line) }]
    }
    if ('markdown' in mapping) {
      return this.markdownBlocks(element, mapping, line).map((block) => ({
        block,
      }))
    }
    const mode = mapping.children
    if (
      typeof mode === 'object' &&
      'sections' in mode &&
      !(element.children as RootContent[]).some((child) =>
        isSectionHeading(child, mode.heading),
      )
    ) {
      this.host.report({
        kind: 'restructured',
        component: name,
        message: `<${name}> has no h${mode.heading} to split at; its children were unwrapped`,
        line,
      })
      return this.unwrapChildren(element, format)
    }
    const node = this.nativeNode(element, mapping)
    const inline = mapping.inline ?? isInlineNode(node)
    const items: InlineItem[] = inline ? [node] : [{ block: node }]
    if (mapping.children === 'unwrap') {
      items.push(...this.unwrapChildren(element, format))
    }
    return items
  }

  private unwrapChildren(element: JsxElement, format: number): InlineItem[] {
    const children = element.children as RootContent[]
    if (hasFlowChildren(children)) {
      return this.host.blocks(children).map((block) => ({ block }))
    }
    return this.host.inline(children as PhrasingContent[], format)
  }

  private reportUnresolved(name: string, props: string[], line?: number) {
    if (!props.length) return
    this.host.report({
      kind: 'unresolved-prop',
      component: name,
      message: `<${name}> props could not be evaluated statically: ${props.join(', ')}`,
      line,
    })
  }

  private nativeNode(
    element: JsxElement,
    mapping: NativeComponentMapping,
  ): LexicalNode {
    const name = element.name!
    const line = element.position?.start.line
    const { attributes, unresolved } = readAttributes(element)
    const mapped = applyPropSpecs(mapping.props, attributes)
    this.reportUnresolved(name, [...unresolved, ...mapped.unresolved], line)
    const node: LexicalNode = {
      ...mapped.props,
      type: mapping.node,
      version: 1,
    }
    const children = (element.children as RootContent[]).filter(
      (child) => !isBlank(child),
    )
    const mode = mapping.children ?? 'drop'

    if (mode === 'drop') {
      if (children.length && childText(children)) {
        this.host.report({
          kind: 'dropped-node',
          component: name,
          message: `<${name}> children dropped by the mapping`,
          line,
        })
      }
    } else if (typeof mode === 'object' && 'state' in mode) {
      node[mode.state] = rootState(this.host.childrenToBlocks(children))
    } else if (typeof mode === 'object' && 'cells' in mode) {
      node[mode.cells] = children.map((child) =>
        rootState(this.host.childrenToBlocks([child])),
      )
    } else if (typeof mode === 'object' && 'sections' in mode) {
      node[mode.sections] = this.sections(
        name,
        children,
        mode.heading,
        mode.title,
        line,
      )
    }
    return node
  }

  private sections(
    name: string,
    children: RootContent[],
    depth: number,
    titleTransform: StringTransform | undefined,
    line?: number,
  ) {
    const lead: RootContent[] = []
    const items: Array<{ title: string; body: RootContent[] }> = []
    for (const child of children) {
      if (isSectionHeading(child, depth)) {
        items.push({ title: plainText(child.children), body: [] })
      } else {
        ;(items.at(-1)?.body ?? lead).push(child)
      }
    }
    if (lead.length) {
      items[0].body.unshift(...lead)
      this.host.report({
        kind: 'restructured',
        component: name,
        message: `<${name}> content before the first h${depth} was moved into the first item`,
        line,
      })
    }
    const unmatched: string[] = []
    const titles = items.map((item) => {
      if (!titleTransform) return item.title
      const { value, matched } = applyReplace(
        item.title,
        titleTransform.replace,
      )
      if (!matched && titleTransform.reportUnmatched) unmatched.push(item.title)
      return value.trim()
    })
    if (unmatched.length) {
      this.host.report({
        kind: 'unmatched-replace',
        component: name,
        message: `<${name}> titles no replace rule matched: ${unmatched.map((title) => JSON.stringify(title)).join(', ')}`,
        line,
      })
    }
    return items.map((item, index) => ({
      id: `s${index + 1}`,
      title: titles[index],
      content: rootState(this.host.childrenToBlocks(item.body)),
    }))
  }

  private markdownBlocks(
    element: JsxElement,
    mapping: MarkdownComponentMapping,
    line?: number,
  ): LexicalNode[] {
    const name = element.name!
    const { attributes } = readAttributes(element)
    const missing = new Set<string>()
    const lines = mapping.markdown.split('\n').flatMap((templateLine) => {
      let complete = true
      const filled = templateLine.replaceAll(
        /\{(\w+)\}/gu,
        (_, key: string) => {
          const value = attributes[key]
          if (
            value === undefined ||
            value === null ||
            value === '' ||
            value instanceof UnresolvedExpression
          ) {
            complete = false
            missing.add(key)
            return ''
          }
          return String(value).replaceAll(MARKDOWN_PUNCTUATION, '\\$&')
        },
      )
      return complete ? [filled] : []
    })
    if (missing.size) {
      this.host.report({
        kind: 'unresolved-prop',
        component: name,
        message: `<${name}> template lines dropped for missing props: ${[...missing].join(', ')}`,
        line,
      })
    }
    if (childText(element.children)) {
      this.host.report({
        kind: 'dropped-node',
        component: name,
        message: `<${name}> is rendered from a markdown template; its children were dropped`,
        line,
      })
    }
    return this.host.childrenToBlocks(
      parseMarkdown(lines.join('\n'), 'md').children,
    )
  }

  private dynamicNode(
    element: JsxElement,
    mapping: DynamicComponentMapping,
    line?: number,
  ): LexicalNode {
    const name = element.name!
    const { attributes, unresolved } = readAttributes(element)
    const spec = mapping.dynamic.props ?? 'all'
    let props: Record<string, unknown>
    if (spec === 'all') {
      props = toPlainValue(attributes) as Record<string, unknown>
      this.reportUnresolved(name, unresolved, line)
    } else {
      const mapped = applyPropSpecs(spec, attributes)
      props = mapped.props
      this.reportUnresolved(name, mapped.unresolved, line)
    }
    if (childText(element.children)) {
      this.host.report({
        kind: 'dropped-node',
        component: name,
        message: `<${name}> is a dynamic node; its children are not translatable and were dropped`,
        line,
      })
    }
    return dynamic(mapping.dynamic.url, props, mapping.dynamic.initialHeight)
  }

  private unknown(element: JsxElement, format: number): InlineItem[] {
    const name = element.name!
    this.host.report({
      kind: 'unmapped-component',
      component: name,
      message: `<${name}> has no mapping (${this.map.unknown})`,
      line: element.position?.start.line,
    })
    switch (this.map.unknown) {
      case 'skip': {
        return []
      }
      case 'unwrap': {
        return this.unwrapChildren(element, format)
      }
      case 'placeholder': {
        const { attributes } = readAttributes(element)
        const text = childText(element.children)
        return [
          {
            block: dynamic(this.map.placeholderUrl.replaceAll('{name}', name), {
              component: name,
              props: toPlainValue(attributes),
              ...(text ? { children: text } : {}),
            }),
          },
        ]
      }
    }
  }
}
