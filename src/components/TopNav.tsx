import { Bell, Search, ChevronDown, RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Executive Dashboard', subtitle: 'Program Overview — Project Horizon' },
  '/portfolio': { title: 'Measure Portfolio', subtitle: 'All transformation measures' },
}

export default function TopNav() {
  const location = useLocation()
  const isDetail = location.pathname.includes('/portfolio/') && location.pathname !== '/portfolio'
  const key = isDetail ? '/portfolio' : location.pathname
  const page = pageTitles[key] ?? { title: 'Stratos Impact', subtitle: '' }

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
      <div>
        <h1 className="text-base font-semibold text-foreground leading-tight">{page.title}</h1>
        {page.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Last Updated */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
          <RefreshCw className="w-3 h-3" />
          <span>Last updated: Nov 12, 2024</span>
        </div>

        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors border border-border">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:block text-xs">Quick search…</span>
          <kbd className="hidden md:block text-[10px] bg-muted rounded px-1 py-0.5 text-muted-foreground border border-border">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2.5 hover:bg-muted rounded-lg px-2.5 py-1.5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">TO</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-foreground leading-tight">Trans. Office</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
        </button>
      </div>
    </header>
  )
}
