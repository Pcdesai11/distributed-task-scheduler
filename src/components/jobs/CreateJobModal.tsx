import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { CreateJobInput, JobPriority } from '../../api/types'
import { Button } from '../ui/Button'

interface CreateJobModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateJobInput) => Promise<void>
}

const queues = ['default', 'billing', 'notifications', 'analytics', 'exports']
const priorities: JobPriority[] = ['low', 'normal', 'high', 'critical']

export function CreateJobModal({ open, onClose, onSubmit }: CreateJobModalProps) {
  const [name, setName] = useState('')
  const [queue, setQueue] = useState('default')
  const [priority, setPriority] = useState<JobPriority>('normal')
  const [maxRetries, setMaxRetries] = useState(3)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({
      name,
      queue,
      priority,
      maxRetries,
      payload: { source: 'dashboard' },
    })
    setSubmitting(false)
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-surface-600 bg-surface-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-600/50 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-100">Schedule New Job</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Job Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. invoice-sync-batch"
              className={inputClass}
            />
          </Field>
          <Field label="Queue">
            <select value={queue} onChange={(e) => setQueue(e.target.value)} className={inputClass}>
              {queues.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
              className={inputClass}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Max Retries">
            <input
              type="number"
              min={0}
              max={10}
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              <Plus className="h-4 w-4" />
              {submitting ? 'Scheduling…' : 'Schedule Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30'
