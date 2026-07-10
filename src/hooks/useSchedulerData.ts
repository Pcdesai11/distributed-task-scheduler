import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/schedulerApi'
import type {
  Alert,
  DashboardMetrics,
  FailoverEvent,
  Job,
  JobStatus,
  Worker,
  TimeSeriesPoint,
} from '../api/types'

export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [successRate, setSuccessRate] = useState<TimeSeriesPoint[]>([])
  const [throughput, setThroughput] = useState<TimeSeriesPoint[]>([])
  const [latency, setLatency] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, sr, tp, lat] = await Promise.all([
        api.fetchMetrics(),
        api.fetchSuccessRateHistory(),
        api.fetchThroughputHistory(),
        api.fetchLatencyHistory(),
      ])
      setMetrics(m)
      setSuccessRate(sr)
      setThroughput(tp)
      setLatency(lat)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { metrics, successRate, throughput, latency, loading, error, refresh }
}

export function useJobs(page = 1, limit = 50, status: JobStatus | 'all' = 'all') {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.fetchJobsPage(page, limit, status)
      setJobs(result.jobs)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [page, limit, status])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { jobs, total, totalPages, loading, error, refresh }
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWorkers(await api.fetchWorkers())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { workers, loading, error, refresh }
}

export function useMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [failovers, setFailovers] = useState<FailoverEvent[]>([])
  const [queueDepth, setQueueDepth] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [a, f, q] = await Promise.all([
        api.fetchAlerts(),
        api.fetchFailoverEvents(),
        api.fetchQueueDepth(),
      ])
      setAlerts(a)
      setFailovers(f)
      setQueueDepth(q)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 12_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { alerts, failovers, queueDepth, loading, error, refresh }
}
