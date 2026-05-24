// Dev tool: run a .sql file against the Supabase Postgres using SUPABASE_DB_URL from .env.
// Usage: node db_migrate.mjs supabase/migrations/003_store_cash.sql
import { readFileSync } from 'fs'
import pg from 'pg'

const env = readFileSync(new URL('./.env', import.meta.url), 'utf8')
const m = env.match(/^SUPABASE_DB_URL=(.+)$/m)
if (!m) { console.error('SUPABASE_DB_URL missing from .env'); process.exit(1) }
const connectionString = m[1].trim()

const file = process.argv[2]
if (!file) { console.error('Usage: node db_migrate.mjs <path-to-sql>'); process.exit(1) }
const sql = readFileSync(file, 'utf8')

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query(sql)
  console.log('OK:', file)
} catch (e) {
  console.error('ERROR running', file, '->', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
