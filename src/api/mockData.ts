import type {
  Alert,
  DashboardMetrics,
  FailoverEvent,
  Job,
  JobStatus,
  TimeSeriesPoint,
  Worker,
} from './types'

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

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString()
}

function generateJobs(count: number): Job[] {
  const statuses: JobStatus[] = [
    'running',
    'running',
    'running',
    'completed',
    'completed',
    'completed',
    'queued',
    'queued',
    'failed',
    'retrying',
    'rerouted',
  ]

  return Array.from({ length: count }, (_, i) => {
    const status = randomItem(statuses)
    const attempts = status === 'failed' ? 3 : status === 'retrying' ? 2 : 1
    const started =
      status !== 'queued' ? minutesAgo(Math.floor(Math.random() * 30)) : null
    const completed =
      status === 'completed' ? minutesAgo(Math.floor(Math.random() * 5)) : null

    return {
      id: `job-${String(i + 1).padStart(5, '0')}`,
      name: `${randomItem(jobNames)}-${i + 1}`,
      status,
      priority: randomItem(['low', 'normal', 'high', 'critical'] as const),
      workerId:
        status === 'queued'
          ? null
          : `worker-${String((i % 8) + 1).padStart(2, '0')}`,
      queue: randomItem(queues),
      attempts,
      maxRetries: 3,
      scheduledAt: minutesAgo(Math.floor(Math.random() * 120)),
      startedAt: started,
      completedAt: completed,
      durationMs:
        completed || status === 'running'
          ? Math.floor(Math.random() * 8000) + 200
          : null,
      payload: { batchSize: Math.floor(Math.random() * 500) + 10 },
    }
  })
}

export const mockWorkers: Worker[] = [
  {
    id: 'worker-01',
    name: 'scheduler-primary-us-east',
    region: 'us-east-1',
    status: 'healthy',
    activeJobs: 142,
    capacity: 200,
    cpuPercent: 68,
    memoryPercent: 54,
    lastHeartbeat: minutesAgo(0),
    isPrimary: true,
    trafficWeight: 55,
  },
  {
    id: 'worker-02',
    name: 'scheduler-backup-us-east',
    region: 'us-east-1',
    status: 'healthy',
    activeJobs: 98,
    capacity: 200,
    cpuPercent: 45,
    memoryPercent: 41,
    lastHeartbeat: minutesAgo(0),
    isPrimary: false,
    trafficWeight: 30,
  },
  {
    id: 'worker-03',
    name: 'scheduler-primary-us-west',
    region: 'us-west-2',
    status: 'healthy',
    activeJobs: 131,
    capacity: 200,
    cpuPercent: 72,
    memoryPercent: 61,
    lastHeartbeat: minutesAgo(0),
    isPrimary: true,
    trafficWeight: 15,
  },
  {
    id: 'worker-04',
    name: 'scheduler-backup-us-west',
    region: 'us-west-2',
    status: 'degraded',
    activeJobs: 12,
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
    activeJobs: 87,
    capacity: 150,
    cpuPercent: 52,
    memoryPercent: 48,
    lastHeartbeat: minutesAgo(0),
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

export const mockJobs: Job[] = generateJobs(48)

export const mockMetrics: DashboardMetrics = {
  activeJobs: 1247,
  queuedJobs: 384,
  successRate: 99.52,
  avgLatencyMs: 342,
  retriesToday: 187,
  reroutesToday: 23,
  uptimePercent: 99.91,
  downtimeReductionPercent: 60,
}

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    severity: 'warning',
    title: 'Worker degraded',
    message: 'worker-04 CPU at 91% — traffic rerouted to worker-03 backup',
    timestamp: minutesAgo(12),
    resolved: false,
  },
  {
    id: 'alert-2',
    severity: 'critical',
    title: 'Worker offline',
    message: 'worker-06 missed 3 heartbeats — automatic failover triggered',
    timestamp: minutesAgo(45),
    resolved: true,
  },
  {
    id: 'alert-3',
    severity: 'info',
    title: 'Retry batch completed',
    message: '42 failed jobs re-queued with exponential backoff',
    timestamp: minutesAgo(8),
    resolved: true,
  },
  {
    id: 'alert-4',
    severity: 'warning',
    title: 'Queue backlog rising',
    message: 'notifications queue depth exceeded 200 jobs',
    timestamp: minutesAgo(3),
    resolved: false,
  },
]

export const mockFailoverEvents: FailoverEvent[] = [
  {
    id: 'fo-1',
    timestamp: minutesAgo(45),
    fromWorker: 'worker-06',
    toWorker: 'worker-05',
    reason: 'Heartbeat timeout (3 consecutive misses)',
    jobsRerouted: 34,
  },
  {
    id: 'fo-2',
    timestamp: minutesAgo(12),
    fromWorker: 'worker-04',
    toWorker: 'worker-03',
    reason: 'CPU threshold exceeded (91%)',
    jobsRerouted: 18,
  },
  {
    id: 'fo-3',
    timestamp: minutesAgo(180),
    fromWorker: 'worker-02',
    toWorker: 'worker-01',
    reason: 'Memory pressure — proactive drain',
    jobsRerouted: 52,
  },
]

export const successRateHistory: TimeSeriesPoint[] = [
  { time: '00:00', value: 99.1 },
  { time: '04:00', value: 99.3 },
  { time: '08:00', value: 99.6 },
  { time: '12:00', value: 99.4 },
  { time: '16:00', value: 99.5 },
  { time: '20:00', value: 99.52 },
  { time: 'Now', value: 99.52 },
]

export const throughputHistory: TimeSeriesPoint[] = [
  { time: '00:00', value: 820 },
  { time: '04:00', value: 640 },
  { time: '08:00', value: 1100 },
  { time: '12:00', value: 1340 },
  { time: '16:00', value: 1280 },
  { time: '20:00', value: 1050 },
  { time: 'Now', value: 1247 },
]

export const latencyHistory: TimeSeriesPoint[] = [
  { time: '00:00', value: 410 },
  { time: '04:00', value: 380 },
  { time: '08:00', value: 520 },
  { time: '12:00', value: 390 },
  { time: '16:00', value: 355 },
  { time: '20:00', value: 330 },
  { time: 'Now', value: 342 },
]

export const queueDepthHistory: TimeSeriesPoint[] = queues.map((q) => ({
  time: q,
  value: Math.floor(Math.random() * 180) + 20,
}))
