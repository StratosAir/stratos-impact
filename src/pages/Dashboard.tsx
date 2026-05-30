import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ChevronRight } from 'lucide-react'
import { measures } from '@/data/measures'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge, DIBadge, RiskBadge, ApprovalBadge, CategoryBadge } from '@/components/StatusBadge'
import type { DILevel } from '@/types'

const DI_LABELS: Record<DILevel, string> = {
  DI0: 'Idea', DI1: 'Identified', DI2: 'Validated', DI3: 'Approved', DI4: 'Implemented', DI5: 'Sustainable',
}

const COLORS = {
  blue: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
  violet: '#8B5CF6', slate: '#94A3B8', teal: '#14B8A6', indigo: '#6366F1',
}

export default function Dashboard() {
  const kpis = useMemo(() => {
    const active = measures.filter(m => m.status !== 'Cancelled')
    return {
      targetImpact: active.reduce((s, m) => s + m.targetImpact, 0),
      forecastImpact: active.reduce((s, m) => s + m.forecastImpact, 0),
      realizedImpact: active.reduce((s, m) => s + m.realizedImpact, 0),
      activeMeasures: active.length,
      openDI2: measures.filter(m => m.approvals.some(a => a.type === 'DI2' && a.status === 'Pending')).length,
      openDI4: measures.filter(m => m.approvals.some(a => a.type === 'DI4' && a.status === 'Pending')).length,
      highRisk: measures.filter(m => m.riskLevel === 'High' || m.riskLevel === 'Critical').length,
    }
  }, [])

  const impactTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return monthNames.map((month, i) => {
      const t = measures.reduce((s, m) => s + (m.impactTimeline[i]?.target ?? 0), 0)
      const f = measures.reduce((s, m) => s + (m.impactTimeline[i]?.forecast ?? 0), 0)
      const r = measures.reduce((s, m) => s + (m.impactTimeline[i]?.realized ?? 0), 0)
      return { month, target: t / 1e6, forecast: f / 1e6, realized: i < 8 ? r / 1e6 : null }
    })
  }, [])

  const byDI = useMemo(() => {
    const counts: Partial<Record<DILevel, number>> = {}
    measures.forEach(m => { counts[m.diLevel] = (counts[m.diLevel] ?? 0) + 1 })
    return (['DI0','DI1','DI2','DI3','DI4','DI5'] as DILevel[]).map(di => ({
      name: di, label: DI_LABELS[di], count: counts[di] ?? 0,
    }))
  }, [])

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    measures.forEach(m => { counts[m.status] = (counts[m.status] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [])

  const byCategory = useMemo(() => {
    const sums: Record<string, number> = {}
    measures.forEach(m => { sums[m.category] = (sums[m.category] ?? 0) + m.targetImpact })
    return Object.entries(sums).map(([name, value]) => ({ name, value: value / 1e6 }))
  }, [])

  const byPnL = useMemo(() => {
    const sums: Record<string, number> = {}
    measures.forEach(m => { sums[m.pnlLine] = (sums[m.pnlLine] ?? 0) + m.targetImpact })
    return Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value: value / 1e6 }))
  }, [])

  const topMeasures = useMemo(() =>
    [...measures].sort((a, b) => b.targetImpact - a.targetImpact).slice(0, 6),
    []
  )

  const criticalRisks = useMemo(() =>
    measures
      .flatMap(m => m.risks.map(r => ({ ...r, measureId: m.id, measureTitle: m.title })))
      .filter(r => r.level === 'Critical' || r.level === 'High')
      .slice(0, 5),
    []
  )

  const openApprovals = useMemo(() =>
    measures
      .flatMap(m =>
        m.approvals
          .filter(a => a.status === 'Pending')
          .map(a => ({ ...a, measureId: m.id, measureTitle: m.title }))
      )
      .slice(0, 5),
    []
  )

  const forecastGap = kpis.forecastImpact - kpis.targetImpact
  const achievementPct = Math.round((kpis.realizedImpact / kpis.targetImpact) * 100)

  const statusColors: Record<string, string> = {
    'On Track': COLORS.green, 'Watch': COLORS.amber, 'At Risk': COLORS.red,
    'Completed': COLORS.blue, 'Cancelled': COLORS.slate,
  }

  const diColors: Record<string, string> = {
    DI0: COLORS.slate, DI1: COLORS.violet, DI2: COLORS.blue,
    DI3: COLORS.indigo, DI4: COLORS.green, DI5: COLORS.teal,
  }

  const categoryColors: Record<string, string> = {
    Revenue: COLORS.blue, Cost: '#F97316', Structural: COLORS.violet,
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <KpiCard
          label="Target Impact"
          value={formatCurrency(kpis.targetImpact)}
          sub="Full program target"
          icon={<TrendingUp className="w-4 h-4" />}
          accent="blue"
          cols={1}
        />
        <KpiCard
          label="Forecast Impact"
          value={formatCurrency(kpis.forecastImpact)}
          sub={`${forecastGap >= 0 ? '+' : ''}${formatCurrency(forecastGap)} vs target`}
          icon={forecastGap >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          accent={forecastGap >= 0 ? 'green' : 'amber'}
          cols={1}
        />
        <KpiCard
          label="Realized Impact"
          value={formatCurrency(kpis.realizedImpact)}
          sub={`${achievementPct}% of target`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="teal"
          cols={1}
        />
        <KpiCard
          label="Active Measures"
          value={String(kpis.activeMeasures)}
          sub="Across 8 workstreams"
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="indigo"
          cols={1}
        />
        <KpiCard
          label="Open DI2 Approvals"
          value={String(kpis.openDI2)}
          sub="Awaiting validation"
          icon={<Clock className="w-4 h-4" />}
          accent="amber"
          cols={1}
        />
        <KpiCard
          label="Open DI4 Approvals"
          value={String(kpis.openDI4)}
          sub="Awaiting approval"
          icon={<Clock className="w-4 h-4" />}
          accent="amber"
          cols={1}
        />
        <KpiCard
          label="High Risk Measures"
          value={String(kpis.highRisk)}
          sub="Require attention"
          icon={<AlertTriangle className="w-4 h-4" />}
          accent="red"
          cols={1}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Impact Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Impact Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly impact in €M — 2024 YTD</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Target</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Forecast</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-teal-400/40 inline-block rounded" />Realized</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={impactTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="realized" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}M`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                formatter={(value: number, name: string) => [`€${value.toFixed(1)}M`, name]}
              />
              <Area type="monotone" dataKey="target" stroke={COLORS.blue} strokeWidth={1.5} strokeDasharray="5 3" fill="none" dot={false} />
              <Area type="monotone" dataKey="forecast" stroke={COLORS.green} strokeWidth={1.5} fill="none" dot={false} />
              <Area type="monotone" dataKey="realized" stroke={COLORS.teal} strokeWidth={2} fill="url(#realized)" dot={{ r: 3, fill: COLORS.teal }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Measures by DI Level */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Measures by DI Level</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Lifecycle distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDI} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: number, _name: string, props: { payload?: { label?: string } }) => [value, props.payload?.label]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {byDI.map(entry => (
                  <Cell key={entry.name} fill={diColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Status */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Measures by Status</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Current execution status</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {byStatus.map(entry => (
                    <Cell key={entry.name} fill={statusColors[entry.name] ?? COLORS.slate} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Impact by Category</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Target impact in €M</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {byCategory.map(entry => (
                    <Cell key={entry.name} fill={categoryColors[entry.name] ?? COLORS.slate} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: number) => [`€${v.toFixed(1)}M`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By P&L */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Impact by P&L Line</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Target in €M (top 8)</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byPnL} margin={{ top: 0, right: 4, bottom: 0, left: -20 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}M`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v: number) => [`€${v.toFixed(1)}M`, '']} />
              <Bar dataKey="value" fill={COLORS.indigo} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Measures */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Top Measures by Value</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Highest target impact</p>
            </div>
            <Link to="/portfolio" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {topMeasures.map((m, i) => (
              <Link
                key={m.id}
                to={`/portfolio/${m.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.businessUnit} · {m.division}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(m.targetImpact)}</p>
                  <StatusBadge status={m.status} className="mt-0.5 text-[10px] py-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Critical Risks */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Critical Risks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">High & critical open risks</p>
          </div>
          <div className="divide-y divide-border">
            {criticalRisks.map(r => (
              <Link
                key={r.id}
                to={`/portfolio/${r.measureId}`}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${r.level === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.measureTitle}</p>
                </div>
                <RiskBadge level={r.level} className="shrink-0" />
              </Link>
            ))}
            {criticalRisks.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No critical risks</p>
            )}
          </div>
        </div>

        {/* Open Approvals */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Open Approvals</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pending DI2 & DI4 decisions</p>
          </div>
          <div className="divide-y divide-border">
            {openApprovals.map((a, i) => (
              <Link
                key={i}
                to={`/portfolio/${a.measureId}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.measureTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.approver}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DIBadge level={a.type as 'DI2' | 'DI4'} size="sm" />
                  <ApprovalBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: 'blue' | 'green' | 'teal' | 'amber' | 'red' | 'indigo'
  cols?: number
}

function KpiCard({ label, value, sub, icon, accent }: KpiCardProps) {
  const accentMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  }
  const a = accentMap[accent]

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.bg} ${a.text}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          {sub}
        </p>
      </div>
    </div>
  )
}
