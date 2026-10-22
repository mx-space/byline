export interface LexicalNode {
  type: string
  version?: number
  children?: LexicalNode[]
  [key: string]: unknown
}

export interface LexicalState {
  root: LexicalNode & { type: 'root'; children: LexicalNode[] }
}

export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
  highlight: 128,
} as const

export type TextFormatName = keyof typeof TEXT_FORMAT

const elementBase = () => ({
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 1,
})

export const text = (value: string, format = 0): LexicalNode => ({
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  type: 'text',
  version: 1,
})

export const lineBreak = (): LexicalNode => ({ type: 'linebreak', version: 1 })

export const paragraph = (children: LexicalNode[]): LexicalNode => ({
  ...elementBase(),
  children,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
})

export const heading = (
  level: number,
  children: LexicalNode[],
): LexicalNode => ({
  ...elementBase(),
  children,
  tag: `h${Math.min(Math.max(level, 1), 6)}`,
  type: 'heading',
})

export const quote = (children: LexicalNode[]): LexicalNode => ({
  ...elementBase(),
  children,
  type: 'quote',
})

export const link = (
  url: string,
  children: LexicalNode[],
  title: string | null = null,
): LexicalNode => ({
  ...elementBase(),
  children,
  rel: null,
  target: null,
  title,
  type: 'link',
  url,
})

export type ListType = 'bullet' | 'number' | 'check'

export const list = (
  listType: ListType,
  children: LexicalNode[],
  start = 1,
): LexicalNode => ({
  ...elementBase(),
  children,
  listType,
  start,
  tag: listType === 'number' ? 'ol' : 'ul',
  type: 'list',
})

export const listItem = (
  children: LexicalNode[],
  value: number,
  checked?: boolean,
): LexicalNode => ({
  ...elementBase(),
  children,
  ...(checked === undefined ? {} : { checked }),
  type: 'listitem',
  value,
})

export const horizontalRule = (): LexicalNode => ({
  type: 'horizontalrule',
  version: 1,
})

export const codeBlock = (code: string, language: string): LexicalNode =>
  language.toLowerCase() === 'mermaid'
    ? { diagram: code, type: 'mermaid', version: 1 }
    : { code, language, type: 'code-block', version: 1 }

export const image = (props: {
  src: string
  altText?: string
  width?: number
  height?: number
  caption?: string
}): LexicalNode => ({
  altText: props.altText ?? '',
  src: props.src,
  ...(props.width ? { width: props.width } : {}),
  ...(props.height ? { height: props.height } : {}),
  ...(props.caption ? { caption: props.caption } : {}),
  type: 'image',
  version: 1,
})

export const tableCell = (
  children: LexicalNode[],
  header: boolean,
): LexicalNode => ({
  ...elementBase(),
  backgroundColor: null,
  children: [paragraph(children)],
  colSpan: 1,
  headerState: header ? 1 : 0,
  rowSpan: 1,
  type: 'tablecell',
})

export const tableRow = (children: LexicalNode[]): LexicalNode => ({
  ...elementBase(),
  children,
  type: 'tablerow',
})

export const table = (children: LexicalNode[]): LexicalNode => ({
  ...elementBase(),
  children,
  type: 'table',
})

export const dynamic = (
  url: string,
  props: Record<string, unknown>,
  initialHeight = 320,
): LexicalNode => ({ initialHeight, props, type: 'dynamic', url, version: 1 })

export const rootState = (children: LexicalNode[]): LexicalState => ({
  root: {
    ...elementBase(),
    children: children.length ? children : [paragraph([])],
    type: 'root',
  },
})

const INLINE_TYPES = new Set([
  'text',
  'linebreak',
  'link',
  'autolink',
  'spoiler',
  'ruby',
  'katex-inline',
  'mention',
  'footnote',
  'tag',
  'comment',
])

export const isInlineNode = (node: LexicalNode) => INLINE_TYPES.has(node.type)
