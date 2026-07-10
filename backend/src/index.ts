import 'dotenv/config'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { createApp } from './app.js'
import { db, closeDb } from './db/index.js'
import { seedAll } from './seed.js'
import { runHealthChecks } from './routes/workers.js'
import * as store from './store/postgresStore.js'

const PORT = Number(process.env.PORT ?? 3001)

async function bootstrap() {
  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  await store.initJobCounter()

  if (process.env.SEED_DEMO_DATA === 'true') {
    console.log('Seeding demo data...')
    await seedAll()
  } else {
    const workers = await store.getAllWorkers()
    if (workers.length === 0) {
      await seedAll({ workersOnly: true })
    }
    const metrics = await store.getMetricsState()
    if (metrics.successRateHistory.length === 0) {
      await seedAll({ metricsOnly: true })
    }
  }

  const app = createApp()
  setInterval(() => {
    runHealthChecks().catch(console.error)
  }, 10_000)

  app.listen(PORT, () => {
    console.log(`Chronos API running on http://localhost:${PORT}`)
    console.log(`  Health:  http://localhost:${PORT}/api/health`)
    console.log(`  Jobs:    http://localhost:${PORT}/api/jobs`)
  })
}

bootstrap().catch(async (err) => {
  console.error('Failed to start API:', err)
  await closeDb()
  process.exit(1)
})
