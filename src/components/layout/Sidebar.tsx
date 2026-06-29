import { NavLink } from 'react-router-dom'
import {
  Activity,
  LayoutDashboard,
  ListTodo,
  Server,
  Shield,
  Timer,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: ListTodo, label: 'Jobs' },
  { to: '/workers', icon: Server, label: 'Workers' },
  { to: '/monitoring', icon: Activity, label: 'Monitoring' },
]

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-surface-600/50 bg-surface-900/90">
      <div className="flex items-center gap-3 border-b border-surface-600/50 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 ring-1 ring-cyan-500/30">
          <Timer className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-50">Chronos</h1>
          <p className="text-[11px] text-slate-500">Task Scheduler</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20'
                  : 'text-slate-400 hover:bg-surface-800 hover:text-slate-200'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-600/50 p-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 ring-1 ring-emerald-500/20">
          <Shield className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-xs font-medium text-emerald-300">System Healthy</p>
            <p className="text-[10px] text-emerald-500/70">99.5% success rate</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
