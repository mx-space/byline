import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = new URL('../src', import.meta.url).pathname

const SPACING = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  4.5: '1.125rem',
  5: '1.25rem',
  5.5: '1.375rem',
  6: '1.5rem',
  7: '1.75rem',
  7.5: '1.875rem',
  8: '2rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
  120: '30rem',
  136: '34rem',
}

const TEXT = {
  xs: ['0.625rem', '0.875rem'],
  sm: ['0.75rem', '1.125rem'],
  base: ['0.875rem', '1.375rem'],
  lg: ['1rem', '1.5rem'],
  xl: ['1.125rem', '1.625rem'],
  '2xl': ['1.25rem', '1.75rem'],
  '3xl': ['1.5rem', '2rem'],
  '4xl': ['2.25rem', '2.5rem'],
}

const NEUTRAL = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
}
const RED = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
}
const AMBER = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
}
const EMERALD = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
}
const SKY = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
}
const BLUE = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  950: '#172554',
}
const GREEN = { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' }
const PURPLE = { 400: '#c084fc', 700: '#7e22ce' }
const YELLOW = { 400: '#facc15', 500: '#eab308' }
const ORANGE = { 500: '#f97316' }
const ROSE = { 500: '#f43f5e' }

const PALETTES = {
  neutral: NEUTRAL,
  red: RED,
  amber: AMBER,
  emerald: EMERALD,
  sky: SKY,
  blue: BLUE,
  green: GREEN,
  purple: PURPLE,
  yellow: YELLOW,
  orange: ORANGE,
  rose: ROSE,
  zinc: NEUTRAL,
  stone: NEUTRAL,
  slate: NEUTRAL,
  gray: NEUTRAL,
}

const SEMANTIC = {
  fg: 'var(--lobe-color-text)',
  'fg-muted': 'var(--lobe-color-text-secondary)',
  'fg-subtle': 'var(--lobe-color-text-tertiary)',
  background: 'var(--lobe-color-bg-layout)',
  'surface-page': 'var(--lobe-color-bg-layout)',
  'surface-card': 'var(--lobe-color-bg-container)',
  'surface-inset': 'var(--lobe-color-fill-secondary)',
  'surface-overlay': 'var(--lobe-color-bg-elevated)',
  border: 'var(--lobe-color-border-secondary)',
  'border-strong': 'var(--lobe-color-border)',
  accent: 'var(--lobe-color-primary)',
  'accent-hover': 'var(--lobe-color-primary-hover)',
  'accent-soft': 'var(--lobe-color-primary-bg)',
  white: 'var(--lobe-color-bg-container)',
  black: 'var(--lobe-color-text)',
  transparent: 'transparent',
  current: 'currentColor',
  inherit: 'inherit',
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(tsx|ts|css)$/.test(name) && !name.includes('.test.')) out.push(path)
  }
  return out
}

function pick(map, key) {
  return Object.hasOwn(map, key) ? map[key] : undefined
}

function collectClasses(text) {
  const found = new Set()
  const patterns = [
    /className=(?:\{[^}]*\})?[`'"]([^`'"]+)[`'"]/g,
    /@apply\s+([^;]+);/g,
    /(?:className|cn)\(\s*[`'"]([^`'"]+)[`'"]/g,
  ]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      for (const token of match[1].split(/\s+/)) {
        if (!token || token.includes('${') || /[=(),]/.test(token) || /[A-Z]/.test(token)) continue
        if (/^[a-z@!\[]/.test(token)) found.add(token.replace(/^!/, '').replace(/!$/, ''))
      }
    }
  }
  return found
}

export function splitVariants(token) {
  const parts = []
  let buf = ''
  let depth = 0
  for (const ch of token) {
    if (ch === '[') depth += 1
    else if (ch === ']') depth -= 1
    if (ch === ':' && depth === 0) {
      parts.push(buf)
      buf = ''
    } else buf += ch
  }
  parts.push(buf)
  return [parts.slice(0, -1), parts.at(-1)]
}

function space(value) {
  if (value in SPACING) return SPACING[value]
  if (value === 'auto') return 'auto'
  if (value === 'full') return '100%'
  if (value === 'screen') return '100vw'
  if (value === 'dvh') return '100dvh'
  if (value === 'dvw') return '100dvw'
  if (value === 'svh') return '100svh'
  if (value === 'fit') return 'fit-content'
  if (value === 'min') return 'min-content'
  if (value === 'max') return 'max-content'
  if (value === 'none') return 'none'
  if (/^\d+\/\d+$/.test(value)) {
    const [a, b] = value.split('/')
    return `${(Number(a) / Number(b)) * 100}%`
  }
  return null
}

function paint(name, opacity) {
  const base = SEMANTIC[name]
  if (!base) return null
  if (!opacity) return base
  const percent = opacity.includes('.')
    ? Number(opacity) * 100
    : Number(opacity)
  return `color-mix(in srgb, ${base} ${percent}%, transparent)`
}

function paletteColor(token, opacity) {
  const semantic = paint(token, opacity)
  if (semantic) return semantic
  const match = token.match(
    /^(neutral|red|amber|emerald|sky|blue|green|purple|yellow|orange|rose|zinc|stone|slate|gray)-(\d+)$/,
  )
  if (!match) return null
  const family = match[1]
  const shade = Number(match[2])
  let base = 'var(--lobe-color-fill-secondary)'
  if (family === 'red' || family === 'rose') base = shade < 300 ? 'var(--lobe-color-error-bg)' : 'var(--lobe-color-error)'
  else if (family === 'emerald' || family === 'green')
    base = shade < 300 ? 'var(--lobe-color-success-bg)' : 'var(--lobe-color-success)'
  else if (family === 'amber' || family === 'yellow' || family === 'orange')
    base = shade < 300 ? 'var(--lobe-color-warning-bg)' : 'var(--lobe-color-warning)'
  else if (family === 'blue' || family === 'sky' || family === 'purple')
    base = shade < 300 ? 'var(--lobe-color-info-bg)' : 'var(--lobe-color-info)'
  else if (shade >= 700) base = 'var(--lobe-color-text)'
  else if (shade >= 400) base = 'var(--lobe-color-text-secondary)'
  if (!opacity) return base
  const percent = opacity.includes('.') ? Number(opacity) * 100 : Number(opacity)
  return `color-mix(in srgb, ${base} ${percent}%, transparent)`
}

function colorOf(raw) {
  const [name, opacity] = raw.split('/')
  return paletteColor(name, opacity)
}

function sizeOf(raw) {
  if (raw?.startsWith('[') && raw.endsWith(']')) return raw.slice(1, -1)
  return space(raw)
}

export function declsFor(util) {
  if (util.startsWith('[') && util.endsWith(']') && util.includes(':')) {
    const body = util.slice(1, -1)
    const idx = body.indexOf(':')
    return `${body.slice(0, idx)}:${body.slice(idx + 1)}`
  }

  const arbitrary = util.match(/^([a-z-]+)-\[(.+)\]$/)
  if (arbitrary) {
    const [, name, value] = arbitrary
    const mapped = {
      w: 'width',
      h: 'height',
      'min-w': 'min-width',
      'min-h': 'min-height',
      'max-w': 'max-width',
      'max-h': 'max-height',
      size: 'width',
      basis: 'flex-basis',
      z: 'z-index',
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
      inset: 'inset',
      p: 'padding',
      px: 'padding-inline',
      py: 'padding-block',
      m: 'margin',
      mt: 'margin-top',
      mb: 'margin-bottom',
      gap: 'gap',
      text: 'font-size',
      leading: 'line-height',
      tracking: 'letter-spacing',
      rounded: 'border-radius',
      opacity: 'opacity',
      order: 'order',
    }[name]
    if (name === 'bg' || name === 'text' || name === 'border') {
      const cssProp = name === 'bg' ? 'background-color' : name === 'text' ? 'color' : 'border-color'
      const mapped = value
        .replaceAll('var(--color-primary)', 'var(--lobe-color-primary)')
        .replaceAll('var(--color-primary-shallow)', 'var(--lobe-color-primary-hover)')
        .replaceAll('var(--color-fg)', 'var(--lobe-color-text)')
      return `${cssProp}:${mapped}`
    }
    if (name === 'grid-cols') return `grid-template-columns:${value}`
    if (name === 'grid-rows') return `grid-template-rows:${value}`
    if (name === 'flex') return `flex:${value}`
    if (name === 'transition') return `transition-property:${value}`
    if (name === 'ring') return `box-shadow:0 0 0 ${value} var(--lobe-color-primary)`
    if (name === 'size') return `width:${value};height:${value}`
    if (mapped) return `${mapped}:${value}`
  }

  const display = pick(
    {
      flex: 'display:flex',
      'inline-flex': 'display:inline-flex',
      grid: 'display:grid',
      'inline-grid': 'display:inline-grid',
      block: 'display:block',
      'inline-block': 'display:inline-block',
      inline: 'display:inline',
      hidden: 'display:none',
      contents: 'display:contents',
      'list-item': 'display:list-item',
      table: 'display:table',
    },
    util,
  )
  if (display) return display

  const flexDir = pick(
    {
      'flex-row': 'flex-direction:row',
      'flex-col': 'flex-direction:column',
      'flex-row-reverse': 'flex-direction:row-reverse',
      'flex-col-reverse': 'flex-direction:column-reverse',
      'flex-wrap': 'flex-wrap:wrap',
      'flex-nowrap': 'flex-wrap:nowrap',
      'flex-1': 'flex:1 1 0%',
      'flex-auto': 'flex:1 1 auto',
      'flex-none': 'flex:none',
      'flex-initial': 'flex:0 1 auto',
      'shrink-0': 'flex-shrink:0',
      shrink: 'flex-shrink:1',
      grow: 'flex-grow:1',
      'grow-0': 'flex-grow:0',
    },
    util,
  )
  if (flexDir) return flexDir

  const align = util.match(
    /^(items|justify|content|self|place-items|place-content)-(.+)$/,
  )
  if (align) {
    const prop = {
      items: 'align-items',
      justify: 'justify-content',
      content: 'align-content',
      self: 'align-self',
      'place-items': 'place-items',
      'place-content': 'place-content',
    }[align[1]]
    const raw = align[2]
    const value =
      raw === 'start' || raw === 'end'
        ? `flex-${raw}`
        : raw === 'between' || raw === 'around' || raw === 'evenly'
          ? `space-${raw}`
          : raw
    if (prop) return `${prop}:${value}`
  }

  const gap = util.match(/^gap(?:-([xy]))?-(.+)$/)
  if (gap && sizeOf(gap[2])) {
    const prop = gap[1] === 'x' ? 'column-gap' : gap[1] === 'y' ? 'row-gap' : 'gap'
    return `${prop}:${sizeOf(gap[2])}`
  }

  const spaceY = util.match(/^space-([xy])-(.+)$/)
  if (spaceY && sizeOf(spaceY[2])) {
    const prop = spaceY[1] === 'y' ? 'margin-top' : 'margin-left'
    return `SPECIAL_SPACE:${prop}:${sizeOf(spaceY[2])}`
  }

  const pad = util.match(
    /^(-)?(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|inset-x|inset-y|inset|top|right|bottom|left|w|h|size|min-w|min-h|max-w|max-h|basis)-(.+)$/,
  )
  if (pad) {
    const negative = pad[1] === '-'
    const kind = pad[2]
    const raw = sizeOf(pad[3])
    if (raw) {
    const value = negative ? `calc(${raw} * -1)` : raw
    const map = {
      p: 'padding',
      px: 'padding-inline',
      py: 'padding-block',
      pt: 'padding-top',
      pr: 'padding-right',
      pb: 'padding-bottom',
      pl: 'padding-left',
      m: 'margin',
      mx: 'margin-inline',
      my: 'margin-block',
      mt: 'margin-top',
      mr: 'margin-right',
      mb: 'margin-bottom',
      ml: 'margin-left',
      inset: 'inset',
      'inset-x': 'inset-inline',
      'inset-y': 'inset-block',
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
      w: 'width',
      h: 'height',
      'min-w': 'min-width',
      'min-h': 'min-height',
      'max-w': 'max-width',
      'max-h': 'max-height',
      basis: 'flex-basis',
    }
    if (kind === 'size') return `width:${value};height:${value}`
    if (Object.hasOwn(map, kind)) return `${map[kind]}:${value}`
    }
  }

  if (util.startsWith('text-')) {
    const name = util.slice(5)
    if (TEXT[name]) return `font-size:${TEXT[name][0]};line-height:${TEXT[name][1]}`
    const align = { left: 'left', center: 'center', right: 'right', start: 'start', end: 'end' }[name]
    if (align) return `text-align:${align}`
    if (name === 'white') return 'color:var(--lobe-color-text-light-solid)'
    if (name === 'black') return 'color:var(--lobe-color-text)'
    const color = colorOf(name)
    if (color) return `color:${color}`
    if (name === 'balance') return 'text-wrap:balance'
    if (name === 'pretty') return 'text-wrap:pretty'
    if (name === 'nowrap') return 'white-space:nowrap'
    if (name === 'wrap') return 'white-space:normal'
  }

  if (util.startsWith('bg-')) {
    const name = util.slice(3)
    if (name === 'white') return 'background-color:var(--lobe-color-bg-container)'
    if (name === 'black') return 'background-color:var(--lobe-color-bg-mask)'
    const color = colorOf(name)
    if (color) return `background-color:${color}`
    if (util === 'bg-none') return 'background-image:none'
  }
  if (util.startsWith('border-') && !util.startsWith('border-spacing')) {
    const rest = util.slice(7)
    if (rest === '0' || rest in SPACING) return `border-width:${rest === '0' ? '0' : SPACING[rest]}`
    if (['t', 'b', 'l', 'r', 'x', 'y'].includes(rest)) {
      const side = { t: 'top', b: 'bottom', l: 'left', r: 'right', x: 'inline', y: 'block' }[rest]
      return side === 'inline' || side === 'block'
        ? `border-${side}-width:1px`
        : `border-${side}-width:1px`
    }
    if (rest === 'solid' || rest === 'dashed' || rest === 'dotted' || rest === 'none')
      return `border-style:${rest}`
    const color = colorOf(rest)
    if (color) return `border-color:${color}`
  }
  if (util === 'border') return 'border-width:1px;border-style:solid'
  if (util.startsWith('fill-')) {
    const color = colorOf(util.slice(5))
    if (color) return `fill:${color}`
  }
  if (util.startsWith('stroke-')) {
    const color = colorOf(util.slice(7))
    if (color) return `stroke:${color}`
  }
  if (util.startsWith('ring-')) {
    const color = colorOf(util.slice(5))
    if (color) return `box-shadow:0 0 0 3px ${color}`
    if (util === 'ring') return 'box-shadow:0 0 0 3px var(--lobe-color-primary)'
    if (util === 'ring-0') return 'box-shadow:none'
    if (/^ring-\d+$/.test(util)) return `box-shadow:0 0 0 ${util.slice(5)}px var(--lobe-color-primary)`
  }
  if (util.startsWith('outline-')) {
    if (util === 'outline-none' || util === 'outline-hidden') return 'outline:none'
  }
  if (util === 'outline') return 'outline-style:solid'

  const rounded = {
    rounded: 'border-radius:0.25rem',
    'rounded-none': 'border-radius:0',
    'rounded-xs': 'border-radius:6px',
    'rounded-sm': 'border-radius:8px',
    'rounded-md': 'border-radius:10px',
    'rounded-lg': 'border-radius:12px',
    'rounded-xl': 'border-radius:14px',
    'rounded-2xl': 'border-radius:1rem',
    'rounded-full': 'border-radius:999px',
    'rounded-pill': 'border-radius:999px',
  }[util]
  if (rounded) return rounded

  const font = {
    'font-normal': 'font-weight:400',
    'font-medium': 'font-weight:500',
    'font-semibold': 'font-weight:600',
    'font-bold': 'font-weight:700',
    'font-mono': 'font-family:var(--lobe-font-family-code)',
    'font-sans': 'font-family:inherit',
  }[util]
  if (font) return font

  const leading = {
    'leading-none': 'line-height:1',
    'leading-tight': 'line-height:1.25',
    'leading-snug': 'line-height:1.375',
    'leading-normal': 'line-height:1.5',
    'leading-relaxed': 'line-height:1.625',
    'leading-6': 'line-height:1.5rem',
  }[util]
  if (leading) return leading

  const extra = {
    truncate: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap',
    'whitespace-nowrap': 'white-space:nowrap',
    'whitespace-pre': 'white-space:pre',
    'whitespace-pre-wrap': 'white-space:pre-wrap',
    'break-words': 'overflow-wrap:break-word',
    'break-all': 'word-break:break-all',
    uppercase: 'text-transform:uppercase',
    lowercase: 'text-transform:lowercase',
    capitalize: 'text-transform:capitalize',
    italic: 'font-style:italic',
    'not-italic': 'font-style:normal',
    underline: 'text-decoration:underline',
    'no-underline': 'text-decoration:none',
    'line-through': 'text-decoration:line-through',
    'tabular-nums': 'font-variant-numeric:tabular-nums',
    antialiased: '-webkit-font-smoothing:antialiased',
    'tracking-tight': 'letter-spacing:-0.025em',
    'tracking-normal': 'letter-spacing:0',
    'tracking-wide': 'letter-spacing:0.025em',
    'overflow-hidden': 'overflow:hidden',
    'overflow-auto': 'overflow:auto',
    'overflow-scroll': 'overflow:scroll',
    'overflow-visible': 'overflow:visible',
    'overflow-x-auto': 'overflow-x:auto',
    'overflow-y-auto': 'overflow-y:auto',
    'overflow-x-hidden': 'overflow-x:hidden',
    'overflow-y-hidden': 'overflow-y:hidden',
    'overscroll-contain': 'overscroll-behavior:contain',
    'object-cover': 'object-fit:cover',
    'object-contain': 'object-fit:contain',
    'object-center': 'object-position:center',
    'pointer-events-none': 'pointer-events:none',
    'pointer-events-auto': 'pointer-events:auto',
    'select-none': 'user-select:none',
    'select-text': 'user-select:text',
    'select-all': 'user-select:all',
    'cursor-pointer': 'cursor:pointer',
    'cursor-default': 'cursor:default',
    'cursor-not-allowed': 'cursor:not-allowed',
    'cursor-col-resize': 'cursor:col-resize',
    'cursor-grab': 'cursor:grab',
    'appearance-none': 'appearance:none',
    'list-none': 'list-style:none',
    'list-disc': 'list-style-type:disc',
    static: 'position:static',
    relative: 'position:relative',
    absolute: 'position:absolute',
    fixed: 'position:fixed',
    sticky: 'position:sticky',
    'inset-0': 'inset:0',
    'z-0': 'z-index:0',
    'z-10': 'z-index:10',
    'z-20': 'z-index:20',
    'z-30': 'z-index:30',
    'z-40': 'z-index:40',
    'z-50': 'z-index:50',
    'shadow-xs': 'box-shadow:${cssVar.boxShadowTertiary}',
    'shadow-sm': 'box-shadow:${cssVar.boxShadowTertiary}',
    shadow: 'box-shadow:${cssVar.boxShadow}',
    'shadow-md': 'box-shadow:${cssVar.boxShadowSecondary}',
    'shadow-lg': 'box-shadow:${cssVar.boxShadow}',
    'shadow-xl': 'box-shadow:${cssVar.boxShadow}',
    'shadow-2xl': 'box-shadow:${cssVar.boxShadow}',
    'shadow-none': 'box-shadow:none',
    'opacity-0': 'opacity:0',
    'opacity-40': 'opacity:0.4',
    'opacity-50': 'opacity:0.5',
    'opacity-60': 'opacity:0.6',
    'opacity-70': 'opacity:0.7',
    'opacity-80': 'opacity:0.8',
    'opacity-100': 'opacity:1',
    transition: 'transition:all 0.15s ease',
    'transition-colors': 'transition:color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
    'transition-opacity': 'transition:opacity 0.15s ease',
    'transition-transform': 'transition:transform 0.15s ease',
    'transition-none': 'transition:none',
    'duration-150': 'transition-duration:150ms',
    'duration-200': 'transition-duration:200ms',
    'duration-300': 'transition-duration:300ms',
    'duration-500': 'transition-duration:500ms',
    'ease-out': 'transition-timing-function:cubic-bezier(0,0,0.2,1)',
    'ease-in-out': 'transition-timing-function:cubic-bezier(0.4,0,0.2,1)',
    'animate-spin': 'animation:byline-spin 1s linear infinite',
    'animate-pulse': 'animation:byline-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
    'sr-only': 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0',
    'not-sr-only': 'position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;white-space:normal',
    'aspect-square': 'aspect-ratio:1',
    'aspect-video': 'aspect-ratio:16/9',
    'grid-cols-1': 'grid-template-columns:repeat(1,minmax(0,1fr))',
    'grid-cols-2': 'grid-template-columns:repeat(2,minmax(0,1fr))',
    'grid-cols-3': 'grid-template-columns:repeat(3,minmax(0,1fr))',
    'grid-cols-4': 'grid-template-columns:repeat(4,minmax(0,1fr))',
    'grid-cols-5': 'grid-template-columns:repeat(5,minmax(0,1fr))',
    'grid-cols-6': 'grid-template-columns:repeat(6,minmax(0,1fr))',
    'grid-cols-12': 'grid-template-columns:repeat(12,minmax(0,1fr))',
    'grid-cols-none': 'grid-template-columns:none',
    'grid-rows-1': 'grid-template-rows:repeat(1,minmax(0,1fr))',
    'grid-rows-2': 'grid-template-rows:repeat(2,minmax(0,1fr))',
    'col-span-1': 'grid-column:span 1 / span 1',
    'col-span-2': 'grid-column:span 2 / span 2',
    'col-span-full': 'grid-column:1 / -1',
    'col-start-1': 'grid-column-start:1',
    'col-start-2': 'grid-column-start:2',
    'row-start-1': 'grid-row-start:1',
    'row-start-2': 'grid-row-start:2',
    'translate-x-0': 'translate:0',
    '-translate-x-1/2': 'translate:-50%',
    '-translate-y-1/2': 'translate:0 -50%',
    'translate-y-0': 'translate:0',
    'scale-95': 'scale:0.95',
    'scale-100': 'scale:1',
    'rotate-180': 'rotate:180deg',
    'origin-center': 'transform-origin:center',
    'snap-x': 'scroll-snap-type:x mandatory',
    'snap-start': 'scroll-snap-align:start',
    'scroll-smooth': 'scroll-behavior:smooth',
    'touch-pan-y': 'touch-action:pan-y',
    'will-change-transform': 'will-change:transform',
    'isolate': 'isolation:isolate',
    'invisible': 'visibility:hidden',
    visible: 'visibility:visible',
    'box-border': 'box-sizing:border-box',
    'box-content': 'box-sizing:content-box',
  }[util]
  if (extra) return extra

  const lineClamp = util.match(/^line-clamp-(\d+)$/)
  if (lineClamp) {
    return `overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${lineClamp[1]}`
  }
  const opacity = util.match(/^opacity-(\d+)$/)
  if (opacity) return `opacity:${Number(opacity[1]) / 100}`
  const z = util.match(/^z-(\d+)$/)
  if (z) return `z-index:${z[1]}`
  const cols = util.match(/^grid-cols-(\d+)$/)
  if (cols) return `grid-template-columns:repeat(${cols[1]},minmax(0,1fr))`

  if (util === 'flex-shrink-0') return 'flex-shrink:0'
  if (util === 'align-top') return 'vertical-align:top'
  if (util === 'animate-ping') return 'animation:byline-ping 1s cubic-bezier(0,0,0.2,1) infinite'
  if (util === 'animate-none') return 'animation:none'
  if (util === 'backdrop-blur') return 'backdrop-filter:blur(8px)'
  if (util === 'backdrop-blur-sm') return 'backdrop-filter:blur(4px)'
  if (util === 'backdrop-blur-md') return 'backdrop-filter:blur(12px)'
  if (util === 'backdrop-blur-xl') return 'backdrop-filter:blur(24px)'
  if (util === 'backdrop-saturate-150') return 'backdrop-filter:saturate(1.5)'
  if (util === 'blur-md') return 'filter:blur(12px)'
  if (util === 'border-collapse') return 'border-collapse:collapse'
  if (util === 'resize-none') return 'resize:none'
  if (util === 'normal-case') return 'text-transform:none'
  if (util === 'touch-none') return 'touch-action:none'
  if (util === 'tracking-wider') return 'letter-spacing:0.05em'
  if (util === 'leading-5') return 'line-height:1.25rem'
  if (util === 'underline-offset-2') return 'text-underline-offset:2px'
  if (util === 'transition-all') return 'transition:all 0.15s ease'
  if (util === 'transition-shadow') return 'transition:box-shadow 0.15s ease'
  if (util === 'shadow-xl') return 'box-shadow:0 20px 25px -5px rgb(0 0 0 / 0.1)'
  if (util === 'shadow-2xl') return 'box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25)'
  if (util === 'scale-110') return 'scale:1.1'
  if (util === 'outline-2') return 'outline-width:2px'
  if (util === '-outline-offset-2') return 'outline-offset:-2px'
  if (util === 'max-w-xs') return 'max-width:20rem'
  if (util === 'max-w-sm') return 'max-width:24rem'
  if (util === 'max-w-md') return 'max-width:28rem'
  if (util === 'max-w-3xl') return 'max-width:48rem'
  if (util === 'max-w-4xl') return 'max-width:56rem'
  if (util === 'max-w-5xl') return 'max-width:64rem'
  if (util === 'max-w-prose') return 'max-width:65ch'
  if (util === 'rounded-b-lg') return 'border-bottom-left-radius:12px;border-bottom-right-radius:12px'
  if (util === 'rounded-l') return 'border-top-left-radius:0.25rem;border-bottom-left-radius:0.25rem'
  if (util === 'col-end-4') return 'grid-column-end:4'
  if (util === 'group' || util === 'prose' || util === 'prose-sm' || util === 'prose-invert' || util === 'auth-light') return '/* marker */'
  if (util === 'cursor-grabbing') return 'cursor:grabbing'
  if (util === 'row-span-2') return 'grid-row:span 2 / span 2'
  if (util === 'divide-y') return 'SPECIAL_DIVIDE'

  const order = util.match(/^order-(\d+)$/)
  if (order) return `order:${order[1]}`
  const borderSide = util.match(/^border-([trbl])-(\d+)$/)
  if (borderSide) {
    const side = { t: 'top', r: 'right', b: 'bottom', l: 'left' }[borderSide[1]]
    return `border-${side}-width:${borderSide[2]}px`
  }
  const borderColor = util.match(/^border-([trbl])-(.+)$/)
  if (borderColor) {
    const side = { t: 'top', r: 'right', b: 'bottom', l: 'left' }[borderColor[1]]
    const color = colorOf(borderColor[2])
    if (color) return `border-${side}-color:${color}`
  }
  if (util.startsWith('divide-')) {
    const color = colorOf(util.slice(7))
    if (color) return `border-color:${color}`
  }
  if (util.startsWith('shadow-')) {
    const color = colorOf(util.slice(7))
    if (color) return `box-shadow:0 10px 15px -3px ${color}`
  }
  if (util.startsWith('outline-')) {
    const color = colorOf(util.slice(8))
    if (color) return `outline-color:${color}`
  }

  return null
}

function escapeClass(token) {
  return token.replace(/([^a-zA-Z0-9_-])/g, '\\$1')
}

function wrap(variants, selector, body) {
  let sel = selector
  const medias = []
  for (const variant of variants) {
    if (variant === 'hover') sel += ':hover'
    else if (variant === 'focus') sel += ':focus'
    else if (variant === 'focus-visible') sel += ':focus-visible'
    else if (variant === 'focus-within') sel += ':focus-within'
    else if (variant === 'disabled') sel += ':disabled'
    else if (variant === 'placeholder') sel += '::placeholder'
    else if (variant === 'active') sel += ':active'
    else if (variant === 'first') sel += ':first-child'
    else if (variant === 'last') sel += ':last-child'
    else if (variant === 'dark') sel += ':where(.dark,.dark *)'
    else if (variant === 'group-hover') sel = `.group:hover ${sel}`
    else if (variant === 'group-focus-within') sel = `.group:focus-within ${sel}`
    else if (variant === 'group-data-selected' || variant === 'group-data-[selected]')
      sel = `.group[data-selected] ${sel}`
    else if (variant === 'group-data-[popup-open]') sel = `.group[data-popup-open] ${sel}`
    else if (variant === 'group-has-[[data-popup-open]]')
      sel = `.group:has([data-popup-open]) ${sel}`
    else if (variant === 'data-selected' || variant === 'data-[selected]')
      sel += '[data-selected]'
    else if (variant === 'data-[popup-open]' || variant === 'data-popup-open')
      sel += '[data-popup-open]'
    else if (variant === 'data-[disabled]') sel += '[data-disabled]'
    else if (variant === 'data-[checked]') sel += '[data-checked]'
    else if (variant === 'phone') medias.push('(max-width:768px)')
    else if (variant === 'tablet') medias.push('(max-width:1023px)')
    else if (variant === 'desktop' || variant === 'lg') medias.push('(min-width:1024px)')
    else if (variant === 'md') medias.push('(min-width:768px)')
    else if (variant === 'sm') medias.push('(min-width:640px)')
    else if (variant === 'max-sm') medias.push('(max-width:639px)')
    else if (variant === 'motion-reduce') medias.push('(prefers-reduced-motion:reduce)')
    else if (variant === '[@media(pointer:coarse)]') medias.push('(pointer:coarse)')
    else if (variant === '@3xl/desk') medias.push('(min-width:48rem)')
    else if (variant.startsWith('data-[')) sel += `[data-${variant.slice(6, -1)}]`
    else if (variant.startsWith('data-')) sel += `[data-${variant.slice(5)}]`
    else if (variant.startsWith('has-')) sel += `:has(${variant.slice(4).replace(/^\[/, '').replace(/\]$/, '')})`
    else if (variant === '[&>svg]') sel += ' > svg'
    else if (variant === '[&::-webkit-scrollbar]') sel += '::-webkit-scrollbar'
    else return null
  }
  let rule = `${sel}{${body}}`
  for (const media of medias.reverse()) rule = `@media ${media}{${rule}}`
  return rule
}

const isDirect =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirect) {
const classes = new Set()
for (const file of walk(root)) {
  for (const token of collectClasses(readFileSync(file, 'utf8'))) classes.add(token)
}

const rules = []
const missing = []
for (const token of [...classes].sort()) {
  const [variants, util] = splitVariants(token)
  const decls = declsFor(util)
  if (typeof decls !== 'string') {
    if (decls) console.log('bad', token, decls)
    missing.push(token)
    continue
  }
  if (decls === 'SPECIAL_DIVIDE') {
    const rule = wrap(
      variants,
      `.${escapeClass(token)} > :not([hidden]) ~ :not([hidden])`,
      'border-top-width:1px;border-top-style:solid',
    )
    if (!rule) missing.push(token)
    else rules.push(rule)
    continue
  }
  if (decls.startsWith('SPECIAL_SPACE:')) {
    const [, prop, value] = decls.split(':')
    const selector = `.${escapeClass(token)} > :not([hidden]) ~ :not([hidden])`
    const rule = wrap(variants, selector, `${prop}:${value}`)
    if (!rule) missing.push(token)
    else rules.push(rule)
    continue
  }
  const rule = wrap(variants, `.${escapeClass(token)}`, decls)
  if (!rule) missing.push(token)
  else rules.push(rule)
}

const css = `/* Generated by scripts/emit-utilities.mjs. Layout utilities formerly provided by Tailwind, colored with lobe theme tokens. */\n@keyframes byline-spin { to { transform: rotate(360deg); } }\n@keyframes byline-pulse { 50% { opacity: .5 } }\n${rules.join('\n')}\n`
writeFileSync(new URL('../src/styles/utilities.css', import.meta.url), css)
console.log(`classes ${classes.size} rules ${rules.length} missing ${missing.length}`)
if (missing.length) console.log(missing.join('\n'))
}
