import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { getPostgresUrl } from './lib/db/url'

config({
  path: '.env',
})

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getPostgresUrl()!,
  },
})
