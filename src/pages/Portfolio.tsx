import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronUp, ChevronDown, ArrowUpDown, X } from 'lucide-react'
import { measures } from '@/data/measures'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge, RiskBadge, DIBadge, CategoryBadge } from '@/components/StatusBadge'
import type { Measure, MeasureStatus, MeasureCategory, RiskLevel, DILevel } from '@/types'

type SortKey = keyof Measure
type SortDir = 'asc' | 'desc'

const ALL = 'All'

export default function Portfolio() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterCategory, setFilterCategory] = useState<string>(ALL)
  const [filterBU, setFilterBU] = useState<string>(ALL)
  const [filterDI, setFilterDI] = useState<string>(ALL)
  const [filterRisk, setFilterRisk] = useState<string>(ALL)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFilters, setShowFilters] = useState(false)

  const businessUnits = useMemo(() => [ALL, ...Array.from(new Set(measures.map(m => m.businessUnit))).sort()], [])
  const statuses: string[] = [ALL, 'On Track', 'Watch', 'At Risk', 'Completed', 'Cancelled']
  const categories: string[] = [ALL, 'Revenue', 'Cost', 'Structural']
  const diLevels: string[] = [ALL, 'DI0', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5']
  const riskLevels: string[] = [ALL, 'Low', 'Medium', 'High', 'Critical']

  const filtered = useMemo(() => {
    let list = measures.filter(m => {
      if (filterStatus !== ALL && m.status !== filterStatus) return false
      if (filterCategory !== ALL && m.category !== filterCategory) return false
      if (filterBU !== ALL && m.businessUnit !== filterBU) return false
      if (filterDI !== ALL && m.diLevel !== filterDI) return false
      if (filterRisk !== ALL && m.riskLevel !== filterRisk) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          m.id.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          m.owner.toLowerCase().includes(q) ||
          m.businessUnit.toLowerCase().includes(q) ||
          m.workstream.toLowerCase().includes(q)
        )
      }
      return true
    })

    list = [...list].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [search, filterStatus, filterCategory, filterBU, filterDI, filterRisk, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/40" />
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-600" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
  }

  const activeFilterCount = [filterStatus, filterCategory, filterBU, filterDI, filterRisk].filter(f => f !== ALL).length

  return (
    <div className="p-6 space-y-4">
      {/* Header & Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search measures, owners, workstreams…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${showFilters || activeFilterCount > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border bg-white text-foreground hover:bg-muted'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>
          <span>of {measures.length} measures</span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-4">
            <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={statuses} />
            <FilterSelect label="Category" value={filterCategory} onChange={setFilterCategory} options={categories} />
            <FilterSelect label="Business Unit" value={filterBU} onChange={setFilterBU} options={businessUnits} />
            <FilterSelect label="DI Level" value={filterDI} onChange={setFilterDI} options={diLevels} />
            <FilterSelect label="Risk Level" value={filterRisk} onChange={setFilterRisk} options={riskLevels} />
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setFilterStatus(ALL); setFilterCategory(ALL); setFilterBU(ALL); setFilterDI(ALL); setFilterRisk(ALL) }}
                className="self-end text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 pb-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-slate-50/70">
                {[
                  { key: 'id', label: 'ID', w: 'w-20' },
                  { key: 'title', label: 'Measure', w: 'min-w-[240px]' },
                  { key: 'businessUnit', label: 'Business Unit', w: 'w-36' },
                  { key: 'workstream', label: 'Workstream', w: 'w-36' },
                  { key: 'owner', label: 'Owner', w: 'w-32' },
                  { key: 'diLevel', label: 'DI Level', w: 'w-24' },
                  { key: 'status', label: 'Status', w: 'w-28' },
                  { key: 'category', label: 'Category', w: 'w-24' },
                  { key: 'riskLevel', label: 'Risk', w: 'w-24' },
                  { key: 'targetImpact', label: 'Target', w: 'w-24 text-right' },
                  { key: 'forecastImpact', label: 'Forecast', w: 'w-24 text-right' },
                  { key: 'realizedImpact', label: 'Realized', w: 'w-24 text-right' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key as SortKey)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none whitespace-nowrap hover:text-foreground transition-colors ${col.w}`}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon k={col.key as SortKey} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono font-semibold text-blue-600">{m.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/portfolio/${m.id}`}
                      className="font-medium text-foreground hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {m.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.division}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground">{m.businessUnit}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{m.workstream}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground">{m.owner}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><DIBadge level={m.diLevel} /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><CategoryBadge category={m.category} /></td>
                  <td className="px-4 py-3 whitespace-nowrap"><RiskBadge level={m.riskLevel} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-foreground text-xs">{formatCurrency(m.targetImpact)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                    <span className={m.forecastImpact >= m.targetImpact ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      {formatCurrency(m.forecastImpact)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium text-slate-600">
                    {formatCurrency(m.realizedImpact)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-16 text-center text-sm text-muted-foreground">
                    No measures match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="border-t border-border px-4 py-3 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> measures
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total Target: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, m) => s + m.targetImpact, 0))}</span></span>
            <span>Total Forecast: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, m) => s + m.forecastImpact, 0))}</span></span>
            <span>Total Realized: <span className="font-semibold text-foreground">{formatCurrency(filtered.reduce((s, m) => s + m.realizedImpact, 0))}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-foreground"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
