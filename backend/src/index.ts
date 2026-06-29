import { createApp } from './app.js'
import { seedAll } from './seed.js'
import { startMonitoring } from './services/monitoringService.js'
import { startScheduler } from './services/schedulerService.js'

const PORT = Number(process.env.PORT ?? 3001)

seedAll()

const app = createApp()
startScheduler(250)
startMonitoring(10_000)

app.listen(PORT, () => {
  console.log(`Chronos backend running on http://localhost:${PORT}`)
  console.log(`  Health:  http://localhost:${PORT}/api/health`)
  console.log(`  Metrics: http://localhost:${PORT}/api/metrics`)
  console.log(`  Jobs:    http://localhost:${PORT}/api/jobs`)
})
