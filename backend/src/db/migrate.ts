import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, closeDb } from './index.js'

async function main() {
  console.log('Running database migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations complete.')
  await closeDb()
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
