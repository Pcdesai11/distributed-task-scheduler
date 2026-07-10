import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import * as store from '../store/postgresStore.js'
import type { Alert, FailoverEvent } from '../types.js'
import { PRIORITY_WEIGHT } from '../config.js'
import type { Job, Worker } from '../types.js'

const HEARTBEAT_TIMEOUT_MS = 30_000
const CPU_DEGRADED_THRESHOLD = 85
const MEMORY_DEGRADED_THRESHOLD = 85

export async function syncWorkerLoad(): Promise<void> {
  const workers = await store.getAllWorkers()
  const jobs = await store.getAllJobs()
  const counts = new Map<string, number>()
  for (const job of jobs) {
    if (job.status === 'running' && job.workerId) {
      counts.set(job.workerId, (counts.get(job.workerId) ?? 0) + 1)
    }
  }
  for (const worker of workers) {
    worker.activeJobs = counts.get(worker.id) ?? 0
    await store.saveWorker(worker)
  }
}

export function getAvailableWorkers(workers: Worker[]): Worker[] {
  return workers.filter((w) => w.status === 'healthy' && w.activeJobs < w.capacity)
}

export function findBackupWorker(fromWorkerId: string, workers: Worker[]): Worker | null {
  const from = workers.find((w) => w.id === fromWorkerId)
  if (!from) return null

  return (
    workers.find(
      (w) =>
        w.id !== fromWorkerId &&
        w.region === from.region &&
        w.status === 'healthy' &&
        w.activeJobs < w.capacity,
    ) ??
    workers.find(
      (w) => w.id !== fromWorkerId && w.status === 'healthy' && w.activeJobs < w.capacity,
    ) ??
    null
  )
}

export function sortJobsByPriority(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const pw = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    if (pw !== 0) return pw
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  })
}

export async function createAlert(
  severity: Alert['severity'],
  title: string,
  message: string,
): Promise<Alert> {
  const alert: Alert = {
    id: uuid(),
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    resolved: false,
  }
  await store.addAlert(alert)
  return alert
}

export async function resolveAlert(alertId: string): Promise<void> {
  await store.resolveAlertById(alertId)
}

export async function rerouteJobsFromWorker(
  fromWorkerId: string,
  toWorkerId: string,
  reason: string,
): Promise<number> {
  const jobs = await store.getAllJobs()
  let rerouted = 0
  for (const job of jobs) {
    if (
      job.workerId === fromWorkerId &&
      (job.status === 'running' || job.status === 'queued' || job.status === 'retrying')
    ) {
      job.workerId = toWorkerId
      if (job.status === 'running') job.status = 'rerouted'
      await store.saveJob(job)
      rerouted++
    }
  }

  const metrics = await store.getMetricsState()
  metrics.reroutesToday += rerouted
  await store.saveMetricsState(metrics)

  const event: FailoverEvent = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    fromWorker: fromWorkerId,
    toWorker: toWorkerId,
    reason,
    jobsRerouted: rerouted,
  }
  await store.addFailover(event)
  return rerouted
}

export async function triggerFailover(fromWorkerId: string, reason?: string): Promise<FailoverEvent> {
  const workers = await store.getAllWorkers()
  const backup = findBackupWorker(fromWorkerId, workers)
  if (!backup) throw new Error('No healthy backup worker available')

  const from = await store.getWorker(fromWorkerId)
  if (from) {
    from.status = 'draining'
    from.trafficWeight = 0
    await store.saveWorker(from)
  }

  backup.trafficWeight = Math.min(100, backup.trafficWeight + 20)
  await store.saveWorker(backup)

  await rerouteJobsFromWorker(
    fromWorkerId,
    backup.id,
    reason ?? 'Manual failover triggered from dashboard',
  )

  await createAlert(
    'warning',
    'Failover executed',
    `${fromWorkerId} → ${backup.id}: jobs rerouted`,
  )

  const events = await store.getFailovers()
  return events[0]
}

export async function runHealthChecks(): Promise<void> {
  const now = Date.now()
  const workers = await store.getAllWorkers()

  for (const worker of workers) {
    const heartbeatAge = now - new Date(worker.lastHeartbeat).getTime()

    if (worker.status !== 'offline' && heartbeatAge > HEARTBEAT_TIMEOUT_MS) {
      worker.status = 'offline'
      worker.trafficWeight = 0
      await store.saveWorker(worker)

      const backup = findBackupWorker(worker.id, workers)
      if (backup) {
        await rerouteJobsFromWorker(
          worker.id,
          backup.id,
          `Heartbeat timeout (${Math.round(heartbeatAge / 1000)}s)`,
        )
        await createAlert(
          'critical',
          'Worker offline',
          `${worker.id} missed heartbeats — automatic failover to ${backup.id}`,
        )
      }
      continue
    }

    if (worker.status === 'offline') continue

    if (
      worker.cpuPercent >= CPU_DEGRADED_THRESHOLD ||
      worker.memoryPercent >= MEMORY_DEGRADED_THRESHOLD
    ) {
      if (worker.status === 'healthy') {
        worker.status = 'degraded'
        worker.trafficWeight = 0
        await store.saveWorker(worker)

        const backup = findBackupWorker(worker.id, workers)
        if (backup) {
          await rerouteJobsFromWorker(
            worker.id,
            backup.id,
            `Resource threshold exceeded (CPU ${Math.round(worker.cpuPercent)}%)`,
          )
          await createAlert(
            'warning',
            'Worker degraded',
            `${worker.id} under load — traffic rerouted to ${backup.id}`,
          )
        }
      }
    } else if (worker.status === 'degraded') {
      worker.status = 'healthy'
      worker.trafficWeight = worker.isPrimary ? 55 : 30
      await store.saveWorker(worker)
    }
  }

  await syncWorkerLoad()
}

export const workersRouter = Router()

workersRouter.get('/', async (_req, res) => {
  await syncWorkerLoad()
  res.json(await store.getAllWorkers())
})

workersRouter.post('/:id/failover', async (req, res) => {
  try {
    const event = await triggerFailover(req.params.id)
    res.json(event)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

export const monitoringRouter = Router()

monitoringRouter.get('/alerts', async (_req, res) => {
  res.json(await store.getAlerts())
})

monitoringRouter.patch('/alerts/:id/resolve', async (req, res) => {
  try {
    await resolveAlert(req.params.id)
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: (err as Error).message })
  }
})

monitoringRouter.get('/failovers', async (_req, res) => {
  res.json(await store.getFailovers())
})
