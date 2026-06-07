/**
 * Creates the messages table if SUPABASE_DB_URL is set in backend/.env
 * Example: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const dbUrl = process.env.SUPABASE_DB_URL
if (!dbUrl) {
  console.log('SUPABASE_DB_URL not set — run backend/supabase_messages.sql in Supabase SQL Editor.')
  process.exit(0)
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase_messages.sql'), 'utf8')

try {
  const { default: pg } = await import('pg')
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  await client.query(sql)
  await client.end()
  console.log('messages table ready.')
} catch (err) {
  console.error('Failed to create messages table:', err.message)
  console.log('Run backend/supabase_messages.sql manually in Supabase → SQL Editor.')
  process.exit(1)
}
