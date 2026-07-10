import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { MetricChart } from '../components/dashboard/MetricChart'
import { Header } from '../components/layout/Header'
import { AlertList, FailoverTimeline } from '../components/monitoring/AlertPanel'
import { StatCard } from '../components/ui/StatCard'
import { PageError } from '../components/ui/ErrorBanner'
import { useDashboardData, useMonitoring } from '../hooks/useSchedulerData'

export function DashboardPage() {
  const { metrics, successRate, throughput, latency, loading, error, refresh } = useDashboardData()
  const { alerts, failovers } = useMonitoring()

  if (loading && !metrics) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    )
  }

  if (!metrics) {
    return <PageError message={error}><></></PageError>
  }

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Real-time overview of distributed job execution"
        onRefresh={refresh}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Jobs"
            value={metrics.activeJobs.toLocaleString()}
            subtext={`${metrics.queuedJobs} queued`}
            icon={Zap}
            accent="cyan"
            trend={{ value: '+12% vs yesterday', positive: true }}
          />
          <StatCard
            label="Success Rate"
            value={`${metrics.successRate}%`}
            subtext="Target: 99.5%"
            icon={CheckCircle2}
            accent="green"
            trend={{ value: 'Above target', positive: true }}
          />
          <StatCard
            label="Avg Latency"
            value={`${metrics.avgLatencyMs}ms`}
            subtext="P50 execution time"
            icon={Clock}
            accent="cyan"
          />
          <StatCard
            label="System Uptime"
            value={`${metrics.uptimePercent}%`}
            subtext={`${metrics.downtimeReductionPercent}% downtime reduction`}
            icon={TrendingUp}
            accent="green"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Retries Today"
            value={metrics.retriesToday}
            subtext="Auto-retry with backoff"
            icon={RefreshCw}
            accent="amber"
          />
          <StatCard
            label="Reroutes Today"
            value={metrics.reroutesToday}
            subtext="Failed jobs rerouted"
            icon={Layers}
            accent="amber"
          />
          <StatCard
            label="Monitoring"
            value="24/7"
            subtext="Health checks every 10s"
            icon={Activity}
            accent="cyan"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MetricChart
            data={successRate}
            title="Success Rate"
            subtitle="Last 24 hours"
            color="#34d399"
            unit="%"
            domain={[98.5, 100]}
          />
          <MetricChart
            data={throughput}
            title="Concurrent Jobs"
            subtitle="Active job count over time"
            color="#22d3ee"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MetricChart
            data={latency}
            title="Execution Latency"
            subtitle="Average job duration (ms)"
            color="#a78bfa"
            unit="ms"
          />
          <div className="grid grid-cols-1 gap-4">
            <AlertList alerts={alerts} />
          </div>
        </div>

        <div className="mt-4">
          <FailoverTimeline events={failovers} />
        </div>
      </div>
    </>
  )
}
