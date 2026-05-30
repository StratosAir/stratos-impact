import { useParams, Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft, User, Building2, Target, TrendingUp, CheckCircle2,
  AlertTriangle, Clock, ChevronRight, Users, Calendar, Tag, Layers,
  TrendingDown,
} from 'lucide-react'
import { getMeasureById } from '@/data/measures'
import { formatCurrency, calcAchievement } from '@/lib/utils'
import { StatusBadge, RiskBadge, DIBadge, ApprovalBadge, CategoryBadge } from '@/components/StatusBadge'
import type { DILevel } from '@/types'

const DI_LEVELS: DILevel[] = ['DI0', 'DI1', 'DI2', 'DI3', 'DI4', 'DI5']
const DI_LABELS: Record<DILevel, string> = {
  DI0: 'Idea', DI1: 'Identified', DI2: 'Validated',
  DI3: 'Approved', DI4: 'Implemented', DI5: 'Sustainable',
}

export default function MeasureDetail() {
  const { id } = useParams<{ id: string }>()
  const measure = id ? getMeasureById(id) : undefined

  if (!measure) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Measure not found.</p>
        <Link to="/portfolio" className="text-blue-600 text-sm mt-2 inline-block">← Back to Portfolio</Link>
      </div>
    )
  }

  const gap = measure.forecastImpact - measure.targetImpact
  const gapPct = measure.targetImpact ? Math.round((gap / measure.targetImpact) * 100) : 0
  const realizationPct = calcAchievement(measure.realizedImpact, measure.targetImpact)
  const currentDIIndex = DI_LEVELS.indexOf(measure.diLevel)

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">

      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Link to="/portfolio" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Portfolio
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{measure.id}</span>
        </div>

        {/* Organization hierarchy path — prominent breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
          <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-700">
            {measure.businessUnit}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-600">
            {measure.division}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-700 font-medium">
            {measure.program}
          </span>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-600">
            {measure.workstream}
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{measure.id}</span>
              <DIBadge level={measure.diLevel} />
              <StatusBadge status={measure.status} />
              <CategoryBadge category={measure.category} />
              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded px-2 py-0.5">{measure.type}</span>
            </div>
            <h1 className="text-xl font-bold text-foreground leading-tight">{measure.title}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{measure.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="text-right bg-white rounded-xl border border-border px-4 py-2.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Last Updated</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{measure.lastUpdated}</p>
            </div>
            <div className="text-right bg-white rounded-xl border border-border px-4 py-2.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Target Date</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{measure.targetDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DI Progress Bar */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Lifecycle Progress</h3>
        <div className="flex items-center">
          {DI_LEVELS.map((di, i) => {
            const isDone = i <= currentDIIndex
            const isCurrent = i === currentDIIndex
            const isLast = i === DI_LEVELS.length - 1
            return (
              <div key={di} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`relative flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 shadow-md shadow-blue-200'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-200 bg-white'
                  }`}>
                    {isDone && !isCurrent ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <span className="text-xs font-bold text-white">{di.replace('DI', '')}</span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-300">{di.replace('DI', '')}</span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1.5 ${isCurrent ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>{di}</p>
                  <p className={`text-[10px] mt-0.5 text-center leading-tight ${isCurrent ? 'text-blue-500' : isDone ? 'text-emerald-500' : 'text-slate-300'}`}>{DI_LABELS[di]}</p>
                </div>
                {!isLast && (
                  <div className={`h-0.5 w-full mx-1 rounded ${i < currentDIIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content — 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Left — Metadata */}
        <div className="lg:col-span-3 space-y-4">

          {/* Organization */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Organization</h3>
            <div className="space-y-0 border border-border rounded-lg overflow-hidden">
              <OrgHierarchyRow icon={<Building2 className="w-3.5 h-3.5" />} label="Business Unit" value={measure.businessUnit} depth={0} />
              <OrgHierarchyRow icon={<Layers className="w-3.5 h-3.5" />} label="Division" value={measure.division} depth={1} />
              <OrgHierarchyRow icon={<Target className="w-3.5 h-3.5" />} label="Program" value={measure.program} depth={2} highlight />
              <OrgHierarchyRow icon={<ChevronRight className="w-3.5 h-3.5" />} label="Workstream" value={measure.workstream} depth={3} />
            </div>
            <div className="mt-3 space-y-2.5 pt-3 border-t border-border">
              <div className="flex items-center gap-2.5">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Measure Owner</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">{measure.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sponsor</p>
                  <p className="text-xs text-foreground mt-0.5">{measure.sponsor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classification — prominent */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Classification</h3>

            {/* Category + Type as large badges */}
            <div className="flex items-center gap-2 mb-3">
              <CategoryBadge category={measure.category} className="text-xs px-2.5 py-1" />
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 font-medium">
                {measure.type}
              </span>
            </div>

            <div className="space-y-2.5">
              <ClassRow label="P&L Line" value={measure.pnlLine} />
              <div className="flex items-start gap-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide w-20 shrink-0 pt-0.5">Risk Level</p>
                <RiskBadge level={measure.riskLevel} />
              </div>
              <div className="flex items-start gap-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide w-20 shrink-0 pt-0.5">Timeline</p>
                <div className="flex items-center gap-1 text-xs text-foreground">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span>{measure.startDate}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-semibold">{measure.targetDate}</span>
                </div>
              </div>
            </div>

            {measure.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {measure.tags.map(t => (
                    <span key={t} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center — Impact & Charts */}
        <div className="lg:col-span-6 space-y-4">

          {/* Impact KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ImpactCard label="Target Impact" value={formatCurrency(measure.targetImpact)} accent="slate" />
            <ImpactCard
              label="Forecast Impact"
              value={formatCurrency(measure.forecastImpact)}
              sub={`${gapPct >= 0 ? '+' : ''}${gapPct}% vs target`}
              accent={gapPct >= 0 ? 'green' : 'amber'}
            />
            <ImpactCard
              label="Realized Impact"
              value={formatCurrency(measure.realizedImpact)}
              sub={`${realizationPct}% achieved`}
              accent="teal"
            />
            <ImpactCard
              label="Forecast Gap"
              value={`${gap >= 0 ? '+' : ''}${formatCurrency(gap)}`}
              sub={gap >= 0 ? 'Above target' : 'Below target'}
              accent={gap >= 0 ? 'green' : 'red'}
              icon={gap >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Forecast Gap — detail card */}
          <div className={`rounded-xl border p-4 ${gap >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Forecast Gap Analysis</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Target</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(measure.targetImpact)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Forecast</p>
                <p className="text-base font-bold text-foreground">{formatCurrency(measure.forecastImpact)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Gap</p>
                <p className={`text-base font-bold ${gap >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {gap >= 0 ? '+' : ''}{formatCurrency(gap)}
                </p>
                <p className={`text-[10px] mt-0.5 font-medium ${gap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {gap >= 0 ? '+' : ''}{gapPct}% vs target
                </p>
              </div>
            </div>
          </div>

          {/* Impact Trend Chart */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Impact Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Monthly impact in €K</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Target</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />Forecast</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-teal-400/40 inline-block rounded" />Realized</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={measure.impactTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
                <defs>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `€${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(value: unknown) => [`€${(Number(value) / 1000).toFixed(0)}K`]}
                />
                <Area type="monotone" dataKey="target" stroke="#93C5FD" strokeWidth={1.5}
                  strokeDasharray="5 3" fill="none" dot={false} name="Target" />
                <Area type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={1.5}
                  fill="none" dot={false} name="Forecast" />
                <Area type="monotone" dataKey="realized" stroke="#14B8A6" strokeWidth={2}
                  fill="url(#realGrad)" dot={{ r: 2.5, fill: '#14B8A6' }} name="Realized" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* FTE Tracking */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">FTE Tracking</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <FTECard label="FTE Target" value={measure.fteTarget} accent="slate" />
              <FTECard
                label="FTE Forecast"
                value={measure.fteForecast}
                delta={measure.fteForecast - measure.fteTarget}
                accent={measure.fteForecast <= measure.fteTarget ? 'green' : 'amber'}
              />
              <FTECard
                label="FTE Realized"
                value={measure.fteRealized}
                sub={`${Math.round((measure.fteRealized / measure.fteTarget) * 100)}% staffed`}
                accent="blue"
              />
            </div>
            <div className="space-y-2">
              <FTEBar label="Target" value={measure.fteTarget}
                max={Math.max(measure.fteTarget, measure.fteForecast) * 1.15} color="bg-slate-300" />
              <FTEBar label="Forecast" value={measure.fteForecast}
                max={Math.max(measure.fteTarget, measure.fteForecast) * 1.15}
                color={measure.fteForecast <= measure.fteTarget ? 'bg-emerald-500' : 'bg-amber-500'} />
              <FTEBar label="Realized" value={measure.fteRealized}
                max={Math.max(measure.fteTarget, measure.fteForecast) * 1.15} color="bg-blue-500" />
            </div>
          </div>
        </div>

        {/* Right — Approvals, Risks, Assumptions */}
        <div className="lg:col-span-3 space-y-4">

          {/* Approvals */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Approvals</h3>
            <div className="space-y-3">
              {measure.approvals.map(a => (
                <div key={a.type} className={`rounded-lg p-3 border ${
                  a.status === 'Approved' ? 'bg-emerald-50 border-emerald-200' :
                  a.status === 'Rejected' ? 'bg-red-50 border-red-200' :
                  'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DIBadge level={a.type} size="sm" />
                      <ApprovalBadge status={a.status} />
                    </div>
                    {a.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {a.status === 'Rejected' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className="text-xs font-medium text-foreground">{a.approver}</p>
                  {a.date && <p className="text-[10px] text-muted-foreground mt-0.5">{a.date}</p>}
                  {a.comments && <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">{a.comments}</p>}
                </div>
              ))}
              {measure.approvals.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No approvals required</p>
              )}
            </div>
          </div>

          {/* Risks */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risks</h3>
              {measure.risks.length > 0 && (
                <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 font-semibold">
                  {measure.risks.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {measure.risks.map(r => (
                <div key={r.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-foreground leading-tight">{r.title}</p>
                    <RiskBadge level={r.level} className="shrink-0" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mb-2">{r.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{r.owner}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      r.mitigationStatus === 'Mitigated' ? 'bg-emerald-50 text-emerald-700' :
                      r.mitigationStatus === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{r.mitigationStatus}</span>
                  </div>
                </div>
              ))}
              {measure.risks.length === 0 && (
                <div className="flex flex-col items-center py-4 gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">No open risks</p>
                </div>
              )}
            </div>
          </div>

          {/* Assumptions */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assumptions</h3>
              {measure.assumptions.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-semibold">
                  {measure.assumptions.length}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {measure.assumptions.map(a => (
                <div key={a.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-semibold text-foreground leading-tight">{a.title}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                      a.status === 'Validated' ? 'bg-emerald-50 text-emerald-700' :
                      a.status === 'Invalidated' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{a.status}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mb-1.5">{a.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{a.validatedBy}</span>
                    {a.validationDate && <span>{a.validationDate}</span>}
                  </div>
                </div>
              ))}
              {measure.assumptions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No assumptions logged</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function OrgHierarchyRow({
  icon, label, value, depth, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; depth: number; highlight?: boolean
}) {
  const indent = depth * 12
  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 border-b border-border last:border-b-0 ${highlight ? 'bg-blue-50' : depth % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
      style={{ paddingLeft: `${12 + indent}px` }}
    >
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-xs mt-0.5 ${highlight ? 'font-semibold text-blue-700' : 'text-foreground'}`}>{value}</p>
      </div>
    </div>
  )
}

function ClassRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide w-20 shrink-0 pt-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  )
}

function ImpactCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string; sub?: string; accent: string; icon?: React.ReactNode
}) {
  const accentMap: Record<string, string> = {
    slate: 'bg-slate-50 border-slate-200',
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    teal: 'bg-teal-50 border-teal-200',
    red: 'bg-red-50 border-red-200',
    blue: 'bg-blue-50 border-blue-200',
  }
  const textMap: Record<string, string> = {
    slate: 'text-slate-700', green: 'text-emerald-700',
    amber: 'text-amber-700', teal: 'text-teal-700',
    red: 'text-red-600', blue: 'text-blue-700',
  }
  return (
    <div className={`rounded-xl border p-3.5 ${accentMap[accent] ?? 'bg-slate-50 border-slate-200'}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold leading-tight ${textMap[accent] ?? 'text-foreground'}`}>{value}</p>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          {icon}{sub}
        </p>
      )}
    </div>
  )
}

function FTECard({
  label, value, delta, sub, accent,
}: {
  label: string; value: number; delta?: number; sub?: string; accent: string
}) {
  const textMap: Record<string, string> = {
    slate: 'text-slate-700', green: 'text-emerald-700',
    amber: 'text-amber-700', blue: 'text-blue-700',
  }
  return (
    <div className="text-center p-3 bg-slate-50 rounded-xl border border-border">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${textMap[accent] ?? 'text-foreground'}`}>{value}</p>
      {delta !== undefined && (
        <p className={`text-[10px] mt-0.5 font-medium ${delta > 0 ? 'text-amber-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
          {delta > 0 ? `+${delta}` : delta} vs plan
        </p>
      )}
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function FTEBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-foreground w-6 text-right">{value}</span>
    </div>
  )
}
