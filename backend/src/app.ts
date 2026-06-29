import cors from 'cors'
import express from 'express'
import { jobsRouter, metricsRouter } from './routes/jobs.js'
import { monitoringRouter, workersRouter } from './routes/workers.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'chronos-scheduler' })
  })

  app.use('/api/jobs', jobsRouter)
  app.use('/api/metrics', metricsRouter)
  app.use('/api/workers', workersRouter)
  app.use('/api/monitoring', monitoringRouter)

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
