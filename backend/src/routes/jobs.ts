import { Router } from 'express'
import { store } from '../store/memoryStore.js'
import {
  cancelJob,
  computeMetrics,
  createJob,
  getLatencyHistory,
  getQueueDepth,
  getSuccessRateHistory,
  getThroughputHistory,
  retryJob,
} from '../services/metricsService.js'
import type { CreateJobInput } from '../types.js'

export const jobsRouter = Router()

jobsRouter.get('/', (_req, res) => {
  res.json(store.getAllJobs())
})

jobsRouter.post('/', (req, res) => {
  try {
    const input = req.body as CreateJobInput
    if (!input.name || !input.queue) {
      res.status(400).json({ error: 'name and queue are required' })
      return
    }
    const job = createJob({
      name: input.name,
      queue: input.queue,
      priority: input.priority ?? 'normal',
      maxRetries: input.maxRetries ?? 3,
      payload: input.payload ?? {},
    })
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

jobsRouter.post('/:id/retry', (req, res) => {
  try {
    res.json(retryJob(req.params.id))
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

jobsRouter.delete('/:id', (req, res) => {
  try {
    cancelJob(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

export const metricsRouter = Router()

metricsRouter.get('/', (_req, res) => {
  res.json(computeMetrics())
})

metricsRouter.get('/success-rate', (_req, res) => {
  res.json(getSuccessRateHistory())
})

metricsRouter.get('/throughput', (_req, res) => {
  res.json(getThroughputHistory())
})

metricsRouter.get('/latency', (_req, res) => {
  res.json(getLatencyHistory())
})

metricsRouter.get('/queue-depth', (_req, res) => {
  res.json(getQueueDepth())
})
