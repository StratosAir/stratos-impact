import { useState, useMemo, useEffect } from 'react'
import type { ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb, Search, TrendingUp, Tag, MessageSquare, Eye, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Sparkles, Building2, Target,
  Plus, AlertTriangle, Link2, Zap, BarChart3, Calendar,
  GitBranch, Shield, ExternalLink,
} from 'lucide-react'
import { measures as baseMeasures } from '@/data/measures'
import { formatCurrency } from '@/lib/utils'
import { DIBadge, StatusBadge, CategoryBadge } from '@/components/StatusBadge'
import type { Measure, MeasureCategory, MeasureType, PnLLine } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classification {
  category: MeasureCategory | ''
  type: MeasureType | ''
  businessUnit: string
  division: string
  program: string
  workstream: string
  pnlLine: string
  expectedImpact: string
  owner: string
  startDate: string
  dependencies: string
  primaryRisks: string
}

interface SimilarMeasure {
  measure: Measure
  similarity: number
  matchReason: string
}

interface Suggestion<T extends string = string> {
  value: T
  confidence: number
}

interface ClassificationSuggestions {
  category: Suggestion<MeasureCategory>
  type: Suggestion<MeasureType>
  businessUnit: Suggestion
  division: Suggestion
  program: Suggestion
  workstream: Suggestion
  pnlLine: Suggestion
  owner: Suggestion
}

interface OpportunityScore {
  impactScore: number
  complexScore: number
  speedScore: number
  strategicScore: number
  overall: number
}

interface Synergy {
  title: string
  type: 'program' | 'initiative'
  reason: string
}

interface RefinementQuestion {
  id: keyof Classification
  label: string
  question: string
  subtext: string
  type: 'number' | 'text' | 'select'
  placeholder?: string
  options?: string[]
  optional: boolean
  icon: ComponentType<{ className?: string }>
}

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Idea',           icon: Lightbulb     },
  { id: 2, label: 'Analysis',       icon: Search        },
  { id: 3, label: 'Opportunity',    icon: TrendingUp    },
  { id: 4, label: 'Classification', icon: Tag           },
  { id: 5, label: 'Refinement',     icon: MessageSquare },
  { id: 6, label: 'Preview',        icon: Eye           },
]

const ANALYZING_MESSAGES = [
  'Scanning 47 active measures...',
  'Identifying similar initiatives...',
  'Assessing duplicate risk...',
  'Mapping synergy opportunities...',
]

// ── Org data ──────────────────────────────────────────────────────────────────

const BUSINESS_UNITS = [...new Set(baseMeasures.map(m => m.businessUnit))].sort()
const PROGRAMS       = [...new Set(baseMeasures.map(m => m.program))].sort()
const WORKSTREAMS    = [...new Set(baseMeasures.map(m => m.workstream))].sort()
const PNL_LINES: PnLLine[] = [
  'Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue',
  'Personnel Cost', 'Fuel Cost', 'Maintenance Cost', 'Airport Charges',
  'Distribution Cost', 'IT Cost', 'External Services', 'Other Operating Cost',
]

const DIVISIONS_BY_BU: Record<string, string[]> = {}
baseMeasures.forEach(m => {
  if (!DIVISIONS_BY_BU[m.businessUnit]) DIVISIONS_BY_BU[m.businessUnit] = []
  if (!DIVISIONS_BY_BU[m.businessUnit].includes(m.division))
    DIVISIONS_BY_BU[m.businessUnit].push(m.division)
})
Object.values(DIVISIONS_BY_BU).forEach(a => a.sort())

// ── Similarity logic ──────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'with', 'from', 'into', 'that', 'this', 'will', 'have', 'more', 'than',
  'reduce', 'increase', 'improve', 'implement', 'develop', 'achieve', 'create',
  'using', 'through', 'across', 'their', 'those', 'these', 'been', 'also', 'make',
])

const DOMAIN_PAIRS: [string, number][] = [
  ['fuel',         14], ['maintenance', 12], ['pricing',  12], ['revenue',  10],
  ['digital',      10], ['cargo',       12], ['loyalty',  12], ['ground',   12],
  ['fleet',        12], ['workforce',   10], ['procurement', 10], ['ancillary', 12],
  ['channel',       8], ['distribution', 8], ['customer',  8], ['charter',  10],
]

function computeSimilarMeasures(idea: string): SimilarMeasure[] {
  const ideaLower = idea.toLowerCase()
  const ideaWords = ideaLower
    .split(/[\s,.'"-]+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w))

  return baseMeasures
    .map(m => {
      const mText = [m.title, m.description, m.category, m.workstream, m.pnlLine, m.businessUnit]
        .join(' ').toLowerCase()

      const matched: string[] = []
      for (const w of ideaWords) {
        if (mText.includes(w) && !matched.includes(w)) matched.push(w)
      }

      const wordScore = ideaWords.length > 0
        ? (matched.length / ideaWords.length) * 65
        : 0

      let domainBonus = 0
      for (const [kw, pts] of DOMAIN_PAIRS) {
        if (ideaLower.includes(kw) && mText.includes(kw)) domainBonus += pts
      }

      const idHash    = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const jitter    = (idHash % 11) - 5
      const similarity = Math.max(8, Math.min(94,
        Math.round(wordScore + Math.min(domainBonus, 25) + jitter)
      ))

      const matchReason = matched.length > 0
        ? `Keywords: ${matched.slice(0, 3).join(', ')}`
        : 'Category & domain alignment'

      return { measure: m, similarity, matchReason }
    })
    .filter(r => r.similarity >= 18)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)
}

// ── Category suggestion ───────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: [string, MeasureCategory, number][] = [
  ['fuel',         'Cost',       15], ['maintenance',  'Cost',       14],
  ['personnel',    'Cost',       12], ['headcount',    'Cost',       12],
  ['procurement',  'Cost',       10], ['overhead',     'Cost',        9],
  ['cost',         'Cost',        8], ['saving',       'Cost',        8],
  ['revenue',      'Revenue',    15], ['pricing',      'Revenue',    14],
  ['ancillary',    'Revenue',    14], ['loyalty',      'Revenue',    12],
  ['cargo',        'Revenue',    12], ['yield',        'Revenue',    10],
  ['sales',        'Revenue',    10], ['passenger',    'Revenue',     8],
  ['digital',      'Structural', 12], ['platform',     'Structural', 12],
  ['process',      'Structural', 10], ['organization', 'Structural', 10],
  ['system',       'Structural',  8], ['restructur',   'Structural', 10],
]

function suggestCategory(idea: string): { value: MeasureCategory; confidence: number } {
  const lower  = idea.toLowerCase()
  const scores: Record<MeasureCategory, number> = { Revenue: 0, Cost: 0, Structural: 0 }
  for (const [kw, cat, pts] of CATEGORY_KEYWORDS) {
    if (lower.includes(kw)) scores[cat] += pts
  }
  const sorted = (Object.entries(scores) as [MeasureCategory, number][]).sort(([, a], [, b]) => b - a)
  const winner = sorted[0]
  const total  = sorted.reduce((sum, [, v]) => sum + v, 0)
  const confidence = total > 0 ? Math.round(65 + (winner[1] / total) * 30) : 68
  return { value: winner[1] > 0 ? winner[0] : 'Structural', confidence: Math.min(confidence, 95) }
}

// ── PnL suggestion ────────────────────────────────────────────────────────────

const PNL_KEYWORDS: [string, PnLLine][] = [
  ['fuel',         'Fuel Cost'],
  ['maintenance',  'Maintenance Cost'],
  ['personnel',    'Personnel Cost'],
  ['headcount',    'Personnel Cost'],
  ['staff',        'Personnel Cost'],
  ['cargo',        'Cargo Revenue'],
  ['ancillary',    'Ancillary Revenue'],
  ['passenger',    'Passenger Revenue'],
  ['airport',      'Airport Charges'],
  ['distribution', 'Distribution Cost'],
  ['channel',      'Distribution Cost'],
  ['digital',      'IT Cost'],
  ['software',     'IT Cost'],
  ['external',     'External Services'],
  ['vendor',       'External Services'],
  ['procurement',  'External Services'],
]

function suggestPnL(idea: string, category: MeasureCategory): { value: PnLLine; confidence: number } {
  const lower = idea.toLowerCase()
  for (const [kw, line] of PNL_KEYWORDS) {
    if (lower.includes(kw)) return { value: line, confidence: 78 }
  }
  const defaults: Record<MeasureCategory, PnLLine> = {
    Revenue: 'Passenger Revenue',
    Cost: 'Other Operating Cost',
    Structural: 'Other Operating Cost',
  }
  return { value: defaults[category], confidence: 61 }
}

// ── Classification suggestions ────────────────────────────────────────────────

function computeClassificationSuggestions(idea: string, similar: SimilarMeasure[]): ClassificationSuggestions {
  const lower = idea.toLowerCase()
  const top   = similar[0]?.measure
  const hash  = idea.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const v     = (base: number, range: number) =>
    Math.round(Math.min(95, Math.max(50, base + (hash % range) - Math.floor(range / 2))))

  const catResult = suggestCategory(idea)
  const pnlResult = suggestPnL(idea, catResult.value)

  const oneOffKw = ['one-time', 'one time', 'restructur', 'merger', 'acquisition', 'migration', 'transition']
  const isOneOff = oneOffKw.some(k => lower.includes(k))

  const simBonus  = similar[0]?.similarity ?? 0
  const buConf    = Math.min(92, 68 + simBonus / 4)
  const divConf   = Math.min(88, 63 + simBonus / 5)
  const pgmConf   = Math.min(90, 65 + simBonus / 4)
  const wsConf    = Math.min(88, 63 + simBonus / 5)
  const ownConf   = Math.min(85, 60 + simBonus / 4)

  return {
    category:     { value: catResult.value,                                confidence: v(catResult.confidence, 8) },
    type:         { value: isOneOff ? 'One-Off' : 'Sustainable',           confidence: v(74, 10)                  },
    businessUnit: { value: top?.businessUnit ?? 'Operations',              confidence: v(buConf, 6)               },
    division:     { value: top?.division     ?? 'Operations',              confidence: v(divConf, 8)              },
    program:      { value: top?.program      ?? 'Operational Excellence',  confidence: v(pgmConf, 6)              },
    workstream:   { value: top?.workstream   ?? 'Cost Optimization',       confidence: v(wsConf, 8)               },
    pnlLine:      { value: pnlResult.value,                                confidence: v(pnlResult.confidence, 8) },
    owner:        { value: top?.owner        ?? 'TBD',                     confidence: v(ownConf, 10)             },
  }
}

// ── Opportunity scoring ───────────────────────────────────────────────────────

function computeOpportunityScore(idea: string): OpportunityScore {
  const lower = idea.toLowerCase()
  const hash  = idea.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const j     = (hash % 14) - 7

  const match = (kws: string[]) => kws.filter(k => lower.includes(k)).length

  const impactKw    = ['fuel', 'revenue', 'cost', 'million', 'significant', 'major', 'efficiency', 'optimize', 'reduce', 'fleet', 'network']
  const complexKw   = ['system', 'platform', 'digital', 'restructur', 'reorganiz', 'technology', 'integration', 'enterprise', 'transformation', 'across']
  const speedKw     = ['quick', 'fast', 'immediate', 'simple', 'process', 'procedure', 'policy', 'negotiat', 'contract']
  const strategicKw = ['fuel', 'fleet', 'network', 'digital', 'revenue', 'customer', 'cargo', 'workforce', 'operational', 'strategic', 'sustainability']

  const impactScore    = Math.round(Math.min(95, Math.max(30, 45 + match(impactKw)    * 6 + j)))
  const complexScore   = Math.round(Math.min(90, Math.max(20, 30 + match(complexKw)   * 9 + Math.round(j / 2))))
  const speedScore     = Math.round(Math.min(90, Math.max(20, 80 - complexScore / 2   + match(speedKw) * 5 - Math.round(j / 2))))
  const strategicScore = Math.round(Math.min(95, Math.max(30, 50 + match(strategicKw) * 6 + j)))

  const overall = Math.min(97, Math.max(38, Math.round(
    impactScore    * 0.35 +
    strategicScore * 0.30 +
    speedScore     * 0.20 +
    (100 - complexScore) * 0.15
  )))

  return { impactScore, complexScore, speedScore, strategicScore, overall }
}

// ── Synergy computation ───────────────────────────────────────────────────────

function computeSynergies(similar: SimilarMeasure[]): Synergy[] {
  const seen: Set<string> = new Set()
  const syns: Synergy[]  = []

  for (const { measure: m } of similar.slice(0, 4)) {
    if (!seen.has(m.program)) {
      seen.add(m.program)
      syns.push({ title: m.program, type: 'program', reason: `Shared workstream: ${m.workstream}` })
    }
    if (syns.length >= 2 && !seen.has(m.title)) {
      seen.add(m.title)
      syns.push({ title: m.title, type: 'initiative', reason: `${m.businessUnit} · ${m.division}` })
    }
    if (syns.length >= 4) break
  }

  return syns.slice(0, 3)
}

// ── Title / description generation ───────────────────────────────────────────

function generateTitle(idea: string): string {
  const cleaned = idea.trim().replace(/[.!?]+$/, '').trim()
  const titled  = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return titled.length > 72 ? titled.substring(0, 69) + '…' : titled
}

function generateDescription(idea: string, cls: Classification): string {
  const impactNum = parseFloat(cls.expectedImpact || '0') || 0
  const impact    = impactNum > 0
    ? `with an expected annual impact of ${formatCurrency(impactNum * 1_000_000)}`
    : 'with impact to be quantified during DI1 validation'
  const bu   = cls.businessUnit || 'the assigned business unit'
  const ws   = cls.workstream   || 'the designated workstream'
  const base = idea.trim().replace(/[.!?]+$/, '').trim()
  return `${base}. This measure is led by ${bu} and tracked within ${ws}, ${impact}. A detailed business case and financial model will be developed during the DI1–DI2 validation phase.`
}

// ── Refinement questions ──────────────────────────────────────────────────────

const REFINEMENT_QUESTIONS: RefinementQuestion[] = [
  {
    id: 'expectedImpact',
    label: 'Expected Impact',
    question: 'What quantifiable financial impact do you expect?',
    subtext: 'Estimate the annual impact in €M p.a. This will be refined during DI1 validation.',
    type: 'number',
    placeholder: '0.0',
    optional: false,
    icon: BarChart3,
  },
  {
    id: 'startDate',
    label: 'Implementation Timeline',
    question: 'When could implementation realistically begin?',
    subtext: 'Provide a quarter or approximate timeframe for initial implementation.',
    type: 'select',
    options: ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'H1 2027 or later'],
    optional: false,
    icon: Calendar,
  },
  {
    id: 'dependencies',
    label: 'Dependencies',
    question: 'Are there major dependencies on other initiatives or systems?',
    subtext: 'List key dependencies that could affect the implementation timeline or feasibility.',
    type: 'text',
    placeholder: 'e.g. Fleet renewal program, new flight planning system, IT platform upgrade',
    optional: true,
    icon: GitBranch,
  },
  {
    id: 'primaryRisks',
    label: 'Primary Risks',
    question: 'What are the primary implementation risks?',
    subtext: 'Consider regulatory requirements, labor agreements, technology readiness, or organizational change.',
    type: 'text',
    placeholder: 'e.g. Requires ATC coordination and union alignment on new taxi procedures',
    optional: true,
    icon: Shield,
  },
]

// ── Empty state ───────────────────────────────────────────────────────────────

const EMPTY_CLASSIFICATION: Classification = {
  category: '', type: '', businessUnit: '', division: '',
  program: '', workstream: '', pnlLine: '', expectedImpact: '',
  owner: '', startDate: '', dependencies: '', primaryRisks: '',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IdeationAssistant() {
  const navigate = useNavigate()

  const [step, setStep]                 = useState(1)
  const [idea, setIdea]                 = useState('')
  const [isAnalyzing, setIsAnalyzing]   = useState(false)
  const [analyzingPhase, setAnalyzingPhase] = useState(0)
  const [cls, setCls]                   = useState<Classification>(EMPTY_CLASSIFICATION)
  const [created, setCreated]           = useState<Measure | null>(null)
  const [sessionMeasures, setSessionMeasures] = useState<Measure[]>([])

  const similar          = useMemo(() => idea.trim().length > 10 ? computeSimilarMeasures(idea) : [], [idea])
  const opportunityScore = useMemo(() => computeOpportunityScore(idea), [idea])
  const suggestions      = useMemo(() => computeClassificationSuggestions(idea, similar), [idea, similar])
  const synergies        = useMemo(() => computeSynergies(similar), [similar])
  const duplicateRisk    = useMemo<'Low' | 'Medium' | 'High'>(() => {
    const max = similar[0]?.similarity ?? 0
    return max >= 70 ? 'High' : max >= 45 ? 'Medium' : 'Low'
  }, [similar])

  useEffect(() => {
    if (!isAnalyzing) return
    let i = 0
    const interval = setInterval(() => {
      i += 1
      if (i < ANALYZING_MESSAGES.length) setAnalyzingPhase(i)
    }, 450)
    const timeout = setTimeout(() => {
      setIsAnalyzing(false)
      clearInterval(interval)
    }, 2000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [isAnalyzing])

  const handleSubmitIdea = () => {
    setStep(2)
    setIsAnalyzing(true)
    setAnalyzingPhase(0)
  }

  const goNext = () => {
    if (step === 3) {
      setCls(c => ({
        ...c,
        category:     (c.category     || suggestions.category.value)    as MeasureCategory,
        type:         (c.type         || suggestions.type.value)        as MeasureType,
        businessUnit:  c.businessUnit  || suggestions.businessUnit.value,
        division:      c.division      || suggestions.division.value,
        program:       c.program       || suggestions.program.value,
        workstream:    c.workstream    || suggestions.workstream.value,
        pnlLine:       c.pnlLine       || suggestions.pnlLine.value,
        owner:         c.owner         || suggestions.owner.value,
      }))
    }
    setStep(s => s + 1)
  }

  const goBack = () => setStep(s => s - 1)

  const handleCreate = () => {
    const idx    = baseMeasures.length + sessionMeasures.length + 1
    const today  = new Date().toISOString().split('T')[0]
    const target = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const impact = Math.round((parseFloat(cls.expectedImpact || '0') || 0) * 1_000_000)

    const newMeasure: Measure = {
      id:             `DI-${String(idx).padStart(3, '0')}`,
      title:          generateTitle(idea),
      description:    generateDescription(idea, cls),
      businessUnit:   cls.businessUnit  || 'TBD',
      division:       cls.division      || 'TBD',
      program:        cls.program       || 'Project Horizon',
      workstream:     cls.workstream    || 'TBD',
      owner:          cls.owner         || 'TBD',
      sponsor:        'TBD',
      diLevel:        'DI0',
      status:         'Watch',
      category:       (cls.category || 'Structural') as MeasureCategory,
      type:           (cls.type     || 'Sustainable') as MeasureType,
      pnlLine:        (cls.pnlLine  || 'Other Operating Cost') as PnLLine,
      riskLevel:      'Medium',
      targetImpact:   impact,
      forecastImpact: Math.round(impact * 0.85),
      realizedImpact: 0,
      fteTarget:      0, fteForecast: 0, fteRealized: 0,
      approvals: [], risks: [], assumptions: [],
      impactTimeline: Array.from({ length: 12 }, (_, i) => ({
        month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
        target: 0, forecast: 0, realized: 0,
      })),
      startDate:   today,
      targetDate:  target,
      lastUpdated: today,
      tags:        [],
    }

    setSessionMeasures(m => [...m, newMeasure])
    setCreated(newMeasure)
    setStep(7)
  }

  const handleReset = () => {
    setStep(1); setIdea(''); setCls(EMPTY_CLASSIFICATION); setCreated(null)
  }

  return (
    <div className="min-h-full bg-slate-50/60">
      {/* Page header */}
      <div className="bg-white border-b border-border px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1e3a5f] flex items-center justify-center shadow-sm">
              <Lightbulb className="w-4 h-4 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">Transformation Intake</h1>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 uppercase tracking-wide">Beta</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Portfolio intelligence · Opportunity assessment · DI0 measure creation</p>
            </div>
          </div>
          {sessionMeasures.length > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created this session</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{sessionMeasures.length} measure{sessionMeasures.length > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {step < 7 && (
        <div className="bg-white border-b border-border px-8 py-4">
          <div className="max-w-5xl mx-auto">
            <StepIndicator current={step} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {step === 1 && <StepIdea idea={idea} setIdea={setIdea} onSubmit={handleSubmitIdea} />}
        {step === 2 && (
          <StepAnalysis
            isAnalyzing={isAnalyzing}
            analyzingPhase={analyzingPhase}
            similar={similar}
            duplicateRisk={duplicateRisk}
            synergies={synergies}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && <StepOpportunity score={opportunityScore} onNext={goNext} onBack={goBack} />}
        {step === 4 && (
          <StepClassification cls={cls} setCls={setCls} suggestions={suggestions} onNext={goNext} onBack={goBack} />
        )}
        {step === 5 && <StepRefinement cls={cls} setCls={setCls} onNext={goNext} onBack={goBack} />}
        {step === 6 && <StepPreview idea={idea} cls={cls} score={opportunityScore} onCreate={handleCreate} onBack={goBack} />}
        {step === 7 && created && (
          <StepCreated measure={created} onCreateAnother={handleReset} onViewPortfolio={() => navigate('/portfolio')} />
        )}
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done   = s.id < current
        const active = s.id === current
        const Icon   = s.icon
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                active ? 'border-[#1e3a5f] bg-[#1e3a5f] shadow-md' :
                done   ? 'border-emerald-500 bg-emerald-500' :
                         'border-slate-200 bg-white'
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                }
              </div>
              <p className={`text-[10px] font-semibold mt-1.5 hidden sm:block truncate max-w-[72px] text-center ${
                active ? 'text-[#1e3a5f]' : done ? 'text-emerald-600' : 'text-slate-400'
              }`}>{s.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 sm:mb-5 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Idea Input ───────────────────────────────────────────────────────

function StepIdea({ idea, setIdea, onSubmit }: {
  idea: string; setIdea: (v: string) => void; onSubmit: () => void
}) {
  const canContinue = idea.trim().length >= 20

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#1e3a5f] flex items-center justify-center mx-auto shadow-lg">
          <Sparkles className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">What transformation opportunity would you like to explore?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
            Describe your idea in plain language. The system will analyze the existing portfolio, assess the opportunity, and guide you through intake.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 pb-4">
          <textarea
            autoFocus
            value={idea}
            onChange={e => setIdea(e.target.value)}
            rows={6}
            placeholder="e.g. Reduce fuel consumption through optimized taxi procedures at hub airports to decrease ground fuel burn and lower operating costs."
            className="w-full text-base text-foreground placeholder:text-slate-300 bg-transparent border-none focus:outline-none resize-none leading-relaxed"
          />
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-border flex items-center justify-between">
          <p className={`text-xs ${idea.length > 0 && !canContinue ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {idea.length > 0 && !canContinue
              ? 'Add a bit more detail to continue.'
              : idea.length > 0 ? `${idea.length} characters` : 'No minimum format required.'
            }
          </p>
          <button
            onClick={onSubmit}
            disabled={!canContinue}
            className="flex items-center gap-2 px-5 py-2 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" /> Analyze Idea
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Try an example</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: 'Cost Reduction',  text: 'Reduce fuel consumption through optimized taxi procedures at hub airports' },
            { label: 'Revenue Growth',  text: 'Dynamic pricing for premium cabin upgrades based on real-time demand signals' },
            { label: 'Structural',      text: 'Consolidate IT vendor contracts across all divisions to reduce overhead' },
          ].map(ex => (
            <button key={ex.label} onClick={() => setIdea(ex.text)}
              className="text-left p-4 bg-white border border-border rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 group-hover:text-blue-500">{ex.label}</p>
              <p className="text-xs text-foreground leading-relaxed">"{ex.text}"</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 2 — Portfolio Analysis ───────────────────────────────────────────────

function StepAnalysis({
  isAnalyzing, analyzingPhase, similar, duplicateRisk, synergies, onNext, onBack,
}: {
  isAnalyzing: boolean
  analyzingPhase: number
  similar: SimilarMeasure[]
  duplicateRisk: 'Low' | 'Medium' | 'High'
  synergies: Synergy[]
  onNext: () => void
  onBack: () => void
}) {
  if (isAnalyzing) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1e3a5f] rounded-2xl p-12 text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Analyzing Portfolio</h2>
            <p className="text-blue-200 text-sm">Running portfolio intelligence against your idea</p>
          </div>
          <div className="space-y-3 max-w-xs mx-auto text-left">
            {ANALYZING_MESSAGES.map((msg, i) => (
              <div key={msg} className={`flex items-center gap-3 transition-all duration-300 ${i <= analyzingPhase ? 'opacity-100' : 'opacity-25'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  i < analyzingPhase  ? 'bg-emerald-400' :
                  i === analyzingPhase ? 'bg-white/20 border border-white/50' :
                  'bg-white/10'
                }`}>
                  {i < analyzingPhase && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {i === analyzingPhase && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>
                <p className={`text-sm ${i <= analyzingPhase ? 'text-white' : 'text-white/40'}`}>{msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const riskStyle = {
    Low:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    Medium: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100 text-amber-800 border-amber-200'       },
    High:   { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100 text-red-800 border-red-200'             },
  }[duplicateRisk]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1e3a5f] rounded-2xl px-8 py-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Portfolio Intelligence</p>
          </div>
          <h2 className="text-xl font-bold text-white">Analysis Complete</h2>
          <p className="text-blue-200 text-sm mt-1">
            {similar.length} related measure{similar.length !== 1 ? 's' : ''} found · {synergies.length} synerg{synergies.length !== 1 ? 'ies' : 'y'} identified · Duplicate risk: {duplicateRisk}
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-xl bg-white/10">
          <Search className="w-7 h-7 text-white/80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Similar Measures */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Existing Measures</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Potentially overlapping initiatives in the portfolio</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-0.5">{similar.length} found</span>
          </div>
          {similar.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-foreground">No close matches found</p>
              <p className="text-xs text-muted-foreground mt-1">This appears to be a novel initiative.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {similar.map(({ measure: m, similarity, matchReason }) => {
                const simStyle = similarity >= 70
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : similarity >= 45
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                return (
                  <div key={m.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${simStyle}`}>
                            {similarity}% match
                          </span>
                          <DIBadge level={m.diLevel} size="sm" />
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{m.title}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{m.businessUnit}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-muted-foreground">{m.owner}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-muted-foreground">{matchReason}</span>
                        </div>
                      </div>
                      <a
                        href={`/portfolio/${m.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 mt-0.5 whitespace-nowrap"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Duplicate Risk */}
          <div className={`rounded-xl border ${riskStyle.border} ${riskStyle.bg} p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-4 h-4 ${riskStyle.text}`} />
              <h3 className="text-sm font-bold text-foreground">Duplicate Risk</h3>
            </div>
            <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full border mb-2.5 ${riskStyle.badge}`}>
              {duplicateRisk}
            </span>
            <p className={`text-xs leading-relaxed ${riskStyle.text}`}>
              {duplicateRisk === 'High'
                ? 'This idea closely overlaps with existing measures. Consider extending those initiatives rather than creating a new one.'
                : duplicateRisk === 'Medium'
                ? 'Partial overlap detected. Ensure your initiative is clearly differentiated before proceeding.'
                : 'No significant duplication detected. This appears to be a distinct initiative.'}
            </p>
          </div>

          {/* Synergy */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">Synergy Opportunities</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Programs this idea could strengthen</p>
            </div>
            {synergies.length === 0 ? (
              <p className="text-xs text-muted-foreground p-5">No direct synergies identified at this stage.</p>
            ) : (
              <div className="divide-y divide-border">
                {synergies.map((s, i) => (
                  <div key={i} className="px-5 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${s.type === 'program' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {s.type === 'program'
                          ? <Target className="w-3 h-3 text-blue-600" />
                          : <Zap className="w-3 h-3 text-purple-600" />
                        }
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-snug">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 bg-slate-50 border-t border-border">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This idea may strengthen existing programs and could be implemented jointly to maximize synergies.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm">
          Assess Opportunity <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Opportunity Assessment ──────────────────────────────────────────

type Level = 'Low' | 'Medium' | 'High'

function scoreToLevel(score: number): Level {
  return score >= 68 ? 'High' : score >= 42 ? 'Medium' : 'Low'
}

function complexToLevel(score: number): Level {
  return score <= 38 ? 'High' : score <= 62 ? 'Medium' : 'Low'
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circ   = 2 * Math.PI * radius
  const dash   = (score / 100) * circ
  const color  = score >= 75 ? '#059669' : score >= 55 ? '#d97706' : '#dc2626'
  const label  = score >= 75 ? 'Strong' : score >= 55 ? 'Moderate' : 'Developing'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-foreground leading-none">{score}</span>
          <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label} Opportunity</span>
    </div>
  )
}

function DimensionRow({ label, score, level, inverted }: { label: string; score: number; level: Level; inverted?: boolean }) {
  const c: Record<Level, { bar: string; badge: string }> = {
    High:   { bar: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    Medium: { bar: 'bg-amber-500',   badge: 'text-amber-700 bg-amber-50 border-amber-200'       },
    Low:    { bar: 'bg-slate-400',   badge: 'text-slate-600 bg-slate-100 border-slate-200'       },
  }
  const cls = c[level]
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cls.badge}`}>{level}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cls.bar}`}
          style={{ width: `${inverted ? 100 - score : score}%` }} />
      </div>
    </div>
  )
}

function StepOpportunity({ score, onNext, onBack }: { score: OpportunityScore; onNext: () => void; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Transformation Opportunity Assessment</h2>
        <p className="text-sm text-muted-foreground">Preliminary assessment based on portfolio intelligence and keyword analysis.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-[#1e3a5f] px-8 py-8 flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={score.overall} />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide mb-2">Overall Opportunity Score</p>
            <p className="text-4xl font-extrabold text-white">
              {score.overall} <span className="text-base font-normal text-blue-200">/ 100</span>
            </p>
            <p className="text-blue-200 text-sm mt-3 leading-relaxed max-w-xs">
              Based on strategic fit, implementation feasibility, and portfolio analysis.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <DimensionRow label="Impact Potential"         score={score.impactScore}    level={scoreToLevel(score.impactScore)} />
          <DimensionRow label="Strategic Relevance"      score={score.strategicScore} level={scoreToLevel(score.strategicScore)} />
          <DimensionRow label="Implementation Speed"     score={score.speedScore}     level={scoreToLevel(score.speedScore)} />
          <DimensionRow label="Implementation Complexity" score={score.complexScore}  level={complexToLevel(score.complexScore)} inverted />
        </div>

        <div className="px-6 pb-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Note:</span>{' '}
              This assessment is based on keyword analysis and portfolio intelligence. The score will be refined as you complete the classification and provide additional details in the next steps.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm">
          Review Classification <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 4 — Classification ───────────────────────────────────────────────────

function ConfidenceBar({ confidence }: { confidence: number }) {
  const bar  = confidence >= 80 ? 'bg-emerald-500' : confidence >= 65 ? 'bg-blue-500' : 'bg-amber-500'
  const text = confidence >= 80 ? 'text-emerald-600' : confidence >= 65 ? 'text-blue-600' : 'text-amber-600'
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${confidence}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${text}`}>{confidence}%</span>
    </div>
  )
}

function StepClassification({
  cls, setCls, suggestions, onNext, onBack,
}: {
  cls: Classification
  setCls: (c: Classification) => void
  suggestions: ClassificationSuggestions
  onNext: () => void
  onBack: () => void
}) {
  const set = (k: keyof Classification) => (v: string) =>
    setCls({ ...cls, [k]: v, ...(k === 'businessUnit' ? { division: '' } : {}) })

  const divisions = cls.businessUnit ? (DIVISIONS_BY_BU[cls.businessUnit] ?? []) : []

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h2 className="text-xl font-bold text-foreground">Suggested Classification</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Portfolio intelligence has pre-classified your idea. Review the confidence scores and adjust as needed.
        </p>
      </div>

      {/* AI summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Category', value: suggestions.category.value,   conf: suggestions.category.confidence  },
          { label: 'Type',     value: suggestions.type.value,        conf: suggestions.type.confidence      },
          { label: 'Program',  value: suggestions.program.value,     conf: suggestions.program.confidence   },
          { label: 'P&L Line', value: suggestions.pnlLine.value,     conf: suggestions.pnlLine.confidence   },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{s.label}</p>
            <p className="text-sm font-bold text-foreground mt-1 leading-snug">{s.value}</p>
            <ConfidenceBar confidence={s.conf} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Category</label>
            <span className="text-[10px] text-blue-500">AI: {suggestions.category.value} · {suggestions.category.confidence}% conf.</span>
          </div>
          <div className="space-y-2">
            {(['Revenue', 'Cost', 'Structural'] as MeasureCategory[]).map(cat => {
              const desc   = { Revenue: 'Increases in income or yield', Cost: 'Reduction in operating expenses', Structural: 'Process, organization or capability' }[cat]
              const colors = { Revenue: 'border-blue-300 bg-blue-50', Cost: 'border-orange-300 bg-orange-50', Structural: 'border-purple-300 bg-purple-50' }[cat]
              return (
                <button key={cat} onClick={() => set('category')(cat)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${cls.category === cat ? `${colors} shadow-sm` : 'border-border bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    {suggestions.category.value === cat && (
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 shrink-0 ml-2">AI</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          {/* Type */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Type</label>
              <span className="text-[10px] text-blue-500">AI: {suggestions.type.value} · {suggestions.type.confidence}% conf.</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['Sustainable', 'One-Off'] as MeasureType[]).map(t => (
                <button key={t} onClick={() => set('type')(t)}
                  className={`px-3 py-3 rounded-lg border-2 text-left transition-all ${cls.type === t ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:border-slate-300'}`}
                >
                  <p className={`text-sm font-semibold ${cls.type === t ? 'text-blue-700' : 'text-foreground'}`}>{t}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t === 'Sustainable' ? 'Recurring annual impact' : 'One-time benefit'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Owner */}
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Potential Owner</label>
              <span className="text-[10px] text-blue-500">AI: {suggestions.owner.confidence}% conf.</span>
            </div>
            <input type="text" value={cls.owner} onChange={e => set('owner')(e.target.value)}
              placeholder={suggestions.owner.value || 'e.g. Sarah Müller'}
              className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Organization</label>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Business Unit</label>
                <span className="text-[10px] text-blue-500">{suggestions.businessUnit.value} · {suggestions.businessUnit.confidence}%</span>
              </div>
              <select value={cls.businessUnit} onChange={e => set('businessUnit')(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none">
                <option value="">Select business unit</option>
                {BUSINESS_UNITS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Division</label>
                {cls.businessUnit && <span className="text-[10px] text-blue-500">{suggestions.division.value} · {suggestions.division.confidence}%</span>}
              </div>
              <select value={cls.division} onChange={e => set('division')(e.target.value)} disabled={!cls.businessUnit}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">{cls.businessUnit ? 'Select division' : 'Select a BU first'}</option>
                {divisions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Program */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Program Assignment</label>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Program</label>
                <span className="text-[10px] text-blue-500">{suggestions.program.confidence}% conf.</span>
              </div>
              <select value={cls.program} onChange={e => set('program')(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none">
                <option value="">Select program</option>
                {PROGRAMS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Workstream</label>
                <span className="text-[10px] text-blue-500">{suggestions.workstream.confidence}% conf.</span>
              </div>
              <select value={cls.workstream} onChange={e => set('workstream')(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none">
                <option value="">Select workstream</option>
                {WORKSTREAMS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">P&amp;L Line</label>
                <span className="text-[10px] text-blue-500">{suggestions.pnlLine.confidence}% conf.</span>
              </div>
              <select value={cls.pnlLine} onChange={e => set('pnlLine')(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all appearance-none">
                <option value="">Select P&amp;L line</option>
                {PNL_LINES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm">
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 5 — Guided Refinement ────────────────────────────────────────────────

function StepRefinement({ cls, setCls, onNext, onBack }: {
  cls: Classification; setCls: (c: Classification) => void
  onNext: () => void; onBack: () => void
}) {
  const [qIndex, setQIndex]       = useState(0)
  const [inputValue, setInputValue] = useState('')

  const questions = REFINEMENT_QUESTIONS
  const current   = questions[qIndex]
  const isLast    = qIndex >= questions.length - 1
  const Icon      = current.icon

  const canAnswer =
    current.optional ? true :
    current.type === 'number' ? parseFloat(inputValue) > 0 :
    current.type === 'select' ? !!inputValue :
    inputValue.trim().length > 0

  const advance = (save: boolean) => {
    if (save && inputValue.trim()) {
      setCls({ ...cls, [current.id]: inputValue.trim() })
    }
    if (isLast) {
      onNext()
    } else {
      setQIndex(i => i + 1)
      setInputValue('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => (
            <div key={q.id} className={`h-1 rounded-full transition-all flex-1 ${
              i < qIndex ? 'bg-emerald-500' : i === qIndex ? 'bg-[#1e3a5f]' : 'bg-slate-200'
            }`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Question {qIndex + 1} of {questions.length}</p>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-border px-8 py-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-5 h-5 text-[#1e3a5f]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{current.label}</p>
            <h3 className="text-lg font-bold text-foreground leading-snug">{current.question}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{current.subtext}</p>
          </div>
        </div>

        <div className="px-8 py-7">
          {current.type === 'number' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">€</span>
              <input autoFocus type="number" min={0} step={0.5} value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canAnswer && advance(true)}
                placeholder={current.placeholder}
                className="w-full pl-9 pr-16 py-4 text-2xl font-bold bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">M p.a.</span>
            </div>
          )}
          {current.type === 'text' && (
            <input autoFocus type="text" value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && advance(true)}
              placeholder={current.placeholder}
              className="w-full px-4 py-4 text-sm bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          )}
          {current.type === 'select' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {current.options?.map(opt => (
                <button key={opt} onClick={() => setInputValue(opt)}
                  className={`px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    inputValue === opt
                      ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                      : 'border-border bg-white hover:border-slate-300 text-foreground'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-4 bg-slate-50 border-t border-border flex items-center justify-between">
          {current.optional ? (
            <button onClick={() => advance(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip
            </button>
          ) : <div />}
          <button onClick={() => advance(true)} disabled={!canAnswer}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLast ? 'Continue to Preview' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Captured answers */}
      {qIndex > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2.5">Captured so far</p>
          <div className="flex flex-wrap gap-2">
            {questions.slice(0, qIndex).map(q => {
              const val = cls[q.id as keyof Classification]
              if (!val) return null
              return (
                <div key={q.id} className="text-xs bg-white border border-emerald-200 rounded-lg px-3 py-1.5">
                  <span className="text-muted-foreground">{q.label}:</span>{' '}
                  <span className="font-semibold text-foreground">
                    {q.id === 'expectedImpact' ? `€${val}M p.a.` : val}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={qIndex > 0 ? () => { setQIndex(i => i - 1); setInputValue('') } : onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </div>
  )
}

// ── Step 6 — Preview ──────────────────────────────────────────────────────────

function PreviewField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold leading-snug ${highlight ? 'text-blue-700' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

function StepPreview({ idea, cls, score, onCreate, onBack }: {
  idea: string; cls: Classification; score: OpportunityScore
  onCreate: () => void; onBack: () => void
}) {
  const title       = generateTitle(idea)
  const description = generateDescription(idea, cls)
  const impactNum   = parseFloat(cls.expectedImpact || '0') || 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Generated Measure Preview</h2>
        <p className="text-sm text-muted-foreground">
          Review the measure before creating it. It will enter the portfolio at <span className="font-semibold text-foreground">DI0 — Idea Stage</span>.
        </p>
      </div>

      {/* DI0 Governance Notice */}
      <div className="flex items-start gap-4 p-5 bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl">
        <div className="w-9 h-9 rounded-lg bg-[#1e3a5f] flex items-center justify-center shrink-0">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1e3a5f]">This idea will be created as a DI0 measure.</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            <span className="font-semibold">DI0 = Idea Stage.</span> Further validation is required before this measure can progress through the transformation lifecycle. A sponsor must be assigned and an opportunity brief developed before advancement to DI1.
          </p>
        </div>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-2xl border-2 border-[#1e3a5f]/20 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2340] px-6 py-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold bg-white/20 text-white border border-white/30 rounded px-2 py-0.5 uppercase tracking-widest font-mono">DI0 — Idea</span>
            {cls.category && (
              <span className="text-xs font-medium bg-white/10 text-white border border-white/20 rounded-md px-2 py-0.5">{cls.category}</span>
            )}
            {cls.type && (
              <span className="text-xs font-medium bg-white/10 text-white border border-white/20 rounded-md px-2 py-0.5">{cls.type}</span>
            )}
            <span className="text-xs font-medium bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-md px-2 py-0.5">Watch</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
          <p className="text-blue-200 text-xs mt-2">Opportunity score: {score.overall}/100</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewField label="Expected Impact" value={impactNum > 0 ? `€${impactNum}M p.a.` : 'TBD'} highlight={impactNum > 0} />
            <PreviewField label="DI Level"        value="DI0 — Idea" />
            <PreviewField label="Status"          value="Watch" />
            <PreviewField label="Risk Level"      value="Medium" />
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewField label="Business Unit" value={cls.businessUnit || 'TBD'} />
            <PreviewField label="Division"      value={cls.division     || 'TBD'} />
            <PreviewField label="Program"       value={cls.program      || 'Project Horizon'} />
            <PreviewField label="Workstream"    value={cls.workstream   || 'TBD'} />
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewField label="P&L Line"      value={cls.pnlLine    || 'TBD'} />
            <PreviewField label="Type"          value={cls.type       || 'Sustainable'} />
            <PreviewField label="Start"         value={cls.startDate  || 'TBD'} />
            <PreviewField label="Owner"         value={cls.owner      || 'TBD'} />
          </div>

          {(cls.dependencies || cls.primaryRisks) && (
            <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cls.dependencies && <PreviewField label="Dependencies"  value={cls.dependencies} />}
              {cls.primaryRisks && <PreviewField label="Primary Risks" value={cls.primaryRisks} />}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create DI0 Measure
        </button>
      </div>
    </div>
  )
}

// ── Step 7 — Created ──────────────────────────────────────────────────────────

function StepCreated({ measure, onCreateAnother, onViewPortfolio }: {
  measure: Measure; onCreateAnother: () => void; onViewPortfolio: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">DI0 Measure Created</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          <span className="font-semibold text-foreground">{measure.id}</span> has been added to the transformation portfolio at Idea Stage.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Successfully submitted to portfolio</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#1e3a5f] bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{measure.id}</span>
            <DIBadge level="DI0" />
            <CategoryBadge category={measure.category} />
            <StatusBadge status={measure.status} />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{measure.title}</p>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Program</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{measure.program}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Expected Impact</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {measure.targetImpact > 0 ? formatCurrency(measure.targetImpact) : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Owner</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{measure.owner}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Recommended Next Steps</p>
        <div className="space-y-2.5">
          {[
            { n: '01', text: 'Assign a transformation sponsor from the leadership team' },
            { n: '02', text: 'Develop the DI1 opportunity brief and high-level financial model' },
            { n: '03', text: 'Submit for DI2 validation review and business case approval' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="text-[10px] font-bold text-muted-foreground bg-slate-200 rounded px-1.5 py-0.5 shrink-0 mt-0.5 tabular-nums">{s.n}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={onCreateAnother}
          className="flex items-center gap-2 px-5 py-2.5 border border-border text-sm font-semibold text-foreground bg-white rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Submit Another Idea
        </button>
        <button onClick={onViewPortfolio}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white text-sm font-semibold rounded-lg hover:bg-[#162d4a] transition-colors shadow-sm"
        >
          View Portfolio <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
