import type {
  Alert,
  CreateJobInput,
  DashboardMetrics,
  FailoverEvent,
  Job,
  Worker,
  TimeSeriesPoint,
} from './types'

const API = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  return request('/metrics')
}

export async function fetchJobs(): Promise<Job[]> {
  return request('/jobs')
}

export async function fetchWorkers(): Promise<Worker[]> {
  return request('/workers')
}

export async function fetchAlerts(): Promise<Alert[]> {
  return request('/monitoring/alerts')
}

export async function fetchFailoverEvents(): Promise<FailoverEvent[]> {
  return request('/monitoring/failovers')
}

export async function fetchSuccessRateHistory(): Promise<TimeSeriesPoint[]> {
  return request('/metrics/success-rate')
}

export async function fetchThroughputHistory(): Promise<TimeSeriesPoint[]> {
  return request('/metrics/throughput')
}

export async function fetchLatencyHistory(): Promise<TimeSeriesPoint[]> {
  return request('/metrics/latency')
}

export async function fetchQueueDepth(): Promise<TimeSeriesPoint[]> {
  return request('/metrics/queue-depth')
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  return request('/jobs', { method: 'POST', body: JSON.stringify(input) })
}

export async function retryJob(jobId: string): Promise<Job> {
  return request(`/jobs/${jobId}/retry`, { method: 'POST' })
}

export async function cancelJob(jobId: string): Promise<void> {
  return request(`/jobs/${jobId}`, { method: 'DELETE' })
}

export async function resolveAlert(alertId: string): Promise<void> {
  return request(`/monitoring/alerts/${alertId}/resolve`, { method: 'PATCH' })
}

export async function triggerFailover(fromWorkerId: string): Promise<FailoverEvent> {
  return request(`/workers/${fromWorkerId}/failover`, { method: 'POST' })
}
