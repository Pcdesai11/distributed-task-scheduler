import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-8 mt-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function PageError({ message, children }: { message: string | null; children: ReactNode }) {
  if (message) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-300">{message}</p>
        <p className="text-xs text-slate-500">
          Make sure Postgres, Redis, API, and worker are running.
        </p>
      </div>
    )
  }
  return <>{children}</>
}
