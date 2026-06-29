import { store } from '../store/memoryStore.js'
import type { Job, Worker } from '../types.js'
import { PRIORITY_WEIGHT } from '../types.js'

export function syncWorkerLoad(): void {
  const counts = new Map<string, number>()
  for (const job of store.jobs.values()) {
    if (job.status === 'running' && job.workerId) {
      counts.set(job.workerId, (counts.get(job.workerId) ?? 0) + 1)
    }
  }
  for (const worker of store.workers.values()) {
    worker.activeJobs = counts.get(worker.id) ?? 0
    store.saveWorker(worker)
  }
}

export function getAvailableWorkers(): Worker[] {
  return store.getAllWorkers().filter(
    (w) => w.status === 'healthy' && w.activeJobs < w.capacity,
  )
}

export function pickWorkerForJob(job: Job): Worker | null {
  const available = getAvailableWorkers()
  if (available.length === 0) return null

  const weighted = available.flatMap((w) =>
    Array(Math.max(1, Math.round(w.trafficWeight / 10))).fill(w),
  )

  weighted.sort((a, b) => {
    const loadA = a.activeJobs / a.capacity
    const loadB = b.activeJobs / b.capacity
    return loadA - loadB
  })

  return weighted[0] ?? available[0]
}

export function findBackupWorker(fromWorkerId: string): Worker | null {
  const from = store.getWorker(fromWorkerId)
  if (!from) return null

  return (
    store.getAllWorkers().find(
      (w) =>
        w.id !== fromWorkerId &&
        w.region === from.region &&
        w.status === 'healthy' &&
        w.activeJobs < w.capacity,
    ) ??
    store.getAllWorkers().find(
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

export function getPendingJobs(): Job[] {
  const now = Date.now()
  return sortJobsByPriority(
    store.getAllJobs().filter((j) => {
      if (j.status === 'queued') return true
      if (j.status === 'retrying' && j.retryAt && new Date(j.retryAt).getTime() <= now) {
        return true
      }
      return false
    }),
  )
}
