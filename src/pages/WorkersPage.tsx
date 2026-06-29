import { triggerFailover } from '../api/schedulerApi'
import { Header } from '../components/layout/Header'
import { WorkerCard } from '../components/workers/WorkerCard'
import { Card } from '../components/ui/Card'
import { useWorkers } from '../hooks/useSchedulerData'

export function WorkersPage() {
  const { workers, loading, refresh } = useWorkers()

  const healthy = workers.filter((w) => w.status === 'healthy').length
  const totalCapacity = workers.reduce((s, w) => s + w.capacity, 0)
  const totalActive = workers.reduce((s, w) => s + w.activeJobs, 0)

  return (
    <>
      <Header
        title="Workers"
        subtitle="Distributed worker nodes with automatic failover"
        onRefresh={refresh}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500">Healthy Nodes</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-400">
              {healthy}/{workers.length}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500">Total Capacity</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-slate-100">
              {totalCapacity.toLocaleString()} jobs
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wider text-slate-500">Current Load</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-cyan-400">
              {totalActive.toLocaleString()} active
            </p>
          </Card>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading workers…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onFailover={async (id) => {
                  await triggerFailover(id)
                  refresh()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
