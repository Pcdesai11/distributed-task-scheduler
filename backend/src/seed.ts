import { v4 as uuid } from 'uuid'
import { store } from './store/memoryStore.js'
import type { Job, Worker } from './types.js'

const queues = ['default', 'billing', 'notifications', 'analytics', 'exports']
const jobNames = [
  'invoice-sync',
  'email-digest',
  'report-export',
  'user-cleanup',
  'cache-warm',
  'webhook-retry',
  'data-backfill',
  'metrics-rollup',
  'search-index',
  'payment-reconcile',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

export function seedWorkers(): void {
  const workers: Worker[] = [
    {
      id: 'worker-01',
      name: 'scheduler-primary-us-east',
      region: 'us-east-1',
      status: 'healthy',
      activeJobs: 0,
      capacity: 200,
      cpuPercent: 68,
      memoryPercent: 54,
      lastHeartbeat: new Date().toISOString(),
      isPrimary: true,
      trafficWeight: 55,
    },
    {
      id: 'worker-02',
      name: 'scheduler-backup-us-east',
      region: 'us-east-1',
      status: 'healthy',
      activeJobs: 0,
      capacity: 200,
      cpuPercent: 45,
      memoryPercent: 41,
      lastHeartbeat: new Date().toISOString(),
      isPrimary: false,
      trafficWeight: 30,
    },
    {
      id: 'worker-03',
      name: 'scheduler-primary-us-west',
      region: 'us-west-2',
      status: 'healthy',
      activeJobs: 0,
      capacity: 200,
      cpuPercent: 72,
      memoryPercent: 61,
      lastHeartbeat: new Date().toISOString(),
      isPrimary: true,
      trafficWeight: 15,
    },
    {
      id: 'worker-04',
      name: 'scheduler-backup-us-west',
      region: 'us-west-2',
      status: 'degraded',
      activeJobs: 0,
      capacity: 200,
      cpuPercent: 91,
      memoryPercent: 88,
      lastHeartbeat: minutesAgo(1),
      isPrimary: false,
      trafficWeight: 0,
    },
    {
      id: 'worker-05',
      name: 'scheduler-eu-central',
      region: 'eu-central-1',
      status: 'healthy',
      activeJobs: 0,
      capacity: 150,
      cpuPercent: 52,
      memoryPercent: 48,
      lastHeartbeat: new Date().toISOString(),
      isPrimary: true,
      trafficWeight: 0,
    },
    {
      id: 'worker-06',
      name: 'scheduler-eu-backup',
      region: 'eu-central-1',
      status: 'offline',
      activeJobs: 0,
      capacity: 150,
      cpuPercent: 0,
      memoryPercent: 0,
      lastHeartbeat: minutesAgo(45),
      isPrimary: false,
      trafficWeight: 0,
    },
  ]

  for (const w of workers) store.saveWorker(w)
}

export function seedJobs(count = 1200): void {
  for (let i = 0; i < count; i++) {
    const status = pick([
      'running',
      'running',
      'running',
      'completed',
      'completed',
      'queued',
      'queued',
      'failed',
      'retrying',
    ] as Job['status'][])

    const workerIds = ['worker-01', 'worker-02', 'worker-03', 'worker-05']
    const job: Job = {
      id: store.nextJobId(),
      name: `${pick(jobNames)}-${i + 1}`,
      status,
      priority: pick(['low', 'normal', 'high', 'critical']),
      workerId: status === 'queued' ? null : pick(workerIds),
      queue: pick(queues),
      attempts: status === 'failed' ? 3 : status === 'retrying' ? 2 : 1,
      maxRetries: 3,
      scheduledAt: minutesAgo(Math.floor(Math.random() * 120)),
      startedAt: status !== 'queued' ? minutesAgo(Math.floor(Math.random() * 30)) : null,
      completedAt: status === 'completed' ? minutesAgo(Math.floor(Math.random() * 5)) : null,
      durationMs:
        status === 'completed' || status === 'running'
          ? Math.floor(Math.random() * 8000) + 200
          : null,
      payload: { batchSize: Math.floor(Math.random() * 500) + 10 },
    }
    store.saveJob(job)

    if (status === 'completed') store.metrics.completedToday++
    if (status === 'failed') store.metrics.failedToday++
  }
}

export function seedAlerts(): void {
  store.alerts = [
    {
      id: uuid(),
      severity: 'warning',
      title: 'Worker degraded',
      message: 'worker-04 CPU at 91% — traffic rerouted to worker-03 backup',
      timestamp: minutesAgo(12),
      resolved: false,
    },
    {
      id: uuid(),
      severity: 'critical',
      title: 'Worker offline',
      message: 'worker-06 missed 3 heartbeats — automatic failover triggered',
      timestamp: minutesAgo(45),
      resolved: true,
    },
    {
      id: uuid(),
      severity: 'info',
      title: 'Retry batch completed',
      message: '42 failed jobs re-queued with exponential backoff',
      timestamp: minutesAgo(8),
      resolved: true,
    },
  ]
}

export function seedFailovers(): void {
  store.failovers = [
    {
      id: uuid(),
      timestamp: minutesAgo(45),
      fromWorker: 'worker-06',
      toWorker: 'worker-05',
      reason: 'Heartbeat timeout (3 consecutive misses)',
      jobsRerouted: 34,
    },
    {
      id: uuid(),
      timestamp: minutesAgo(12),
      fromWorker: 'worker-04',
      toWorker: 'worker-03',
      reason: 'CPU threshold exceeded (91%)',
      jobsRerouted: 18,
    },
  ]
  store.metrics.reroutesToday = 52
  store.metrics.retriesToday = 187
}

export function seedMetricsHistory(): void {
  store.metrics.successRateHistory = [
    { time: '00:00', value: 99.1 },
    { time: '04:00', value: 99.3 },
    { time: '08:00', value: 99.6 },
    { time: '12:00', value: 99.4 },
    { time: '16:00', value: 99.5 },
    { time: '20:00', value: 99.52 },
    { time: 'Now', value: 99.52 },
  ]
  store.metrics.throughputHistory = [
    { time: '00:00', value: 820 },
    { time: '04:00', value: 640 },
    { time: '08:00', value: 1100 },
    { time: '12:00', value: 1340 },
    { time: '16:00', value: 1280 },
    { time: '20:00', value: 1050 },
    { time: 'Now', value: 1247 },
  ]
  store.metrics.latencyHistory = [
    { time: '00:00', value: 410 },
    { time: '04:00', value: 380 },
    { time: '08:00', value: 520 },
    { time: '12:00', value: 390 },
    { time: '16:00', value: 355 },
    { time: '20:00', value: 330 },
    { time: 'Now', value: 342 },
  ]
}

export function seedAll(): void {
  seedWorkers()
  seedJobs(1200)
  seedAlerts()
  seedFailovers()
  seedMetricsHistory()
}
