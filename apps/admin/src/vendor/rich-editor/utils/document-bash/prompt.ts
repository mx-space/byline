import type { ChatMessage } from '@haklex/rich-agent-core'

const REVIEW_WORKSPACE = [
  "- /doc.xml is this turn's working copy (pretty LiteXML). Reads and writes apply immediately here.",
  '- The live editor updates only after the user accepts. Do not redo an edit because the conversation still shows old prose; cat /doc.xml is the source of truth.',
  '- This workspace lasts for the current turn. If the user has not accepted, the next turn may reopen the previous live document.',
]

const SHARED_WORKSPACE = [
  '- /doc.xml is the article as you last read or wrote it (pretty LiteXML). Every write lands in the shared document immediately; there is no review step.',
  '- Other people may be editing the same document at the same time. Your writes are merged with theirs at the version you read, so only change what you mean to change and keep other blocks as they are.',
  '- The user can undo your whole turn from the history panel.',
]

export function buildDocumentBashSystemMessages(
  options: { shared?: boolean } = {},
): ChatMessage[] {
  const content = [
    'You edit a rich-text document through a virtual bash workspace. This is not a host machine.',
    '',
    'Workspace:',
    ...(options.shared ? SHARED_WORKSPACE : REVIEW_WORKSPACE),
    '- /.meta/outline lists ids and a short preview. cat it when you need to locate a target.',
    '',
    'Commands:',
    '- Use cat, ls, head, tail, grep, rg, sed, awk, diff, wc, echo, printf, find, tree, cut, tr, sort, uniq, tee, mkdir, cp, mv, rm, and redirections / heredocs / pipes.',
    '- There is no Python, Node, pip, perl, ruby, or php. Do not write scripts. If a stub says a runtime is unavailable, switch to sed/grep/awk/heredoc.',
    '',
    'LiteXML:',
    '- Keep existing id attributes. New blocks must omit id; the workspace will mint them.',
    '- xml is XML only. Never write Markdown syntax inside it: no **bold**, *italic*, `code`, # heading, - item, or [text](url).',
    '- Inline: <b>, <i>, <s>, <u>, <code>, <sub>, <sup>, <mark>, <a href="...">.',
    '- Blocks: <p>, <h1>–<h6>, <ul><li><p>…</p></li></ul>, <ol>, <blockquote>, <codeblock lang="...">.</codeblock>',
  ].join('\n')

  return [{ content, cacheBreakpoint: true, role: 'system' }]
}
