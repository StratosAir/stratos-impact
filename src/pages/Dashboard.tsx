import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Target, Activity, AlertCircle,
} from 'lucide-react'
import { measures } from '@/data/measures'
import { formatCurrency } from '@/lib/utils'
import { StatusBadge, DIBadge, RiskBadge, ApprovalBadge } from '@/components/StatusBadge'
import type { DILevel } from '@/types'

const DI_LABELS: Record<DILevel, string> = {
  DI0: 'Idea', DI1: 'Identified', DI2: 'Validated',
  DI3: 'Approved', DI4: 'Implemented', DI5: 'Sustainable',
}

export const DI_COLORS: Record<DILevel, string> = {
  DI0: '#E2E8F0',
  DI1: '#CBD5E1',
  DI2: '#94A3B8',
  DI3: '#60A5FA',
  DI4: '#2563EB',
  DI5: '#1e3a5f',
}

const PROGRAMS = [
  'Commercial Excellence',
  'Operational Excellence',
  'Digital Transformation',
  'Structural Program',
] as const

const PROGRAM_SHORT: Record<string, string> = {
  'Commercial Excellence': 'Commercial Exc.',
  'Operational Excellence': 'Ops. Excellence',
  'Digital Transformation': 'Digital Trans.',
  'Structural Program': 'Structural Prog.',
}

interface WaterfallItem {
  name: string
  invisible: number
  value: number
  fill: string
}

type MaturityPoint = {
  name: string
  DI0: number; DI1: number; DI2: number; DI3: number; DI4: number; DI5: number
}

const DI_LEVELS: DILevel[] = ['DI0', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5']

export default function Dashboard() {
  const [maturityView, setMaturityView] = useState<'overall' | 'programs'>('overall')

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
      rejected: measures.filter(m => m.approvals.some(a => a.status === 'Rejected')).length,
    }
  }, [])

  const forecastGap = kpis.forecastImpact - kpis.targetImpact
  const achievementPct = Math.round((kpis.realizedImpact / kpis.targetImpact) * 100)
  const targetImpactM = Math.round(kpis.targetImpact / 1e6 * 10) / 10

  const impactTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month, i) => ({
      month,
      target: measures.reduce((s, m) => s + (m.impactTimeline[i]?.target ?? 0), 0) / 1e6,
      forecast: measures.reduce((s, m) => s + (m.impactTimeline[i]?.forecast ?? 0), 0) / 1e6,
      realized: i < 8
        ? measures.reduce((s, m) => s + (m.impactTimeline[i]?.realized ?? 0), 0) / 1e6
        : undefined,
    }))
  }, [])

  const maturityOverall = useMemo((): MaturityPoint[] => {
    const active = measures.filter(m => m.status !== 'Cancelled')
    const data = { DI0: 0, DI1: 0, DI2: 0, DI3: 0, DI4: 0, DI5: 0 }
    active.forEach(m => { data[m.diLevel] = Math.round((data[m.diLevel] + m.forecastImpact / 1e6) * 10) / 10 })
    return [{ name: 'Project Horizon', ...data }]
  }, [])

  const maturityByProgram = useMemo((): MaturityPoint[] => {
    return PROGRAMS.map(prog => {
      const data = { DI0: 0, DI1: 0, DI2: 0, DI3: 0, DI4: 0, DI5: 0 }
      measures.filter(m => m.program === prog && m.status !== 'Cancelled')
        .forEach(m => { data[m.diLevel] = Math.round((data[m.diLevel] + m.forecastImpact / 1e6) * 10) / 10 })
      return { name: PROGRAM_SHORT[prog] ?? prog, ...data }
    })
  }, [])

  const waterfall = useMemo((): WaterfallItem[] => {
    const active = measures.filter(m => m.status !== 'Cancelled')
    const r = (v: number) => Math.round(v * 10) / 10
    const targetM = r(active.reduce((s, m) => s + m.targetImpact, 0) / 1e6)
    const forecastM = r(active.reduce((s, m) => s + m.forecastImpact, 0) / 1e6)

    const upsideM = r(active
      .filter(m => m.forecastImpact > m.targetImpact)
      .reduce((s, m) => s + (m.forecastImpact - m.targetImpact), 0) / 1e6)

    const riskM = r(active
      .filter(m => (m.riskLevel === 'High' || m.riskLevel === 'Critical') && m.forecastImpact < m.targetImpact)
      .reduce((s, m) => s + (m.targetImpact - m.forecastImpact), 0) / 1e6)

    const delayM = r(active
      .filter(m => m.status === 'At Risk' && m.riskLevel === 'Low' && m.forecastImpact < m.targetImpact)
      .reduce((s, m) => s + (m.targetImpact - m.forecastImpact), 0) / 1e6)

    const allNegM = r(active
      .filter(m => m.forecastImpact < m.targetImpact)
      .reduce((s, m) => s + (m.targetImpact - m.forecastImpact), 0) / 1e6)
    const scopeM = r(Math.max(0, allNegM - riskM - delayM))

    const items: WaterfallItem[] = [
      { name: 'Target', invisible: 0, value: targetM, fill: '#2563EB' },
    ]
    if (upsideM > 0) {
      items.push({ name: '+ Upside', invisible: targetM, value: upsideM, fill: '#10B981' })
    }
    let level = targetM + upsideM
    if (riskM > 0) {
      level = r(level - riskM)
      items.push({ name: '− Risks', invisible: level, value: riskM, fill: '#EF4444' })
    }
    if (delayM > 0) {
      level = r(level - delayM)
      items.push({ name: '− Delays', invisible: level, value: delayM, fill: '#F97316' })
    }
    if (scopeM > 0) {
      level = r(level - scopeM)
      items.push({ name: '− Scope', invisible: level, value: scopeM, fill: '#F59E0B' })
    }
    items.push({ name: 'Forecast', invisible: 0, value: forecastM, fill: '#2563EB' })
    return items
  }, [])

  const impactByProgram = useMemo(() =>
    PROGRAMS.map(prog => ({
      name: PROGRAM_SHORT[prog] ?? prog,
      value: Math.round(
        measures.filter(m => m.program === prog).reduce((s, m) => s + m.forecastImpact, 0) / 1e6 * 10
      ) / 10,
    })).sort((a, b) => b.value - a.value),
    []
  )

  const ftes = useMemo(() => {
    const active = measures.filter(m => m.status !== 'Cancelled')
    return {
      target: active.reduce((s, m) => s + m.fteTarget, 0),
      forecast: active.reduce((s, m) => s + m.fteForecast, 0),
      realized: active.reduce((s, m) => s + m.fteRealized, 0),
    }
  }, [])

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    measures.forEach(m => { counts[m.status] = (counts[m.status] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [])

  const byCategory = useMemo(() => {
    const sums: Record<string, number> = {}
    measures.forEach(m => { sums[m.category] = (sums[m.category] ?? 0) + m.targetImpact })
    return Object.entries(sums).map(([name, value]) => ({ name, value: Math.round(value / 1e6 * 10) / 10 }))
  }, [])

  const byPnL = useMemo(() => {
    const sums: Record<string, number> = {}
    measures.forEach(m => { sums[m.pnlLine] = (sums[m.pnlLine] ?? 0) + m.targetImpact })
    return Object.entries(sums)
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, value]) => ({ name, value: Math.round(value / 1e6 * 10) / 10 }))
  }, [])

  const criticalRisks = useMemo(() =>
    measures
      .flatMap(m => m.risks.map(r => ({ ...r, measureId: m.id, measureTitle: m.title })))
      .filter(r => r.level === 'Critical' || r.level === 'High')
      .slice(0, 6),
    []
  )

  const openApprovals = useMemo(() =>
    measures
      .flatMap(m => m.approvals.filter(a => a.status === 'Pending').map(a => ({ ...a, measureId: m.id, measureTitle: m.title })))
      .slice(0, 6),
    []
  )

  const maturityData = maturityView === 'overall' ? maturityOverall : maturityByProgram

  const statusColors: Record<string, string> = {
    'On Track': '#10B981', Watch: '#F59E0B', 'At Risk': '#EF4444',
    Completed: '#3B82F6', Cancelled: '#94A3B8',
  }
  const categoryColors: Record<string, string> = {
    Revenue: '#2563EB', Cost: '#F97316', Structural: '#8B5CF6',
  }

  return (
    <div className="p-6 space-y-8">

      {/* ── Section 1: Program Health ──────────────────────────────── */}
      <section>
        <SectionHeader title="Program Health" description="Aggregate value performance across Project Horizon" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Target Impact" value={formatCurrency(kpis.targetImpact)}
            sub="Full program ambition" icon={<Target className="w-4 h-4" />} accent="blue" />
          <KpiCard label="Forecast Impact" value={formatCurrency(kpis.forecastImpact)}
            sub={`${forecastGap >= 0 ? '+' : ''}${formatCurrency(forecastGap)} vs target`}
            icon={forecastGap >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            accent={forecastGap >= 0 ? 'green' : 'amber'} />
          <KpiCard label="Realized Impact" value={formatCurrency(kpis.realizedImpact)}
            sub={`${achievementPct}% of target achieved`}
            icon={<CheckCircle2 className="w-4 h-4" />} accent="teal" />
          <KpiCard label="Active Measures" value={String(kpis.activeMeasures)}
            sub="Across 4 programs" icon={<Activity className="w-4 h-4" />} accent="indigo" />
        </div>
      </section>

      {/* ── Section 2: Transformation Governance ──────────────────── */}
      <section>
        <SectionHeader title="Transformation Governance" description="Approval pipeline status and risk exposure" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KpiCard label="DI2 Pending" value={String(kpis.openDI2)}
            sub="Awaiting validation" icon={<Clock className="w-4 h-4" />} accent="amber" />
          <KpiCard label="DI4 Pending" value={String(kpis.openDI4)}
            sub="Awaiting approval" icon={<Clock className="w-4 h-4" />} accent="amber" />
          <KpiCard label="High Risk Measures" value={String(kpis.highRisk)}
            sub="High & critical exposure" icon={<AlertTriangle className="w-4 h-4" />} accent="red" />
          <KpiCard label="Rejected Approvals" value={String(kpis.rejected)}
            sub="Require re-submission" icon={<AlertCircle className="w-4 h-4" />} accent="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Open Approvals</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Pending DI2 &amp; DI4 decisions</p>
              </div>
              <Link to="/portfolio" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {openApprovals.map((a, i) => (
                <Link key={i} to={`/portfolio/${a.measureId}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{a.measureTitle}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.approver}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DIBadge level={a.type as 'DI2' | 'DI4'} size="sm" />
                    <ApprovalBadge status={a.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Critical Risks</h3>
              <p className="text-xs text-muted-foreground mt-0.5">High &amp; critical exposure requiring attention</p>
            </div>
            <div className="divide-y divide-border">
              {criticalRisks.map(r => (
                <Link key={r.id} to={`/portfolio/${r.measureId}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${r.level === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.measureTitle}</p>
                  </div>
                  <RiskBadge level={r.level} className="shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Transformation Maturity ────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <SectionHeader
            title="Transformation Maturity"
            description="Forecast impact distributed across DI maturity levels"
            inline
          />
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button onClick={() => setMaturityView('overall')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                maturityView === 'overall'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>Overall</button>
            <button onClick={() => setMaturityView('programs')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                maturityView === 'programs'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>By Program</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5">
            {DI_LEVELS.map(di => (
              <div key={di} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block shrink-0"
                  style={{ backgroundColor: DI_COLORS[di], border: '1px solid rgba(0,0,0,0.08)' }} />
                <span className="text-xs text-muted-foreground">{di} – {DI_LABELS[di]}</span>
              </div>
            ))}
          </div>

          {maturityView === 'overall' && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center bg-slate-50 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Forecast Impact</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.forecastImpact)}</p>
              </div>
              <div className="text-center bg-slate-50 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Target Impact</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(kpis.targetImpact)}</p>
              </div>
              <div className={`text-center rounded-lg p-3 border ${forecastGap >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Gap to Target</p>
                <p className={`text-lg font-bold ${forecastGap >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {forecastGap >= 0 ? '+' : ''}{formatCurrency(forecastGap)}
                </p>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height={maturityView === 'overall' ? 200 : 260}>
            <BarChart data={maturityData} margin={{ top: 4, right: 80, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `€${v}M`} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(value: unknown, name: string) => {
                  const label = DI_LABELS[name as DILevel]
                  return [`€${Number(value).toFixed(1)}M`, label ? `${name} – ${label}` : name]
                }}
              />
              {maturityView === 'overall' && (
                <ReferenceLine
                  y={targetImpactM}
                  stroke="#64748B"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: `Target €${Math.round(targetImpactM)}M`, position: 'right', fontSize: 10, fill: '#64748B' }}
                />
              )}
              {DI_LEVELS.map(di => (
                <Bar key={di} dataKey={di} stackId="maturity" fill={DI_COLORS[di]}
                  stroke={di === 'DI0' ? '#CBD5E1' : 'none'} strokeWidth={di === 'DI0' ? 0.5 : 0}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Section 4: Value Delivery ──────────────────────────────── */}
      <section>
        <SectionHeader title="Value Delivery" description="From ambition to realistic forecast — and programme delivery trajectory" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Waterfall */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Transformation Waterfall</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Target → forecast bridge (€M)</p>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={waterfall} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `€${v}M`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: unknown, name: string) => {
                    if (name === 'invisible') return ['', '']
                    return [`€${Number(value).toFixed(1)}M`, '']
                  }}
                />
                <Bar dataKey="invisible" stackId="wf" fill="transparent" legendType="none" />
                <Bar dataKey="value" stackId="wf" radius={[3, 3, 0, 0]}>
                  {waterfall.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Impact Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Impact Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly impact in €M — 2024</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Target</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Forecast</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-teal-400/40 inline-block rounded" />Realized</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={impactTrend} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="realized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `€${v}M`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: unknown, name: string) =>
                    value != null ? [`€${Number(value).toFixed(1)}M`, name] : ['', name]
                  }
                />
                <Area type="monotone" dataKey="target" stroke="#3B82F6" strokeWidth={1.5}
                  strokeDasharray="5 3" fill="none" dot={false} name="Target" />
                <Area type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={1.5}
                  fill="none" dot={false} name="Forecast" />
                <Area type="monotone" dataKey="realized" stroke="#14B8A6" strokeWidth={2}
                  fill="url(#realized)" dot={{ r: 3, fill: '#14B8A6' }} name="Realized" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact by Program */}
        <div className="mt-4 bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Impact by Program</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Forecast impact per program (€M) — sorted by contribution</p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={impactByProgram} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `€${v}M`} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false} tickLine={false} width={130} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                formatter={(v: unknown) => [`€${Number(v).toFixed(1)}M`, 'Forecast Impact']} />
              <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]}
                label={{ position: 'right', fontSize: 11, fill: '#64748B',
                  formatter: (v: unknown) => `€${Number(v).toFixed(0)}M` }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── Section 5: Transformation Analytics ───────────────────── */}
      <section>
        <SectionHeader title="Transformation Analytics" description="Portfolio breakdown by category, P&L, status and workforce impact" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* By Category */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">Impact by Category</h3>
            <p className="text-xs text-muted-foreground mb-3">Target impact in €M</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                  paddingAngle={2} dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {byCategory.map(e => <Cell key={e.name} fill={categoryColors[e.name] ?? '#94A3B8'} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: unknown) => [`€${Number(v).toFixed(1)}M`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By P&L */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">Impact by P&amp;L Line</h3>
            <p className="text-xs text-muted-foreground mb-3">Target in €M (top 8)</p>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={byPnL} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `€${v}M`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 8.5, fill: '#94A3B8' }}
                  axisLine={false} tickLine={false} width={95} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: unknown) => [`€${Number(v).toFixed(1)}M`, '']} />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By Status */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">Measures by Status</h3>
            <p className="text-xs text-muted-foreground mb-3">Execution status</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                  paddingAngle={2} dataKey="value">
                  {byStatus.map(e => <Cell key={e.name} fill={statusColors[e.name] ?? '#94A3B8'} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend iconType="circle" iconSize={7}
                  formatter={(v: string) => <span className="text-[10px] text-slate-600">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* FTE Impact */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-1">FTE Impact</h3>
            <p className="text-xs text-muted-foreground mb-4">Program team headcount</p>
            <div className="space-y-2.5">
              <FTEKpiCard label="FTE Target" value={ftes.target} accent="slate" />
              <FTEKpiCard label="FTE Forecast" value={ftes.forecast}
                delta={ftes.forecast - ftes.target}
                accent={ftes.forecast <= ftes.target ? 'green' : 'amber'} />
              <FTEKpiCard label="FTE Realized" value={ftes.realized}
                sub={`${Math.round((ftes.realized / ftes.target) * 100)}% deployed`}
                accent="blue" />
            </div>
            <div className="mt-4 space-y-2">
              <FTEBarSmall label="Target" value={ftes.target}
                max={Math.max(ftes.target, ftes.forecast) * 1.1} color="bg-slate-300" />
              <FTEBarSmall label="Forecast" value={ftes.forecast}
                max={Math.max(ftes.target, ftes.forecast) * 1.1}
                color={ftes.forecast <= ftes.target ? 'bg-emerald-500' : 'bg-amber-500'} />
              <FTEBarSmall label="Realized" value={ftes.realized}
                max={Math.max(ftes.target, ftes.forecast) * 1.1} color="bg-blue-500" />
            </div>
          </div>
        </div>

        {/* Top Measures table */}
        <div className="mt-4 bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Top Measures by Value</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Highest forecast impact across the portfolio</p>
            </div>
            <Link to="/portfolio" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {[...measures].sort((a, b) => b.forecastImpact - a.forecastImpact).slice(0, 6).map((m, i) => (
              <Link key={m.id} to={`/portfolio/${m.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.program} · {m.workstream}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(m.forecastImpact)}</p>
                  <StatusBadge status={m.status} className="mt-0.5 text-[10px] py-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string
  description: string
  inline?: boolean
}

function SectionHeader({ title, description, inline }: SectionHeaderProps) {
  return (
    <div className={inline ? '' : 'mb-4'}>
      <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  )
}

interface KpiCardProps {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: 'blue' | 'green' | 'teal' | 'amber' | 'red' | 'indigo'
}

function KpiCard({ label, value, sub, icon, accent }: KpiCardProps) {
  const a = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-600' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    teal:   { bg: 'bg-teal-50',    text: 'text-teal-600' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-600' },
    red:    { bg: 'bg-red-50',     text: 'text-red-600' },
    indigo: { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  }[accent]

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.bg} ${a.text}`}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

interface FTEKpiCardProps {
  label: string
  value: number
  delta?: number
  sub?: string
  accent: 'slate' | 'green' | 'amber' | 'blue'
}

function FTEKpiCard({ label, value, delta, sub, accent }: FTEKpiCardProps) {
  const textMap = {
    slate: 'text-slate-700', green: 'text-emerald-700',
    amber: 'text-amber-700', blue: 'text-blue-700',
  }
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-right">
        <p className={`text-sm font-bold ${textMap[accent]}`}>{value}</p>
        {delta !== undefined && (
          <p className={`text-[10px] font-medium ${delta > 0 ? 'text-amber-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
            {delta > 0 ? `+${delta}` : delta} vs plan
          </p>
        )}
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

function FTEBarSmall({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-14 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-foreground w-7 text-right">{value}</span>
    </div>
  )
}
