// Ported from lobe-chat plugins/vite/stylexEntryCss.ts.
import type { Plugin } from 'vite'

type BundleItem = {
  fileName: string
  imports?: string[]
  isEntry?: boolean
  source?: string | Uint8Array
  type: 'asset' | 'chunk'
  viteMetadata?: { importedCss?: Set<string> }
}
type Bundle = Record<string, BundleItem>

export const stylexAnchorMarker = '--bl-stylex'

const readSource = (item: BundleItem) =>
  typeof item.source === 'string'
    ? item.source
    : new TextDecoder().decode(item.source)

const cssAssets = (bundle: Bundle) =>
  Object.values(bundle).filter(
    (item) => item.type === 'asset' && item.fileName.endsWith('.css'),
  )

const findAnchorCss = (bundle: Bundle) =>
  cssAssets(bundle).find((item) =>
    readSource(item).includes(stylexAnchorMarker),
  )?.fileName

const collectInitialCss = (bundle: Bundle) => {
  const css = new Set<string>()
  const seen = new Set<string>()
  const queue = Object.values(bundle).filter(
    (item) => item.type === 'chunk' && item.isEntry,
  )
  for (let chunk = queue.shift(); chunk; chunk = queue.shift()) {
    if (seen.has(chunk.fileName)) continue
    seen.add(chunk.fileName)
    for (const file of chunk.viteMetadata?.importedCss ?? []) css.add(file)
    for (const file of chunk.imports ?? []) {
      const next = bundle[file]
      if (next?.type === 'chunk') queue.push(next)
    }
  }
  return css
}

// The unplugin appends every StyleX rule to one CSS asset picked by file name,
// which may be a lazy chunk's CSS. Pin it to the boot CSS carrying the marker
// from src/styles/stylex.css and fail the build if the rules land elsewhere.
const isClientEnvironment = (environment: { config: { consumer: string } }) =>
  environment.config.consumer === 'client'

export function createStylexEntryCss(classNamePrefix: string) {
  let anchorCss: string | undefined
  const stylexRule = new RegExp(
    String.raw`\.${classNamePrefix}[\da-z]{4,}[^\s,{]*:not\(#\\#\)`,
  )

  // The unplugin reads cssInjectionTarget in a plain generateBundle and is
  // enforce: 'pre', so plugin order cannot put this first; hook order 'pre' does.
  const locate: Plugin = {
    apply: 'build',
    applyToEnvironment: isClientEnvironment,
    generateBundle: {
      handler(_options, bundle) {
        anchorCss = findAnchorCss(bundle as unknown as Bundle)
      },
      order: 'pre',
    },
    name: 'lobe-stylex-entry-css',
  }

  const verify: Plugin = {
    apply: 'build',
    applyToEnvironment: isClientEnvironment,
    generateBundle: {
      handler(_options, output) {
        const bundle = output as unknown as Bundle
        const withRules = cssAssets(bundle).filter((item) =>
          stylexRule.test(readSource(item)),
        )
        if (withRules.length === 0) return

        // The unplugin re-emits the target under a new hash, so look it up again
        // instead of reusing the name seen before it ran.
        const finalAnchor = findAnchorCss(bundle)
        const problems: string[] = []
        if (!finalAnchor)
          problems.push(`no CSS asset carries ${stylexAnchorMarker}`)
        else if (!collectInitialCss(bundle).has(finalAnchor))
          problems.push(`${finalAnchor} does not load with any entry`)
        const misplaced = withRules.filter(
          (item) => item.fileName !== finalAnchor,
        )
        if (misplaced.length > 0)
          problems.push(
            `rules found in ${misplaced.map((item) => item.fileName).join(', ')}`,
          )

        if (problems.length > 0)
          this.error(
            `StyleX CSS must be in the boot CSS that imports src/styles/stylex.css: ${problems.join('; ')}`,
          )
      },
      order: 'post',
    },
    name: 'lobe-stylex-entry-css-verify',
  }

  return {
    cssInjectionTarget: (fileName: string) => fileName === anchorCss,
    plugins: [locate, verify],
  }
}
