export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'rerouted'

export type JobPriority = 'low' | 'normal' | 'high' | 'critical'

export type WorkerStatus = 'healthy' | 'degraded' | 'offline' | 'draining'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Job {
  id: string
  name: string
  handler: string
  status: JobStatus
  priority: JobPriority
  workerId: string | null
  queue: string
  attempts: number
  maxRetries: number
  scheduledAt: string
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  payload: Record<string, unknown>
  retryAt?: string | null
}

export interface Worker {
  id: string
  name: string
  region: string
  status: WorkerStatus
  activeJobs: number
  capacity: number
  cpuPercent: number
  memoryPercent: number
  lastHeartbeat: string
  isPrimary: boolean
  trafficWeight: number
}

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  timestamp: string
  resolved: boolean
}

export interface FailoverEvent {
  id: string
  timestamp: string
  fromWorker: string
  toWorker: string
  reason: string
  jobsRerouted: number
}

export interface DashboardMetrics {
  activeJobs: number
  queuedJobs: number
  successRate: number
  avgLatencyMs: number
  retriesToday: number
  reroutesToday: number
  uptimePercent: number
  downtimeReductionPercent: number
}

export interface TimeSeriesPoint {
  time: string
  value: number
  label?: string
}

export interface CreateJobInput {
  name: string
  queue: string
  handler?: string
  priority: JobPriority
  maxRetries: number
  payload: Record<string, unknown>
}

export interface MetricsSnapshot {
  completedToday: number
  failedToday: number
  retriesToday: number
  reroutesToday: number
  latencies: number[]
  successRateHistory: TimeSeriesPoint[]
  throughputHistory: TimeSeriesPoint[]
  latencyHistory: TimeSeriesPoint[]
  serverStartedAt: number
}
