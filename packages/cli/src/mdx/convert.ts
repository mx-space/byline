import type { ComponentMap } from './component-map'
import { parseComponentMap } from './component-map'
import type { LexicalState } from './lexical-nodes'
import { normalizeState } from './normalize'
import { type MdxFlavor, parseMarkdown, splitFrontmatter } from './parse'
import { type ConvertIssue, MdastToLexical } from './to-lexical'

export interface ConvertedDocument {
  frontmatter: Record<string, unknown>
  state: LexicalState
  markdown: string
  issues: ConvertIssue[]
  components: Record<string, number>
}

export interface ConvertOptions {
  componentMap?: ComponentMap
  flavor?: MdxFlavor
}

export const convertMdx = (
  source: string,
  options: ConvertOptions = {},
): ConvertedDocument => {
  const { data, body, bodyLineOffset } = splitFrontmatter(source)
  const tree = parseMarkdown(body, options.flavor)
  const converter = new MdastToLexical(
    options.componentMap ?? parseComponentMap(undefined),
  )
  const raw = converter.convert(tree)
  const { state, markdown } = normalizeState(raw)
  return {
    frontmatter: data,
    state,
    markdown,
    issues: converter.issues.map((issue) =>
      issue.line === undefined
        ? issue
        : { ...issue, line: issue.line + bodyLineOffset },
    ),
    components: converter.usedComponents,
  }
}
