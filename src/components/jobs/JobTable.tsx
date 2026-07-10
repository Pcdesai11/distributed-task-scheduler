import { RotateCcw, Trash2 } from 'lucide-react'
import type { Job } from '../../api/types'
import { Button } from '../ui/Button'
import { JobStatusBadge } from './JobStatusBadge'

interface JobTableProps {
  jobs: Job[]
  onRetry: (id: string) => void
  onCancel: (id: string) => void
}

function formatTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function JobTable({ jobs, onRetry, onCancel }: JobTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-600/60">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-surface-600/50 bg-surface-800/80 text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-medium">Job</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Queue</th>
            <th className="px-4 py-3 font-medium">Worker</th>
            <th className="px-4 py-3 font-medium">Attempts</th>
            <th className="px-4 py-3 font-medium">Scheduled</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-surface-600/30 transition-colors hover:bg-surface-800/40"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-slate-200">{job.name}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  {job.id} · {job.handler}
                </p>
              </td>
              <td className="px-4 py-3">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3">
                <span className="rounded bg-surface-700 px-2 py-0.5 font-mono text-xs text-slate-300">
                  {job.queue}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                {job.workerId ?? '—'}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                {job.attempts}/{job.maxRetries}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{formatTime(job.scheduledAt)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {(job.status === 'failed' || job.status === 'retrying') && (
                    <Button variant="ghost" size="sm" onClick={() => onRetry(job.id)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {job.status !== 'running' && (
                    <Button variant="ghost" size="sm" onClick={() => onCancel(job.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
