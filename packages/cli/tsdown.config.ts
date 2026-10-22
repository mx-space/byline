import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  target: 'node22',
  entry: ['src/index.ts', 'src/bin/byline.ts'],
  dts: { eager: true },
  format: ['esm'],
  platform: 'node',
  deps: { alwaysBundle: ['@mx-space/byline-api-client'] },
  outExtensions: () => ({ js: '.mjs', dts: '.d.mts' }),
})
