import { Router } from 'express'
import { resolveHandler } from '../config.js'
import { enqueueJob } from '../queue/index.js'
import * as store from '../store/postgresStore.js'
import type { CreateJobInput } from '../types.js'

export const jobsRouter = Router()

jobsRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)))
  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const result = await store.getJobsPage(page, limit, status)
  res.json({
    jobs: result.jobs,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  })
})

jobsRouter.post('/', async (req, res) => {
  try {
    const input = req.body as CreateJobInput
    if (!input.name || !input.queue) {
      res.status(400).json({ error: 'name and queue are required' })
      return
    }

    const handler = resolveHandler(input.name, input.handler)
    const job = await store.createJobRecord({
      name: input.name,
      queue: input.queue,
      handler,
      priority: input.priority ?? 'normal',
      maxRetries: input.maxRetries ?? 3,
      payload: input.payload ?? {},
    })

    await enqueueJob(
      { jobId: job.id, handler: job.handler, payload: job.payload },
      job.priority,
      job.maxRetries,
    )

    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

jobsRouter.post('/:id/retry', async (req, res) => {
  try {
    const job = await store.getJob(req.params.id)
    if (!job) {
      res.status(404).json({ error: 'Job not found' })
      return
    }

    job.status = 'retrying'
    job.attempts += 1
    job.workerId = null
    job.retryAt = new Date(Date.now() + 1000).toISOString()
    await store.saveJob(job)

    const metrics = await store.getMetricsState()
    metrics.retriesToday += 1
    await store.saveMetricsState(metrics)

    await enqueueJob(
      { jobId: job.id, handler: job.handler, payload: job.payload },
      job.priority,
      job.maxRetries,
    )

    res.json(job)
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

jobsRouter.delete('/:id', async (req, res) => {
  try {
    const job = await store.getJob(req.params.id)
    if (!job) {
      res.status(404).json({ error: 'Job not found' })
      return
    }
    if (job.status === 'running' && job.workerId) {
      const worker = await store.getWorker(job.workerId)
      if (worker) {
        worker.activeJobs = Math.max(0, worker.activeJobs - 1)
        await store.saveWorker(worker)
      }
    }
    await store.deleteJob(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

export const metricsRouter = Router()

metricsRouter.get('/', async (_req, res) => {
  res.json(await store.computeDashboardMetrics())
})

metricsRouter.get('/success-rate', async (_req, res) => {
  const metrics = await store.computeDashboardMetrics()
  const state = await store.getMetricsState()
  const history = [...state.successRateHistory]
  if (history.length > 0) history[history.length - 1] = { time: 'Now', value: metrics.successRate }
  res.json(history)
})

metricsRouter.get('/throughput', async (_req, res) => {
  const metrics = await store.computeDashboardMetrics()
  const state = await store.getMetricsState()
  const history = [...state.throughputHistory]
  if (history.length > 0) history[history.length - 1] = { time: 'Now', value: metrics.activeJobs }
  res.json(history)
})

metricsRouter.get('/latency', async (_req, res) => {
  const metrics = await store.computeDashboardMetrics()
  const state = await store.getMetricsState()
  const history = [...state.latencyHistory]
  if (history.length > 0) history[history.length - 1] = { time: 'Now', value: metrics.avgLatencyMs }
  res.json(history)
})

metricsRouter.get('/queue-depth', async (_req, res) => {
  res.json(await store.getQueueDepth())
})
