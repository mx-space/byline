import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url:
      process.env.PG_URL ||
      process.env.PG_CONNECTION_STRING ||
      'postgres://byline:byline@127.0.0.1:5432/byline',
  },
  verbose: true,
  strict: true,
})
