import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'

import { declsFor, splitVariants } from './emit-utilities.mjs'

const root = new URL('../src', import.meta.url).pathname
const dry = process.argv.includes('--dry')
const only = process.argv.find((arg) => arg.startsWith('--file='))?.slice(7)

function lobeDecls(decls) {
  if (decls.includes('rgb(') || decls.includes('#')) return null
  return decls.replace(/var\(--lobe-([a-z0-9-]+)\)/g, (_, name) => {
    const camel = name.replace(/-([a-z0-9])/g, (__, char) => char.toUpperCase())
    return `\${cssVar.${camel}}`
  })
}

function formatDecls(decls) {
  const safe = lobeDecls(decls)
  if (!safe) return null
  return safe
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `  ${part};`)
    .join('\n')
}

function tokenCss(token) {
  if (token === 'group') return { group: true }
  const [variants, util] = splitVariants(token)
  const decls = declsFor(util)
  if (typeof decls !== 'string') return null
  if (decls.startsWith('/*')) return { skip: true }
  if (decls === 'SPECIAL_DIVIDE') {
    return {
      css: '& > :not([hidden]) ~ :not([hidden]) {\n  border-top-width: 1px;\n  border-top-style: solid;\n}',
    }
  }
  if (decls.startsWith('SPECIAL_SPACE:')) {
    const [, prop, value] = decls.split(':')
    return {
      css: `& > :not([hidden]) ~ :not([hidden]) {\n  ${prop}: ${value};\n}`,
    }
  }
  const body = formatDecls(decls)
  if (!body) return null
  const withBorder = /border-.*-width/.test(body) && !body.includes('border-style')
    ? `${body}\n  border-style: solid;`
    : body

  const medias = []
  let selector = '&'
  for (const variant of variants) {
    if (variant === 'hover') selector += ':hover'
    else if (variant === 'focus') selector += ':focus'
    else if (variant === 'focus-visible') selector += ':focus-visible'
    else if (variant === 'focus-within') selector += ':focus-within'
    else if (variant === 'active') selector += ':active'
    else if (variant === 'disabled') selector += ':disabled'
    else if (variant === 'placeholder') selector += '::placeholder'
    else if (variant === 'first') selector += ':first-child'
    else if (variant === 'last') selector += ':last-child'
    else if (variant === 'dark') selector = `:where(.dark, .dark *) ${selector}`
    else if (variant === 'group-hover') selector = `.group:hover ${selector}`
    else if (variant === 'group-focus-within') selector = `.group:focus-within ${selector}`
    else if (variant === 'group-data-[selected]' || variant === 'group-data-selected')
      selector = `.group[data-selected] ${selector}`
    else if (variant === 'group-has-[[data-popup-open]]')
      selector = `.group:has([data-popup-open]) ${selector}`
    else if (variant === 'phone') medias.push('(max-width: 768px)')
    else if (variant === 'tablet') medias.push('(max-width: 1023px)')
    else if (variant === 'desktop' || variant === 'lg') medias.push('(min-width: 1024px)')
    else if (variant === 'md') medias.push('(min-width: 768px)')
    else if (variant === 'sm') medias.push('(min-width: 640px)')
    else if (variant === 'max-sm') medias.push('(max-width: 639px)')
    else if (variant === 'motion-reduce') medias.push('(prefers-reduced-motion: reduce)')
    else if (variant === '[@media(pointer:coarse)]') medias.push('(pointer: coarse)')
    else if (variant === '@3xl/desk') medias.push('(min-width: 48rem)')
    else if (variant === '[&>svg]') selector += ' > svg'
    else if (variant.startsWith('has-['))
      selector += `:has(${variant.slice(4).replace(/^\[/, '').replace(/\]$/, '')})`
    else if (variant.startsWith('data-[')) selector += `[data-${variant.slice(6, -1)}]`
    else if (variant.startsWith('data-')) selector += `[data-${variant.slice(5)}]`
    else return null
  }

  let css = selector === '&' ? withBorder : `${selector} {\n${withBorder}\n}`
  if (decls.includes('byline-spin')) {
    css = `@keyframes byline-spin { to { transform: rotate(360deg); } }\n${css}`
  }
  for (const media of medias.reverse()) css = `@media ${media} {\n${css}\n}`
  return { css }
}

function classBlock(text) {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const parts = []
  const unknown = []
  let hasGroup = false
  for (const token of tokens) {
    const piece = tokenCss(token)
    if (!piece) unknown.push(token)
    else if (piece.group) hasGroup = true
    else if (piece.css) parts.push(piece.css)
  }
  if (parts.length === 0) return null
  return {
    css: parts.join('\n'),
    hasGroup,
    unknown,
    usesVar: parts.some((part) => part.includes('cssVar.')),
  }
}

function styleKey(text) {
  return `u${createHash('sha1').update(text).digest('hex').slice(0, 8)}`
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'styles') continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx|ts)$/.test(name) && !name.includes('.test.')) out.push(path)
  }
  return out
}

function transform(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const used = new Map()
  const replacements = []

  function visit(node) {
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !isInsideImport(node)
    ) {
      const block = classBlock(node.text)
      if (block && block.css) {
        const key = styleKey(node.text)
        used.set(key, block)
        const extra = [...block.unknown, ...(block.hasGroup ? ['group'] : [])]
        const expression = extra.length
          ? `\`\${lobeStyles.${key}} ${extra.join(' ')}\``
          : `lobeStyles.${key}`
        const inAttribute = ts.isJsxAttribute(node.parent)
        replacements.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: inAttribute ? `{${expression}}` : expression,
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  if (used.size === 0) return null

  let next = source
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    next = next.slice(0, replacement.start) + replacement.text + next.slice(replacement.end)
  }

  const usesVar = [...used.values()].some((block) => block.usesVar)
  const factoryArgs = usesVar ? '{ css, cssVar }' : '{ css }'
  const rules = [...used.entries()]
    .map(([key, block]) => `  ${key}: css\`\n${block.css}\n  \`,`)
    .join('\n')

  if (next.includes('const lobeStyles = createStaticStyles')) {
    if (usesVar) {
      next = next.replace(
        'const lobeStyles = createStaticStyles(({ css }) => ({',
        'const lobeStyles = createStaticStyles(({ css, cssVar }) => ({',
      )
    }
    const marker = '\n}))'
    const at = next.indexOf('const lobeStyles = createStaticStyles')
    const end = next.indexOf(marker, at)
    next = next.slice(0, end) + '\n' + rules + next.slice(end)
    return next
  }

  const stylesConst = `\nconst lobeStyles = createStaticStyles((${factoryArgs}) => ({\n${rules}\n}))\n`

  if (!next.includes("from '@lobehub/ui'") && !next.includes('from "@lobehub/ui"')) {
    const importLine = `import { createStaticStyles } from '@lobehub/ui'\n`
    const firstImport = next.indexOf('import ')
    next = firstImport === -1 ? importLine + next : next.slice(0, firstImport) + importLine + next.slice(firstImport)
  } else {
    next = next.replace(
      /import\s*\{([^}]+)\}\s*from\s+(['"])@lobehub\/ui\2/,
      (full, names, quote) => {
        if (names.includes('createStaticStyles')) return full
        return `import { createStaticStyles,${names}} from ${quote}@lobehub/ui${quote}`
      },
    )
  }

  const importEnd = findImportEnd(next)
  next = next.slice(0, importEnd) + stylesConst + next.slice(importEnd)
  return next
}

function isInsideImport(node) {
  let current = node.parent
  while (current) {
    if (ts.isImportDeclaration(current)) return true
    current = current.parent
  }
  return false
}

function findImportEnd(source) {
  const sourceFile = ts.createSourceFile('file.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let end = 0
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) end = statement.end
    else break
  }
  return end
}

const files = only ? [join(root, only)] : walk(root)
let changed = 0
let missed = 0
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const literals = [...source.matchAll(/['"`]([^'"`\n]*\s+[^'"`\n]*)['"`]/g)]
  for (const match of literals) {
    const tokens = match[1].trim().split(/\s+/)
    if (tokens.some((token) => /^(flex|grid|text-|bg-|px-|gap-|border|hidden|items-|justify-)/.test(token))) {
      if (!classBlock(match[1])) missed += 1
    }
  }
  const next = transform(source, file)
  if (!next) continue
  changed += 1
  if (!dry) writeFileSync(file, next)
  else console.log(relative(root, file))
}
console.log(`${dry ? 'would change' : 'changed'} ${changed} files, unconverted class strings ${missed}`)
