import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Table2, Settings, ChevronRight, Plane, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard',          icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Measure Portfolio',  icon: Table2,          to: '/portfolio' },
  { label: 'Ideation Assistant', icon: Lightbulb,       to: '/ideation'  },
]

const secondaryItems = [
  { label: 'Risk Register', icon: AlertTriangle, to: '#', disabled: true },
  { label: 'Value Tracking', icon: TrendingUp, to: '#', disabled: true },
  { label: 'Settings', icon: Settings, to: '#', disabled: true },
]

export default function Sidebar() {
  return (
    <aside className="w-64 flex flex-col bg-slate-900 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shadow-lg">
          <Plane className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight tracking-tight">StratosAir</p>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Stratos Impact</p>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')} strokeWidth={1.8} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-300" />}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-6">
          <p className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">More</p>
          {secondaryItems.map(item => (
            <button
              key={item.label}
              disabled={item.disabled}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 cursor-not-allowed"
            >
              <item.icon className="w-4.5 h-4.5 shrink-0 text-slate-600" strokeWidth={1.8} />
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">Soon</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Program Badge */}
      <div className="px-4 pb-5">
        <div className="bg-slate-800 rounded-xl p-3.5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Program Status</span>
            <span className="text-[11px] font-bold text-emerald-400">Active</span>
          </div>
          <p className="text-sm font-semibold text-white">Project Horizon</p>
          <p className="text-[11px] text-slate-400 mt-0.5">50 Measures · 8 Workstreams</p>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Overall Progress</span>
              <span className="text-[11px] font-semibold text-slate-300">38%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '38%' }} />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
