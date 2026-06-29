import { ArrowRightLeft, Cpu, HardDrive } from 'lucide-react'
import type { Worker } from '../../api/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface WorkerCardProps {
  worker: Worker
  onFailover?: (id: string) => void
}

const statusVariant = {
  healthy: 'success' as const,
  degraded: 'warning' as const,
  offline: 'danger' as const,
  draining: 'info' as const,
}

export function WorkerCard({ worker, onFailover }: WorkerCardProps) {
  const loadPercent = Math.round((worker.activeJobs / worker.capacity) * 100)

  return (
    <div className="rounded-xl border border-surface-600/60 bg-surface-900/80 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100">{worker.name}</h4>
            {worker.isPrimary && <Badge variant="accent">Primary</Badge>}
          </div>
          <p className="mt-0.5 font-mono text-xs text-slate-500">{worker.id}</p>
        </div>
        <Badge variant={statusVariant[worker.status]}>{worker.status}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <Metric icon={Cpu} label="CPU" value={`${worker.cpuPercent}%`} warn={worker.cpuPercent > 85} />
        <Metric
          icon={HardDrive}
          label="Memory"
          value={`${worker.memoryPercent}%`}
          warn={worker.memoryPercent > 85}
        />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Load</span>
          <span>
            {worker.activeJobs}/{worker.capacity} jobs ({loadPercent}%)
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-700">
          <div
            className={`h-full rounded-full transition-all ${
              loadPercent > 85 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(loadPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-surface-600/40 pt-4">
        <div className="text-xs text-slate-500">
          <span className="text-slate-400">{worker.region}</span>
          {worker.trafficWeight > 0 && (
            <span className="ml-2 text-cyan-400">{worker.trafficWeight}% traffic</span>
          )}
        </div>
        {worker.status !== 'offline' && onFailover && !worker.isPrimary && (
          <Button variant="secondary" size="sm" onClick={() => onFailover(worker.id)}>
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Failover
          </Button>
        )}
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: typeof Cpu
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-800/60 px-3 py-2">
      <Icon className={`h-3.5 w-3.5 ${warn ? 'text-red-400' : 'text-slate-500'}`} />
      <div>
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className={`font-mono text-sm ${warn ? 'text-red-400' : 'text-slate-200'}`}>{value}</p>
      </div>
    </div>
  )
}
