import { v4 as uuid } from 'uuid'
import { resolveHandler } from './config.js'
import { enqueueJob } from './queue/index.js'
import * as store from './store/postgresStore.js'
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

export async function seedWorkers(): Promise<void> {
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
      status: 'healthy',
      activeJobs: 0,
      capacity: 200,
      cpuPercent: 45,
      memoryPercent: 50,
      lastHeartbeat: new Date().toISOString(),
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

  for (const w of workers) await store.saveWorker(w)
}

export async function seedJobs(count = 50): Promise<void> {
  for (let i = 0; i < count; i++) {
    const name = `${pick(jobNames)}-${i + 1}`
    const handler = resolveHandler(name)
    const status = pick([
      'completed',
      'completed',
      'queued',
      'failed',
    ] as Job['status'][])

    const job: Job = {
      id: store.nextJobId(),
      name,
      handler,
      status,
      priority: pick(['low', 'normal', 'high', 'critical']),
      workerId: status === 'queued' ? null : 'worker-01',
      queue: pick(queues),
      attempts: status === 'failed' ? 3 : 1,
      maxRetries: 3,
      scheduledAt: minutesAgo(Math.floor(Math.random() * 120)),
      startedAt: status !== 'queued' ? minutesAgo(Math.floor(Math.random() * 30)) : null,
      completedAt: status === 'completed' ? minutesAgo(Math.floor(Math.random() * 5)) : null,
      durationMs:
        status === 'completed' ? Math.floor(Math.random() * 8000) + 200 : null,
      payload: { batchSize: Math.floor(Math.random() * 500) + 10 },
      retryAt: null,
    }
    await store.saveJob(job)

    if (status === 'queued') {
      await enqueueJob(
        { jobId: job.id, handler: job.handler, payload: job.payload },
        job.priority,
        job.maxRetries,
      )
    }
  }
}

export async function seedAlerts(): Promise<void> {
  await store.addAlert({
    id: uuid(),
    severity: 'info',
    title: 'Scheduler online',
    message: 'Chronos API connected to Postgres and Redis',
    timestamp: new Date().toISOString(),
    resolved: true,
  })
}

export async function seedFailovers(): Promise<void> {
  await store.addFailover({
    id: uuid(),
    timestamp: minutesAgo(45),
    fromWorker: 'worker-06',
    toWorker: 'worker-05',
    reason: 'Heartbeat timeout (3 consecutive misses)',
    jobsRerouted: 0,
  })

  const metrics = await store.getMetricsState()
  metrics.reroutesToday = 0
  metrics.retriesToday = 0
  await store.saveMetricsState(metrics)
}

export async function seedMetricsHistory(): Promise<void> {
  const metrics = await store.getMetricsState()
  metrics.successRateHistory = [
    { time: '00:00', value: 99.1 },
    { time: '04:00', value: 99.3 },
    { time: '08:00', value: 99.6 },
    { time: '12:00', value: 99.4 },
    { time: '16:00', value: 99.5 },
    { time: '20:00', value: 99.52 },
    { time: 'Now', value: 99.52 },
  ]
  metrics.throughputHistory = [
    { time: '00:00', value: 20 },
    { time: '04:00', value: 15 },
    { time: '08:00', value: 35 },
    { time: '12:00', value: 42 },
    { time: '16:00', value: 38 },
    { time: '20:00', value: 30 },
    { time: 'Now', value: 25 },
  ]
  metrics.latencyHistory = [
    { time: '00:00', value: 410 },
    { time: '04:00', value: 380 },
    { time: '08:00', value: 520 },
    { time: '12:00', value: 390 },
    { time: '16:00', value: 355 },
    { time: '20:00', value: 330 },
    { time: 'Now', value: 342 },
  ]
  await store.saveMetricsState(metrics)
}

interface SeedOptions {
  workersOnly?: boolean
  metricsOnly?: boolean
}

export async function seedAll(options: SeedOptions = {}): Promise<void> {
  if (options.metricsOnly) {
    await seedMetricsHistory()
    return
  }
  if (options.workersOnly) {
    await seedWorkers()
    return
  }
  await seedWorkers()
  await seedJobs(50)
  await seedAlerts()
  await seedFailovers()
  await seedMetricsHistory()
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') ?? '')) {
  ;(async () => {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    const { db, closeDb } = await import('./db/index.js')
    await migrate(db, { migrationsFolder: './drizzle' })
    await store.initJobCounter()
    await seedAll()
    console.log('Seed complete.')
    await closeDb()
    process.exit(0)
  })().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
