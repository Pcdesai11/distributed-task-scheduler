import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { cancelJob, createJob, retryJob } from '../api/schedulerApi'
import type { JobStatus } from '../api/types'
import { CreateJobModal } from '../components/jobs/CreateJobModal'
import { JobTable } from '../components/jobs/JobTable'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { useJobs } from '../hooks/useSchedulerData'

const statusFilters: (JobStatus | 'all')[] = [
  'all',
  'running',
  'queued',
  'completed',
  'failed',
  'retrying',
  'rerouted',
]

export function JobsPage() {
  const { jobs, loading, refresh } = useJobs()
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.name.toLowerCase().includes(search.toLowerCase()) ||
        j.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || j.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [jobs, search, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: jobs.length }
    for (const j of jobs) c[j.status] = (c[j.status] ?? 0) + 1
    return c
  }, [jobs])

  return (
    <>
      <Header
        title="Jobs"
        subtitle={`${jobs.length} scheduled tasks across 5 queues`}
        onRefresh={refresh}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule Job
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                    : 'bg-surface-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'all' ? 'All' : s}
                <span className="ml-1.5 text-slate-500">({counts[s] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading jobs…</p>
        ) : (
          <JobTable
            jobs={filtered}
            onRetry={async (id) => {
              await retryJob(id)
              refresh()
            }}
            onCancel={async (id) => {
              await cancelJob(id)
              refresh()
            }}
          />
        )}
      </div>

      <CreateJobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (input) => {
          await createJob(input)
          refresh()
        }}
      />
    </>
  )
}
