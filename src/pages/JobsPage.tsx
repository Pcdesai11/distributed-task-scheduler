import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { cancelJob, createJob, retryJob } from '../api/schedulerApi'
import type { JobStatus } from '../api/types'
import { CreateJobModal } from '../components/jobs/CreateJobModal'
import { JobTable } from '../components/jobs/JobTable'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { PageError } from '../components/ui/ErrorBanner'
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
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const { jobs, total, totalPages, loading, error, refresh } = useJobs(page, 50, statusFilter)

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        j.name.toLowerCase().includes(search.toLowerCase()) ||
        j.id.toLowerCase().includes(search.toLowerCase())
      return matchesSearch
    })
  }, [jobs, search])

  return (
    <>
      <Header
        title="Jobs"
        subtitle={`${total.toLocaleString()} scheduled tasks across 5 queues`}
        onRefresh={refresh}
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Schedule Job
          </Button>
        }
      />
      <PageError message={error}>
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
                  onClick={() => {
                    setStatusFilter(s)
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                      : 'bg-surface-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading jobs…</p>
          ) : (
            <>
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
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PageError>

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
