import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lightbulb, Search, ListChecks, Eye, CheckCircle2,
  ChevronRight, ChevronLeft, ArrowRight, Sparkles,
  Building2, Target, Plus,
} from 'lucide-react'
import { measures as baseMeasures } from '@/data/measures'
import { formatCurrency } from '@/lib/utils'
import { DIBadge, StatusBadge, CategoryBadge } from '@/components/StatusBadge'
import type { Measure, MeasureCategory, MeasureType } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Classification {
  category: MeasureCategory | ''
  type: MeasureType | ''
  businessUnit: string
  division: string
  program: string
  workstream: string
  expectedImpact: string
  owner: string
}

interface SimilarMeasure {
  measure: Measure
  similarity: number
  matchReason: string
}

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Idea Input',       icon: Lightbulb  },
  { id: 2, label: 'Similar Measures', icon: Search     },
  { id: 3, label: 'Classification',   icon: ListChecks },
  { id: 4, label: 'Preview',          icon: Eye        },
  { id: 5, label: 'Created',          icon: CheckCircle2 },
]

// ── Org data derived from existing measures ───────────────────────────────────

const BUSINESS_UNITS = [...new Set(baseMeasures.map(m => m.businessUnit))].sort()
const PROGRAMS       = [...new Set(baseMeasures.map(m => m.program))].sort()
const WORKSTREAMS    = [...new Set(baseMeasures.map(m => m.workstream))].sort()

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
  const ideaLower  = idea.toLowerCase()
  const ideaWords  = ideaLower
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

      const idHash   = m.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const jitter   = (idHash % 11) - 5
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

function suggestCategory(idea: string): MeasureCategory {
  const lower  = idea.toLowerCase()
  const scores: Record<MeasureCategory, number> = { Revenue: 0, Cost: 0, Structural: 0 }
  for (const [kw, cat, pts] of CATEGORY_KEYWORDS) {
    if (lower.includes(kw)) scores[cat] += pts
  }
  const best = (Object.entries(scores) as [MeasureCategory, number][])
    .sort(([, a], [, b]) => b - a)[0]
  return best[1] > 0 ? best[0] : 'Structural'
}

// ── Title / description generation ───────────────────────────────────────────

function generateTitle(idea: string): string {
  const cleaned = idea.trim().replace(/[.!?]+$/, '').trim()
  const titled  = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return titled.length > 72 ? titled.substring(0, 69) + '…' : titled
}

function generateDescription(idea: string, c: Classification): string {
  const impactNum = parseFloat(c.expectedImpact || '0') || 0
  const impact    = impactNum > 0
    ? `with an expected annual impact of ${formatCurrency(impactNum * 1_000_000)}`
    : 'with impact to be quantified during DI1 validation'
  const bu = c.businessUnit || 'the assigned business unit'
  const ws = c.workstream   || 'the designated workstream'

  const base = idea.trim().replace(/[.!?]+$/, '').trim()
  return `${base}. This measure is led by ${bu} and tracked within ${ws}, ${impact}. A detailed business case and financial model will be developed during the DI1–DI2 validation phase.`
}

// ── Main component ────────────────────────────────────────────────────────────

const EMPTY_CLASSIFICATION: Classification = {
  category: '', type: '', businessUnit: '', division: '',
  program: '', workstream: '', expectedImpact: '', owner: '',
}

export default function IdeationAssistant() {
  const navigate = useNavigate()
  const [step, setStep]                   = useState(1)
  const [idea, setIdea]                   = useState('')
  const [flagged, setFlagged]             = useState<string[]>([])
  const [cls, setCls]                     = useState<Classification>(EMPTY_CLASSIFICATION)
  const [created, setCreated]             = useState<Measure | null>(null)
  const [sessionMeasures, setSessionMeasures] = useState<Measure[]>([])

  const similar         = useMemo(() => idea.trim().length > 10 ? computeSimilarMeasures(idea) : [], [idea])
  const suggestedCat    = useMemo(() => suggestCategory(idea), [idea])

  const goNext = () => {
    if (step === 1 && !cls.category) {
      setCls(c => ({ ...c, category: suggestedCat }))
    }
    if (step === 2 && similar.length > 0) {
      const top = similar[0].measure
      setCls(c => ({
        ...c,
        category:     (c.category     || top.category)     as MeasureCategory,
        businessUnit: c.businessUnit  || top.businessUnit,
        program:      c.program       || top.program,
        workstream:   c.workstream    || top.workstream,
        owner:        c.owner         || top.owner,
      }))
    }
    setStep(s => s + 1)
  }

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
      pnlLine:        'Other Operating Cost',
      riskLevel:      'Medium',
      targetImpact:   impact,
      forecastImpact: Math.round(impact * 0.85),
      realizedImpact: 0,
      fteTarget:      0,
      fteForecast:    0,
      fteRealized:    0,
      approvals:      [],
      risks:          [],
      assumptions:    [],
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
    setStep(5)
  }

  const handleReset = () => {
    setStep(1); setIdea(''); setFlagged([]); setCls(EMPTY_CLASSIFICATION); setCreated(null)
  }

  return (
    <div className="min-h-full bg-slate-50/60">

      {/* Page header */}
      <div className="bg-white border-b border-border px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Lightbulb className="w-4.5 h-4.5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">Ideation Assistant</h1>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 uppercase tracking-wide">Demo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Guided transformation measure intake — Project Horizon</p>
            </div>
          </div>

          {/* Session counter */}
          {sessionMeasures.length > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created this session</p>
              <p className="text-sm font-bold text-blue-600 mt-0.5">{sessionMeasures.length} measure{sessionMeasures.length > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Step indicator */}
      {step < 5 && (
        <div className="bg-white border-b border-border px-8 py-4">
          <div className="max-w-4xl mx-auto">
            <StepIndicator current={step} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {step === 1 && <StepIdea   idea={idea} setIdea={setIdea} suggestedCat={suggestedCat} onNext={goNext} />}
        {step === 2 && <StepSimilar similar={similar} flagged={flagged} setFlagged={setFlagged} onNext={goNext} onBack={() => setStep(1)} />}
        {step === 3 && <StepClassify cls={cls} setCls={setCls} suggestedCat={suggestedCat} onNext={goNext} onBack={() => setStep(2)} />}
        {step === 4 && <StepPreview idea={idea} cls={cls} onCreate={handleCreate} onBack={() => setStep(3)} />}
        {step === 5 && created && <StepConfirm measure={created} onCreateAnother={handleReset} onViewPortfolio={() => navigate('/portfolio')} />}
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = STEPS.slice(0, 4)
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const done   = s.id < current
        const active = s.id === current
        const Icon   = s.icon
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                active ? 'border-blue-600 bg-blue-600 shadow-md shadow-blue-200/60' :
                done   ? 'border-emerald-500 bg-emerald-500' :
                         'border-slate-200 bg-white'
              }`}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-white" />
                  : <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                }
              </div>
              <p className={`text-[11px] font-medium mt-1.5 ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                {s.label}
              </p>
            </div>
            {i < 3 && (
              <div className={`flex-1 h-0.5 mx-3 mb-5 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1 — Idea Input ───────────────────────────────────────────────────────

function StepIdea({
  idea, setIdea, suggestedCat, onNext,
}: {
  idea: string; setIdea: (v: string) => void
  suggestedCat: MeasureCategory; onNext: () => void
}) {
  const canContinue = idea.trim().length >= 15

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Describe your transformation idea</h2>
        <p className="text-sm text-muted-foreground">
          Describe the opportunity in plain language. No formatting required — just explain what you want to achieve and why it matters.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-2.5">
            Idea Description
          </label>
          <textarea
            autoFocus
            value={idea}
            onChange={e => setIdea(e.target.value)}
            rows={5}
            placeholder="e.g. Reduce fuel consumption through improved taxi procedures at hub airports to decrease ground fuel burn and lower operating costs."
            className="w-full text-sm text-foreground placeholder:text-slate-400 bg-slate-50 border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none transition-all leading-relaxed"
          />
          <p className={`text-xs mt-2 ${idea.length > 0 && idea.length < 15 ? 'text-amber-500' : 'text-muted-foreground'}`}>
            {idea.length > 0 && idea.length < 15 ? 'Add a bit more detail to continue.' : `${idea.length} characters`}
          </p>
        </div>

        {canContinue && (
          <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-800">
                Suggested category: <span className="font-bold">{suggestedCat}</span>
              </p>
              <p className="text-[11px] text-blue-600 mt-0.5">
                Based on keywords in your description — you can adjust this in Step 3.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Example prompts */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Example ideas</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Reduce fuel consumption through improved taxi procedures',
            'Dynamic pricing for premium cabin upgrades',
            'Consolidate IT vendor contracts across all divisions',
          ].map(ex => (
            <button
              key={ex}
              onClick={() => setIdea(ex)}
              className="text-xs text-slate-600 bg-white border border-border rounded-lg px-3 py-2 hover:border-blue-300 hover:text-blue-600 transition-colors text-left"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Find Similar Measures <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 2 — Similar Measures ─────────────────────────────────────────────────

function StepSimilar({
  similar, flagged, setFlagged, onNext, onBack,
}: {
  similar: SimilarMeasure[]; flagged: string[]; setFlagged: (v: string[]) => void
  onNext: () => void; onBack: () => void
}) {
  const toggle = (id: string) =>
    setFlagged(flagged.includes(id) ? flagged.filter(x => x !== id) : [...flagged, id])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Similar measures found</h2>
        <p className="text-sm text-muted-foreground">
          These existing measures share overlap with your idea. Review them to avoid duplication and inform your classification in the next step.
        </p>
      </div>

      {similar.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">No close matches found</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
            Your idea appears to be a novel initiative. Proceed to classification.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {similar.map(({ measure: m, similarity, matchReason }) => {
            const isFlagged = flagged.includes(m.id)
            const simStyle  = similarity >= 65
              ? 'text-red-700 bg-red-50 border-red-200'
              : similarity >= 35
              ? 'text-amber-700 bg-amber-50 border-amber-200'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'

            return (
              <div
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer select-none transition-all ${
                  isFlagged ? 'border-blue-400 ring-2 ring-blue-100' : 'border-border hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${simStyle}`}>
                        {similarity}% match
                      </span>
                      <DIBadge level={m.diLevel} size="sm" />
                      <StatusBadge status={m.status} />
                      <CategoryBadge category={m.category} />
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{m.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {matchReason} · {m.businessUnit} · {m.workstream}
                    </p>
                  </div>
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                    isFlagged ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                  }`}>
                    {isFlagged && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {flagged.length > 0 && (
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
          <span>
            <span className="font-semibold">{flagged.length} similar measure{flagged.length > 1 ? 's' : ''} flagged.</span>
            {' '}Ensure your initiative is sufficiently differentiated before proceeding.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          Continue to Classification <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3 — Classification ───────────────────────────────────────────────────

function StepClassify({
  cls, setCls, suggestedCat, onNext, onBack,
}: {
  cls: Classification; setCls: (c: Classification) => void
  suggestedCat: MeasureCategory; onNext: () => void; onBack: () => void
}) {
  const set = (k: keyof Classification) => (v: string) =>
    setCls({ ...cls, [k]: v, ...(k === 'businessUnit' ? { division: '' } : {}) })

  const divisions  = cls.businessUnit ? (DIVISIONS_BY_BU[cls.businessUnit] ?? []) : []
  const canContinue = !!(cls.category && cls.type && cls.businessUnit)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Classify your measure</h2>
        <p className="text-sm text-muted-foreground">
          Assign your idea to the correct category, organization and program. Fields marked <span className="text-red-500 font-semibold">*</span> are required.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Category */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {(['Revenue', 'Cost', 'Structural'] as MeasureCategory[]).map(cat => {
              const desc    = { Revenue: 'Increases in income or yield', Cost: 'Reduction in operating expenses', Structural: 'Process, organization or capability change' }[cat]
              const colors  = { Revenue: 'border-blue-300 bg-blue-50', Cost: 'border-orange-300 bg-orange-50', Structural: 'border-purple-300 bg-purple-50' }[cat]
              const isSelected  = cls.category === cat
              const isSuggested = suggestedCat === cat && !cls.category

              return (
                <button
                  key={cat}
                  onClick={() => set('category')(cat)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected ? `${colors} shadow-sm` : 'border-border bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSuggested && (
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5">
                          Suggested
                        </span>
                      )}
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Type + Impact */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Sustainable', 'One-Off'] as MeasureType[]).map(t => {
                const sub = t === 'Sustainable' ? 'Recurring annual impact' : 'One-time benefit'
                return (
                  <button
                    key={t}
                    onClick={() => set('type')(t)}
                    className={`px-3 py-3 rounded-lg border-2 text-left transition-all ${
                      cls.type === t
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${cls.type === t ? 'text-blue-700' : 'text-foreground'}`}>{t}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
              Expected Impact (€M p.a.)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">€</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={cls.expectedImpact}
                onChange={e => set('expectedImpact')(e.target.value)}
                placeholder="0.0"
                className="w-full pl-8 pr-10 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">M</span>
            </div>
          </div>
        </div>

        {/* Organization */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Organization <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="space-y-3">
            <FormSelect label="Business Unit" value={cls.businessUnit} onChange={set('businessUnit')} options={BUSINESS_UNITS} placeholder="Select business unit" />
            <FormSelect label="Division" value={cls.division} onChange={set('division')} options={divisions}
              placeholder={cls.businessUnit ? 'Select division' : 'Select a BU first'}
              disabled={!cls.businessUnit} />
          </div>
        </div>

        {/* Program assignment */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Program Assignment</label>
          </div>
          <div className="space-y-3">
            <FormSelect label="Program" value={cls.program} onChange={set('program')} options={PROGRAMS} placeholder="Select program" />
            <FormSelect label="Workstream" value={cls.workstream} onChange={set('workstream')} options={WORKSTREAMS} placeholder="Select workstream" />
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Potential Owner</label>
              <input
                type="text"
                value={cls.owner}
                onChange={e => set('owner')(e.target.value)}
                placeholder="e.g. Sarah Müller"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </div>

      </div>

      {!canContinue && (
        <p className="text-xs text-amber-600 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
          Complete Category, Type and Business Unit to proceed.
        </p>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Preview Measure <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// shared select field
function FormSelect({ label, value, onChange, options, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]; placeholder: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Step 4 — Preview ──────────────────────────────────────────────────────────

function StepPreview({
  idea, cls, onCreate, onBack,
}: {
  idea: string; cls: Classification; onCreate: () => void; onBack: () => void
}) {
  const title       = generateTitle(idea)
  const description = generateDescription(idea, cls)
  const impactNum   = parseFloat(cls.expectedImpact || '0') || 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Review your measure</h2>
        <p className="text-sm text-muted-foreground">
          This is how the measure will be created. It will enter the portfolio at <span className="font-semibold text-foreground">DI0 — Idea</span>.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-white rounded-xl border-2 border-blue-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-bold bg-white/20 text-white border border-white/30 rounded px-2 py-0.5 uppercase tracking-wide font-mono">Draft</span>
            <span className="text-xs font-semibold bg-white/20 text-white border border-white/30 rounded-md px-2 py-0.5">DI0 — Idea</span>
            {cls.category && <span className="text-xs font-medium bg-white/20 text-white border border-white/30 rounded-md px-2 py-0.5">{cls.category}</span>}
            {cls.type     && <span className="text-xs font-medium bg-white/20 text-white border border-white/30 rounded-md px-2 py-0.5">{cls.type}</span>}
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewField label="Expected Impact" value={impactNum > 0 ? `€${impactNum}M p.a.` : 'TBD'} highlight={impactNum > 0} />
            <PreviewField label="DI Level"  value="DI0 — Idea" />
            <PreviewField label="Status"    value="Watch" />
            <PreviewField label="Risk Level" value="Medium" />
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PreviewField label="Business Unit" value={cls.businessUnit || 'TBD'} />
            <PreviewField label="Division"      value={cls.division      || 'TBD'} />
            <PreviewField label="Program"       value={cls.program       || 'Project Horizon'} />
            <PreviewField label="Workstream"    value={cls.workstream    || 'TBD'} />
          </div>

          {cls.owner && (
            <div className="pt-4 border-t border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-white">
                  {cls.owner.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Potential Owner</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{cls.owner}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 p-4 bg-slate-50 border border-border rounded-lg text-xs text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1" />
        <span>
          <span className="font-semibold text-foreground">After creation:</span>
          {' '}Assign a sponsor, develop the DI1 opportunity brief, and submit for DI2 validation review.
        </span>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Measure
        </button>
      </div>
    </div>
  )
}

function PreviewField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-sm font-semibold leading-snug ${highlight ? 'text-blue-700' : 'text-foreground'}`}>{value}</p>
    </div>
  )
}

// ── Step 5 — Confirmed ────────────────────────────────────────────────────────

function StepConfirm({
  measure, onCreateAnother, onViewPortfolio,
}: {
  measure: Measure; onCreateAnother: () => void; onViewPortfolio: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Measure Created</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          <span className="font-semibold text-foreground">{measure.id}</span> has been added as a DI0 idea.
          Assign a sponsor and kick off DI1 validation to move it forward.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden max-w-xl mx-auto">
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">Successfully submitted to portfolio</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">{measure.id}</span>
            <DIBadge level="DI0" />
            <CategoryBadge category={measure.category} />
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{measure.title}</p>
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
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
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-slate-50 border border-border rounded-xl p-5 max-w-xl mx-auto">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Recommended Next Steps</p>
        <div className="space-y-2.5">
          {[
            { n: '01', text: 'Assign a sponsor from the leadership team' },
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
        <button
          onClick={onCreateAnother}
          className="flex items-center gap-2 px-5 py-2.5 border border-border text-sm font-semibold text-foreground bg-white rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Another
        </button>
        <button
          onClick={onViewPortfolio}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          View Portfolio <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
