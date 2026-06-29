import { store } from '../store/memoryStore.js'
import type { Job } from '../types.js'
import {
  backoffMs,
  recordLatency,
  simulateJobSuccess,
} from './metricsService.js'
import { createAlert } from './monitoringService.js'
import {
  getPendingJobs,
  pickWorkerForJob,
  syncWorkerLoad,
} from './workerRegistry.js'

const runningTimers = new Map<string, NodeJS.Timeout>()

function executeJob(jobId: string): void {
  const job = store.getJob(jobId)
  if (!job || job.status !== 'running') return

  const worker = job.workerId ? store.getWorker(job.workerId) : null
  if (!worker || worker.status === 'offline') {
    job.status = 'queued'
    job.workerId = null
    store.saveJob(job)
    return
  }

  const durationMs = Math.floor(Math.random() * 2800) + 200
  const start = Date.now()

  const timer = setTimeout(() => {
    runningTimers.delete(jobId)
    const current = store.getJob(jobId)
    if (!current || current.status !== 'running') return

    current.durationMs = Date.now() - start
    recordLatency(current.durationMs)

    if (simulateJobSuccess()) {
      current.status = 'completed'
      current.completedAt = new Date().toISOString()
      store.metrics.completedToday++
    } else {
      current.attempts += 1
      store.metrics.retriesToday++

      if (current.attempts <= current.maxRetries) {
        current.status = 'retrying'
        current.workerId = null
        current.retryAt = new Date(Date.now() + backoffMs(current.attempts)).toISOString()
        createAlert(
          'info',
          'Job retry scheduled',
          `${current.name} failed — retry ${current.attempts}/${current.maxRetries} in ${backoffMs(current.attempts)}ms`,
        )
      } else {
        current.status = 'failed'
        current.completedAt = new Date().toISOString()
        store.metrics.failedToday++
        createAlert(
          'warning',
          'Job failed permanently',
          `${current.name} exhausted ${current.maxRetries} retries`,
        )
      }
    }

    if (worker) {
      worker.activeJobs = Math.max(0, worker.activeJobs - 1)
      store.saveWorker(worker)
    }
    store.saveJob(current)
    syncWorkerLoad()
  }, durationMs)

  runningTimers.set(jobId, timer)
}

function dispatchJob(job: Job): boolean {
  const worker = pickWorkerForJob(job)
  if (!worker) return false

  job.status = 'running'
  job.workerId = worker.id
  job.startedAt = new Date().toISOString()
  job.retryAt = null
  job.attempts = Math.max(1, job.attempts)
  store.saveJob(job)

  worker.activeJobs += 1
  store.saveWorker(worker)

  executeJob(job.id)
  return true
}

function dispatchLoop(): void {
  syncWorkerLoad()
  const pending = getPendingJobs()
  const runningCount = store.getAllJobs().filter((j) => j.status === 'running').length
  const maxConcurrent = 150
  const slots = Math.max(0, maxConcurrent - runningCount)

  let dispatched = 0
  for (const job of pending) {
    if (dispatched >= slots) break
    if (dispatchJob(job)) dispatched++
  }
}

export function startScheduler(intervalMs = 250): NodeJS.Timeout {
  dispatchLoop()
  return setInterval(dispatchLoop, intervalMs)
}

export function stopScheduler(): void {
  for (const timer of runningTimers.values()) clearTimeout(timer)
  runningTimers.clear()
}
