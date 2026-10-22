import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  target: 'es2022',
  entry: ['src/index.ts'],
  dts: true,
  format: ['esm', 'cjs'],
  platform: 'neutral',
})
