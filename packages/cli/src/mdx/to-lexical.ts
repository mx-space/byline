import type {
  Blockquote,
  Definition,
  FootnoteDefinition,
  List,
  ListItem,
  Nodes,
  PhrasingContent,
  Root,
  RootContent,
  Table,
} from 'mdast'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'

import type { ComponentMap } from './component-map'
import { JsxConverter } from './jsx-converter'
import {
  codeBlock,
  heading,
  horizontalRule,
  image,
  type LexicalNode,
  type LexicalState,
  lineBreak,
  link,
  list,
  listItem,
  paragraph,
  quote,
  rootState,
  table,
  tableCell,
  tableRow,
  text,
  TEXT_FORMAT,
} from './lexical-nodes'

export type IssueKind =
  | 'unmapped-component'
  | 'unresolved-prop'
  | 'dropped-node'
  | 'esm'
  | 'expression'

export interface ConvertIssue {
  kind: IssueKind
  message: string
  component?: string
  line?: number
}

export type InlineItem = LexicalNode | { block: LexicalNode }

const isBlockItem = (item: InlineItem): item is { block: LexicalNode } =>
  'block' in item && !('type' in item)

const FLOW_TYPES = new Set([
  'paragraph',
  'heading',
  'thematicBreak',
  'blockquote',
  'list',
  'code',
  'table',
  'html',
  'definition',
  'footnoteDefinition',
  'mdxJsxFlowElement',
  'mdxFlowExpression',
  'mdxjsEsm',
  'math',
])

const ALERT_TYPES: Record<string, string> = {
  note: 'note',
  tip: 'tip',
  important: 'important',
  warning: 'warning',
  caution: 'caution',
}

export const hasFlowChildren = (nodes: readonly Nodes[]) =>
  nodes.some((node) => FLOW_TYPES.has(node.type))

const plainText = (node: Nodes): string => {
  if ('value' in node && typeof node.value === 'string') return node.value
  if ('children' in node) return node.children.map(plainText).join('')
  return ''
}

export class MdastToLexical {
  readonly issues: ConvertIssue[] = []
  readonly usedComponents: Record<string, number> = {}
  private readonly definitions = new Map<string, Definition>()
  private readonly footnotes = new Map<string, string>()
  private readonly jsx: JsxConverter

  constructor(map: ComponentMap) {
    this.jsx = new JsxConverter(map, this)
  }

  convert(tree: Root): LexicalState {
    this.collectDefinitions(tree)
    const blocks = this.blocks(tree.children)
    if (this.footnotes.size) {
      blocks.push({
        definitions: Object.fromEntries(this.footnotes),
        type: 'footnote-section',
        version: 1,
      })
    }
    return rootState(blocks)
  }

  report(issue: ConvertIssue) {
    this.issues.push(issue)
  }

  countComponent(name: string) {
    this.usedComponents[name] = (this.usedComponents[name] ?? 0) + 1
  }

  blocks(nodes: readonly RootContent[]): LexicalNode[] {
    return nodes.flatMap((node) => this.block(node))
  }

  childrenToBlocks(children: readonly RootContent[]): LexicalNode[] {
    if (hasFlowChildren(children)) return this.blocks(children)
    return this.paragraphs(this.inline(children as PhrasingContent[]))
  }

  paragraphs(items: InlineItem[]): LexicalNode[] {
    const out: LexicalNode[] = []
    let current: LexicalNode[] = []
    const flush = () => {
      if (current.some((node) => node.type !== 'text' || node.text !== '')) {
        trimEdges(current)
        if (current.length) out.push(paragraph(current))
      }
      current = []
    }
    for (const item of items) {
      if (isBlockItem(item)) {
        flush()
        out.push(item.block)
      } else {
        current.push(item)
      }
    }
    flush()
    return out
  }

  private block(node: RootContent): LexicalNode[] {
    switch (node.type) {
      case 'paragraph': {
        return this.paragraphs(this.inline(node.children))
      }
      case 'heading': {
        return this.withLiftedBlocks(this.inline(node.children), (children) =>
          heading(node.depth, children),
        )
      }
      case 'thematicBreak': {
        return [horizontalRule()]
      }
      case 'code': {
        return [codeBlock(node.value, node.lang ?? '')]
      }
      case 'blockquote': {
        return this.blockquote(node)
      }
      case 'list': {
        return this.list(node)
      }
      case 'table': {
        return [this.table(node)]
      }
      case 'html': {
        return node.value.trim() ? [paragraph([text(node.value)])] : []
      }
      case 'mdxJsxFlowElement': {
        return this.jsx.flow(node as MdxJsxFlowElement)
      }
      case 'mdxjsEsm': {
        this.report({
          kind: 'esm',
          message: 'import/export statement dropped',
          line: node.position?.start.line,
        })
        return []
      }
      case 'mdxFlowExpression': {
        this.reportExpression(node.value, node.position?.start.line)
        return []
      }
      case 'definition':
      case 'footnoteDefinition': {
        return []
      }
      default: {
        this.report({
          kind: 'dropped-node',
          message: `unsupported markdown node "${node.type}" dropped`,
          line: node.position?.start.line,
        })
        return []
      }
    }
  }

  inline(nodes: readonly PhrasingContent[], format = 0): InlineItem[] {
    return nodes.flatMap((node) => this.inlineNode(node, format))
  }

  private inlineNode(node: PhrasingContent, format: number): InlineItem[] {
    switch (node.type) {
      case 'text': {
        return node.value ? [text(joinSoftBreaks(node.value), format)] : []
      }
      case 'strong': {
        return this.inline(node.children, format | TEXT_FORMAT.bold)
      }
      case 'emphasis': {
        return this.inline(node.children, format | TEXT_FORMAT.italic)
      }
      case 'delete': {
        return this.inline(node.children, format | TEXT_FORMAT.strikethrough)
      }
      case 'inlineCode': {
        return [text(node.value, format | TEXT_FORMAT.code)]
      }
      case 'break': {
        return [lineBreak()]
      }
      case 'link': {
        return this.linkItems(
          node.url,
          node.title ?? null,
          node.children,
          format,
        )
      }
      case 'linkReference': {
        const definition = this.definitions.get(node.identifier.toLowerCase())
        if (!definition) return this.inline(node.children, format)
        return this.linkItems(
          definition.url,
          definition.title ?? null,
          node.children,
          format,
        )
      }
      case 'image': {
        return [{ block: image({ src: node.url, altText: node.alt ?? '' }) }]
      }
      case 'imageReference': {
        const definition = this.definitions.get(node.identifier.toLowerCase())
        return definition
          ? [{ block: image({ src: definition.url, altText: node.alt ?? '' }) }]
          : []
      }
      case 'footnoteReference': {
        return [{ identifier: node.identifier, type: 'footnote', version: 1 }]
      }
      case 'mdxJsxTextElement': {
        return this.jsx.inline(node as MdxJsxTextElement, format)
      }
      case 'mdxTextExpression': {
        this.reportExpression(node.value, node.position?.start.line)
        return []
      }
      case 'html': {
        return [text(node.value, format)]
      }
      default: {
        const unknown = node as Nodes
        this.report({
          kind: 'dropped-node',
          message: `unsupported inline node "${unknown.type}" dropped`,
          line: unknown.position?.start.line,
        })
        return []
      }
    }
  }

  linkItems(
    url: string,
    title: string | null,
    children: readonly PhrasingContent[],
    format: number,
  ): InlineItem[] {
    const items = this.inline(children, format)
    const inline = items.filter((item) => !isBlockItem(item)) as LexicalNode[]
    const blocks = items.filter(isBlockItem)
    if (inline.length) return [link(url, inline, title), ...blocks]
    if (!blocks.length) return []
    return [
      ...blocks,
      this.linkAfterBlocks(
        url,
        title,
        blocks.map((item) => item.block),
        format,
      ),
    ]
  }

  linkAfterBlocks(
    url: string,
    title: string | null,
    blocks: readonly LexicalNode[],
    format = 0,
  ): LexicalNode {
    const altText = blocks
      .map((block) => block.altText)
      .find((value) => typeof value === 'string' && value.trim())
    return link(url, [text(String(altText ?? url).trim(), format)], title)
  }

  withLiftedBlocks(
    items: InlineItem[],
    build: (children: LexicalNode[]) => LexicalNode,
  ): LexicalNode[] {
    const inline = items.filter((item) => !isBlockItem(item)) as LexicalNode[]
    const blocks = items.filter(isBlockItem).map((item) => item.block)
    return [build(inline), ...blocks]
  }

  private reportExpression(value: string, line?: number) {
    const trimmed = value.trim()
    if (/^\/\*.*\*\/$/s.test(trimmed) || trimmed === '') return
    this.report({
      kind: 'expression',
      message: `JS expression {${trimmed.slice(0, 60)}} dropped`,
      line,
    })
  }

  private blockquote(node: Blockquote): LexicalNode[] {
    const [first, ...rest] = node.children
    const marker =
      first?.type === 'paragraph' && first.children[0]?.type === 'text'
        ? /^\[!(\w+)\]\s*/u.exec(first.children[0].value)
        : null
    const alertType = marker ? ALERT_TYPES[marker[1].toLowerCase()] : undefined
    if (marker && alertType && first?.type === 'paragraph') {
      const [head, ...tail] = first.children
      const remainder = (head as { value: string }).value.slice(
        marker[0].length,
      )
      const body: RootContent[] = [
        ...(remainder.trim() || tail.length
          ? [
              {
                ...first,
                children: [
                  ...(remainder.trim()
                    ? [{ type: 'text', value: remainder } as PhrasingContent]
                    : []),
                  ...tail,
                ],
              },
            ]
          : []),
        ...rest,
      ]
      return [
        {
          alertType,
          content: rootState(this.blocks(body)),
          type: 'alert-quote',
          version: 1,
        },
      ]
    }

    const inline: InlineItem[] = []
    const trailing: LexicalNode[] = []
    node.children.forEach((child, index) => {
      if (child.type === 'paragraph') {
        if (index > 0 && inline.length) inline.push(lineBreak(), lineBreak())
        inline.push(...this.inline(child.children))
      } else {
        trailing.push(...this.block(child))
      }
    })
    return [...this.withLiftedBlocks(inline, quote), ...trailing]
  }

  private list(node: List): LexicalNode[] {
    const isTask = node.children.some(
      (item) => typeof item.checked === 'boolean',
    )
    const listType = isTask ? 'check' : node.ordered ? 'number' : 'bullet'
    const out: LexicalNode[] = []
    let start = node.start ?? 1
    let value = start
    let items: LexicalNode[] = []
    const flush = () => {
      if (items.length) out.push(list(listType, items, start))
      items = []
      start = value
    }
    for (const item of node.children) {
      const { inline, nested, blocks } = this.listItemParts(item)
      items.push(
        listItem(inline, value, isTask ? Boolean(item.checked) : undefined),
      )
      value++
      for (const child of nested) items.push(listItem([child], value))
      if (blocks.length) {
        flush()
        out.push(...blocks)
      }
    }
    flush()
    return out
  }

  private listItemParts(item: ListItem) {
    const inline: LexicalNode[] = []
    const nested: LexicalNode[] = []
    const blocks: LexicalNode[] = []
    for (const child of item.children) {
      if (child.type === 'paragraph') {
        if (inline.length) inline.push(lineBreak())
        for (const part of this.inline(child.children)) {
          if (isBlockItem(part)) blocks.push(part.block)
          else inline.push(part)
        }
      } else if (child.type === 'list') {
        const converted = this.list(child)
        for (const node of converted) {
          if (node.type === 'list') nested.push(node)
          else blocks.push(node)
        }
      } else {
        blocks.push(...this.block(child))
      }
    }
    return { inline, nested, blocks }
  }

  private table(node: Table): LexicalNode {
    return table(
      node.children.map((row, rowIndex) =>
        tableRow(
          row.children.map((cell) => {
            const items = this.inline(cell.children)
            const inline = items.filter(
              (item) => !isBlockItem(item),
            ) as LexicalNode[]
            return tableCell(inline, rowIndex === 0)
          }),
        ),
      ),
    )
  }

  private collectDefinitions(tree: Root) {
    const visit = (node: Nodes) => {
      if (node.type === 'definition') {
        this.definitions.set(node.identifier.toLowerCase(), node)
      } else if (node.type === 'footnoteDefinition') {
        this.footnotes.set(
          node.identifier,
          (node as FootnoteDefinition).children.map(plainText).join('\n'),
        )
      }
      if ('children' in node) node.children.forEach(visit)
    }
    visit(tree)
  }
}

const CJK = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/

const joinSoftBreaks = (value: string) =>
  value.replaceAll(/[\t ]*\n[\t ]*/g, (match, offset: number) => {
    const before = value[offset - 1] ?? ''
    const after = value[offset + match.length] ?? ''
    return CJK.test(before) && CJK.test(after) ? '' : ' '
  })

const trimEdges = (nodes: LexicalNode[]) => {
  while (nodes[0]?.type === 'linebreak') nodes.shift()
  while (nodes.at(-1)?.type === 'linebreak') nodes.pop()
  const first = nodes[0]
  if (first?.type === 'text' && typeof first.text === 'string') {
    first.text = first.text.trimStart()
  }
  const last = nodes.at(-1)
  if (last?.type === 'text' && typeof last.text === 'string') {
    last.text = last.text.trimEnd()
  }
  for (let index = nodes.length - 1; index >= 0; index--) {
    const node = nodes[index]
    if (node.type === 'text' && node.text === '') nodes.splice(index, 1)
  }
}
