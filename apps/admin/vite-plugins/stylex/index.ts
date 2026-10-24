// Ported from lobe-chat plugins/vite/stylex.ts.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import stylex from '@stylexjs/unplugin/vite'
import type { PluginOption } from 'vite'

import { createStylexEntryCss } from './stylexEntryCss'

const adminRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'

export const stylexClassNamePrefix = 'bl'

// Uncompiled defineConsts. Pre-bundling them removes the call before StyleX can
// inline the var(--lobe-*) values, and the optimizer stalls on them in dev.
export const stylexTokenModules = [
  '@lobehub/ui/stylex/cssVar.stylex',
  '@lobehub/ui/stylex/media.stylex',
]

export function stylexPlugin(): PluginOption {
  const entryCss = createStylexEntryCss(stylexClassNamePrefix)
  const plugin = stylex({
    aliases: { '~/*': [path.join(adminRoot, 'src', '*')] },
    classNamePrefix: stylexClassNamePrefix,
    cssInjectionTarget: entryCss.cssInjectionTarget,
    dev: !isTest && process.env.NODE_ENV !== 'production',
    // Keep :dir() and logical properties; lightningcss would rewrite them for
    // the default browserslist and break StyleX RTL rules.
    lightningcssOptions: {
      exclude: 4 | 524_288,
    },
    runtimeInjection: isTest,
    test: isTest,
    unstable_moduleResolution: {
      rootDir: adminRoot,
      type: 'commonJS',
    },
  })

  const plugins = (Array.isArray(plugin) ? plugin : [plugin]) as Array<{
    config?: unknown
    configureServer?: unknown
  }>
  for (const item of plugins) {
    // @lobehub/ui depends on @stylexjs/stylex but ships precompiled CSS; this
    // hook would pull it out of dependency pre-bundling.
    delete item.config
    // The unplugin polls a CSS store from configureServer, which keeps Vitest's
    // server alive after the run.
    if (isTest) delete item.configureServer
  }

  const [locateEntryCss, verifyEntryCss] = entryCss.plugins
  return [locateEntryCss, ...plugins, verifyEntryCss] as PluginOption
}

// The @lobehub/ui token modules are uncompiled defineConsts calls that throw
// when Node loads them untransformed, so Vitest must inline them.
export const stylexVitestInlineDeps = [/@lobehub[/\\]ui[/\\]es[/\\]stylex[/\\]/]
