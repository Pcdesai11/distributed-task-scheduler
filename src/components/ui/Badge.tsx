import type { ReactNode } from 'react'

const variants = {
  default: 'bg-surface-800 text-slate-300 border-surface-600',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  accent: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
} as const

interface BadgeProps {
  children: ReactNode
  variant?: keyof typeof variants
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
