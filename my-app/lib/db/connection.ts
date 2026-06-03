import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { getPostgresUrl } from './url'

// Load environment variables
import { config } from 'dotenv'
config()

let db: any = null
const postgresUrl = getPostgresUrl()

// Only initialize database if POSTGRES_URL is available
if (postgresUrl) {
  console.log('🗄️  Using PostgreSQL database')
  const client = postgres(postgresUrl)
  db = drizzle(client, { schema })
}

export default db
