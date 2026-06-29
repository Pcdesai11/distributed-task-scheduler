import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  trend?: { value: string; positive: boolean }
  accent?: 'cyan' | 'green' | 'amber' | 'red'
}

const accentColors = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accent = 'cyan',
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-600/60 bg-surface-900/80 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-50">
            {value}
          </p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
          {trend && (
            <p
              className={`mt-2 text-xs font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`rounded-lg border p-2.5 ${accentColors[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
