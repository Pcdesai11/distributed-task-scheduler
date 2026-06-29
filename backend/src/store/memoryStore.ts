import type {
  Alert,
  FailoverEvent,
  Job,
  MetricsSnapshot,
  Worker,
} from '../types.js'

class MemoryStore {
  jobs = new Map<string, Job>()
  workers = new Map<string, Worker>()
  alerts: Alert[] = []
  failovers: FailoverEvent[] = []
  metrics: MetricsSnapshot = {
    completedToday: 0,
    failedToday: 0,
    retriesToday: 0,
    reroutesToday: 0,
    latencies: [],
    successRateHistory: [],
    throughputHistory: [],
    latencyHistory: [],
    serverStartedAt: Date.now(),
  }
  jobCounter = 0

  nextJobId(): string {
    this.jobCounter += 1
    return `job-${String(this.jobCounter).padStart(5, '0')}`
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    )
  }

  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values())
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id)
  }

  getWorker(id: string): Worker | undefined {
    return this.workers.get(id)
  }

  saveJob(job: Job): void {
    this.jobs.set(job.id, job)
  }

  deleteJob(id: string): void {
    this.jobs.delete(id)
  }

  saveWorker(worker: Worker): void {
    this.workers.set(worker.id, worker)
  }

  addAlert(alert: Alert): void {
    this.alerts.unshift(alert)
    if (this.alerts.length > 100) this.alerts.pop()
  }

  addFailover(event: FailoverEvent): void {
    this.failovers.unshift(event)
    if (this.failovers.length > 50) this.failovers.pop()
  }
}

export const store = new MemoryStore()
