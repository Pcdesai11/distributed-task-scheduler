import { Bell, CheckCircle, ShieldAlert } from 'lucide-react'
import { resolveAlert } from '../api/schedulerApi'
import { MetricChart } from '../components/dashboard/MetricChart'
import { Header } from '../components/layout/Header'
import { AlertList, FailoverTimeline } from '../components/monitoring/AlertPanel'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageError } from '../components/ui/ErrorBanner'
import { useMonitoring } from '../hooks/useSchedulerData'

export function MonitoringPage() {
  const { alerts, failovers, queueDepth, loading, error, refresh } = useMonitoring()

  const activeAlerts = alerts.filter((a) => !a.resolved)
  const resolvedAlerts = alerts.filter((a) => a.resolved)

  return (
    <>
      <Header
        title="Monitoring"
        subtitle="24/7 health checks with automatic failover"
        onRefresh={refresh}
      />
      <PageError message={error}>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Active Alerts</p>
                <p className="font-mono text-2xl font-semibold text-red-400">
                  {activeAlerts.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Resolved Today</p>
                <p className="font-mono text-2xl font-semibold text-emerald-400">
                  {resolvedAlerts.length}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-500/10 p-2">
                <Bell className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Failovers (24h)</p>
                <p className="font-mono text-2xl font-semibold text-cyan-400">
                  {failovers.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading monitoring data…</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <MetricChart
                data={queueDepth}
                title="Queue Depth"
                subtitle="Jobs waiting per queue"
                color="#fbbf24"
                type="bar"
              />
              <AlertList alerts={alerts} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FailoverTimeline events={failovers} />
              <Card title="All Alerts" subtitle="Full alert history">
                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {alerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-surface-600/40 bg-surface-800/40 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              alert.severity === 'critical'
                                ? 'danger'
                                : alert.severity === 'warning'
                                  ? 'warning'
                                  : 'info'
                            }
                          >
                            {alert.severity}
                          </Badge>
                          {alert.resolved && <Badge variant="success">resolved</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{alert.title}</p>
                        <p className="text-xs text-slate-500">{alert.message}</p>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            await resolveAlert(alert.id)
                            refresh()
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        )}
      </div>
      </PageError>
    </>
  )
}
