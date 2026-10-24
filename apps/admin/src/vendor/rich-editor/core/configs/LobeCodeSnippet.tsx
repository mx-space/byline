import type {
  CodeFile,
  CodeSnippetRendererProps,
} from '@haklex/rich-ext-code-snippet/node'
import { Flexbox, Highlighter, Segmented } from '@lobehub/ui'
import { useState } from 'react'

const EXTENSION_LANGUAGE: Record<string, string> = {
  c: 'c',
  cpp: 'cpp',
  css: 'css',
  go: 'go',
  html: 'html',
  java: 'java',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  md: 'markdown',
  php: 'php',
  py: 'python',
  rb: 'ruby',
  rs: 'rust',
  scss: 'scss',
  sh: 'bash',
  sql: 'sql',
  svelte: 'svelte',
  swift: 'swift',
  toml: 'toml',
  ts: 'typescript',
  tsx: 'tsx',
  vue: 'vue',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
}

function snippetLanguage(file: CodeFile) {
  if (file.language && file.language !== 'text') return file.language
  const extension = file.filename.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_LANGUAGE[extension] ?? 'plaintext'
}

export function LobeCodeSnippetRenderer({ files }: CodeSnippetRendererProps) {
  const [active, setActive] = useState(0)
  const index = Math.min(active, Math.max(files.length - 1, 0))
  const file = files[index]
  if (!file) return null

  return (
    <Flexbox gap={8}>
      {files.length > 1 ? (
        <Segmented
          block
          onChange={(value) => setActive(Number(value))}
          options={files.map((item, itemIndex) => ({
            label: item.filename,
            value: String(itemIndex),
          }))}
          value={String(index)}
        />
      ) : null}
      <Highlighter
        fileName={file.filename}
        fullFeatured
        language={snippetLanguage(file)}
        variant="filled"
      >
        {file.code}
      </Highlighter>
    </Flexbox>
  )
}
