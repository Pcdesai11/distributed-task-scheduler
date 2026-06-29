import type { Alert, FailoverEvent } from '../../api/types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const severityVariant = {
  info: 'info' as const,
  warning: 'warning' as const,
  critical: 'danger' as const,
}

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const active = alerts.filter((a) => !a.resolved).slice(0, 5)

  return (
    <Card title="Active Alerts" subtitle="Auto-detected by monitoring scripts">
      {active.length === 0 ? (
        <p className="text-sm text-slate-500">No active alerts</p>
      ) : (
        <ul className="space-y-3">
          {active.map((alert) => (
            <li
              key={alert.id}
              className="rounded-lg border border-surface-600/40 bg-surface-800/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge>
                <span className="font-mono text-[10px] text-slate-500">
                  {formatTime(alert.timestamp)}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">{alert.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function FailoverTimeline({ events }: { events: FailoverEvent[] }) {
  return (
    <Card title="Failover Events" subtitle="Automatic traffic rerouting history">
      <div className="relative space-y-4 pl-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-surface-600">
        {events.slice(0, 4).map((event) => (
          <div key={event.id} className="relative pl-5">
            <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-500 bg-surface-900" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-slate-500">
                {formatTime(event.timestamp)}
              </span>
              <span className="text-xs text-cyan-400">{event.fromWorker}</span>
              <span className="text-xs text-slate-600">→</span>
              <span className="text-xs text-emerald-400">{event.toWorker}</span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{event.reason}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {event.jobsRerouted} jobs rerouted
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
