import type { JobStatus } from '../../api/types'
import { Badge } from '../ui/Badge'

const statusConfig: Record<
  JobStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'accent' }
> = {
  queued: { label: 'Queued', variant: 'default' },
  running: { label: 'Running', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  retrying: { label: 'Retrying', variant: 'warning' },
  rerouted: { label: 'Rerouted', variant: 'accent' },
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
