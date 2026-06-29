import { v4 as uuid } from 'uuid'
import { store } from '../store/memoryStore.js'
import type { Alert, FailoverEvent } from '../types.js'
import { findBackupWorker, syncWorkerLoad } from './workerRegistry.js'

const HEARTBEAT_TIMEOUT_MS = 30_000
const CPU_DEGRADED_THRESHOLD = 85
const MEMORY_DEGRADED_THRESHOLD = 85

export function createAlert(
  severity: Alert['severity'],
  title: string,
  message: string,
): Alert {
  const alert: Alert = {
    id: uuid(),
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    resolved: false,
  }
  store.addAlert(alert)
  return alert
}

export function resolveAlert(alertId: string): void {
  const alert = store.alerts.find((a) => a.id === alertId)
  if (!alert) throw new Error('Alert not found')
  alert.resolved = true
}

export function rerouteJobsFromWorker(
  fromWorkerId: string,
  toWorkerId: string,
  reason: string,
): number {
  let rerouted = 0
  for (const job of store.jobs.values()) {
    if (
      job.workerId === fromWorkerId &&
      (job.status === 'running' || job.status === 'queued' || job.status === 'retrying')
    ) {
      job.workerId = toWorkerId
      if (job.status === 'running') {
        job.status = 'rerouted'
        setTimeout(() => {
          const j = store.getJob(job.id)
          if (j && j.status === 'rerouted') {
            j.status = 'running'
            store.saveJob(j)
          }
        }, 500)
      }
      store.saveJob(job)
      rerouted++
    }
  }
  store.metrics.reroutesToday += rerouted

  const event: FailoverEvent = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    fromWorker: fromWorkerId,
    toWorker: toWorkerId,
    reason,
    jobsRerouted: rerouted,
  }
  store.addFailover(event)
  return rerouted
}

export function triggerFailover(fromWorkerId: string, reason?: string): FailoverEvent {
  const backup = findBackupWorker(fromWorkerId)
  if (!backup) throw new Error('No healthy backup worker available')

  const from = store.getWorker(fromWorkerId)
  if (from) {
    from.status = 'draining'
    from.trafficWeight = 0
    store.saveWorker(from)
  }

  backup.trafficWeight = Math.min(100, backup.trafficWeight + 20)
  store.saveWorker(backup)

  const rerouted = rerouteJobsFromWorker(
    fromWorkerId,
    backup.id,
    reason ?? 'Manual failover triggered from dashboard',
  )

  createAlert(
    'warning',
    'Failover executed',
    `${fromWorkerId} → ${backup.id}: ${rerouted} jobs rerouted`,
  )

  return store.failovers[0]
}

export function runHealthChecks(): void {
  const now = Date.now()

  for (const worker of store.workers.values()) {
    if (worker.id === 'worker-06') {
      worker.status = 'offline'
      worker.cpuPercent = 0
      worker.memoryPercent = 0
      store.saveWorker(worker)
      continue
    }

    const heartbeatAge = now - new Date(worker.lastHeartbeat).getTime()

    if (worker.status !== 'offline' && heartbeatAge > HEARTBEAT_TIMEOUT_MS) {
      worker.status = 'offline'
      worker.trafficWeight = 0
      store.saveWorker(worker)

      const backup = findBackupWorker(worker.id)
      if (backup) {
        rerouteJobsFromWorker(
          worker.id,
          backup.id,
          `Heartbeat timeout (${Math.round(heartbeatAge / 1000)}s)`,
        )
        createAlert(
          'critical',
          'Worker offline',
          `${worker.id} missed heartbeats — automatic failover to ${backup.id}`,
        )
      }
      continue
    }

    if (worker.status === 'offline') continue

    worker.cpuPercent = Math.min(
      100,
      Math.max(10, worker.cpuPercent + (Math.random() - 0.48) * 8),
    )
    worker.memoryPercent = Math.min(
      100,
      Math.max(10, worker.memoryPercent + (Math.random() - 0.5) * 6),
    )
    worker.lastHeartbeat = new Date().toISOString()

    const wasHealthy = worker.status === 'healthy'

    if (
      worker.cpuPercent >= CPU_DEGRADED_THRESHOLD ||
      worker.memoryPercent >= MEMORY_DEGRADED_THRESHOLD
    ) {
      if (wasHealthy) {
        worker.status = 'degraded'
        worker.trafficWeight = 0
        const backup = findBackupWorker(worker.id)
        if (backup) {
          rerouteJobsFromWorker(
            worker.id,
            backup.id,
            `CPU threshold exceeded (${Math.round(worker.cpuPercent)}%)`,
          )
          createAlert(
            'warning',
            'Worker degraded',
            `${worker.id} CPU at ${Math.round(worker.cpuPercent)}% — traffic rerouted to ${backup.id}`,
          )
        }
      }
    } else if (worker.status === 'degraded' && worker.id !== 'worker-04') {
      worker.status = 'healthy'
      worker.trafficWeight = worker.isPrimary ? 55 : 30
    }

    store.saveWorker(worker)
  }

  syncWorkerLoad()
}

export function startMonitoring(intervalMs = 10_000): NodeJS.Timeout {
  runHealthChecks()
  return setInterval(runHealthChecks, intervalMs)
}
