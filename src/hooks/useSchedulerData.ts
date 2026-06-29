import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/schedulerApi'
import type {
  Alert,
  DashboardMetrics,
  FailoverEvent,
  Job,
  Worker,
  TimeSeriesPoint,
} from '../api/types'

export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [successRate, setSuccessRate] = useState<TimeSeriesPoint[]>([])
  const [throughput, setThroughput] = useState<TimeSeriesPoint[]>([])
  const [latency, setLatency] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
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
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { metrics, successRate, throughput, latency, loading, refresh }
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setJobs(await api.fetchJobs())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { jobs, loading, refresh }
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    setWorkers(await api.fetchWorkers())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { workers, loading, refresh }
}

export function useMonitoring() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [failovers, setFailovers] = useState<FailoverEvent[]>([])
  const [queueDepth, setQueueDepth] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const [a, f, q] = await Promise.all([
      api.fetchAlerts(),
      api.fetchFailoverEvents(),
      api.fetchQueueDepth(),
    ])
    setAlerts(a)
    setFailovers(f)
    setQueueDepth(q)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 12_000)
    return () => clearInterval(interval)
  }, [refresh])

  return { alerts, failovers, queueDepth, loading, refresh }
}
