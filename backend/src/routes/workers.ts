import { Router } from 'express'
import { store } from '../store/memoryStore.js'
import { resolveAlert, triggerFailover } from '../services/monitoringService.js'
import { syncWorkerLoad } from '../services/workerRegistry.js'

export const workersRouter = Router()

workersRouter.get('/', (_req, res) => {
  syncWorkerLoad()
  res.json(store.getAllWorkers())
})

workersRouter.post('/:id/failover', (req, res) => {
  try {
    const event = triggerFailover(req.params.id)
    res.json(event)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

export const monitoringRouter = Router()

monitoringRouter.get('/alerts', (_req, res) => {
  res.json(store.alerts)
})

monitoringRouter.patch('/alerts/:id/resolve', (req, res) => {
  try {
    resolveAlert(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

monitoringRouter.get('/failovers', (_req, res) => {
  res.json(store.failovers)
})
