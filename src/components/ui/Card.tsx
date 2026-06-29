import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-surface-600/60 bg-surface-900/80 backdrop-blur-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between border-b border-surface-600/40 px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={title || action ? 'p-5' : 'p-5'}>{children}</div>
    </div>
  )
}
