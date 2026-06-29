import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  action?: React.ReactNode
}

export function Header({ title, subtitle, onRefresh, action }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-surface-600/40 bg-surface-950/50 px-8 py-5 backdrop-blur-sm">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-50">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        )}
        {action}
      </div>
    </header>
  )
}
