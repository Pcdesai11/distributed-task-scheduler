import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const variants = {
  primary:
    'bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-500/50 shadow-lg shadow-cyan-900/20',
  secondary:
    'bg-surface-700 text-slate-200 hover:bg-surface-600 border border-surface-600',
  ghost: 'text-slate-400 hover:text-slate-200 hover:bg-surface-700/50 border border-transparent',
  danger:
    'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
