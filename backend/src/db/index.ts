import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.js'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://chronos:chronos@localhost:5432/chronos',
})

export const db = drizzle(pool, { schema })

export async function closeDb(): Promise<void> {
  await pool.end()
}
