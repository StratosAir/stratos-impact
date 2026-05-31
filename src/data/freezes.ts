import { measures } from './measures'
import type { DILevel, MeasureStatus } from '@/types'

export interface DataFreeze {
  id: string
  label: string
  date: string
}

export const DATA_FREEZES: DataFreeze[] = [
  { id: 'DF2025-06', label: 'DF2025-06', date: '2025-06-30' },
  { id: 'DF2025-07', label: 'DF2025-07', date: '2025-07-31' },
  { id: 'DF2025-08', label: 'DF2025-08', date: '2025-08-31' },
  { id: 'DF2025-09', label: 'DF2025-09', date: '2025-09-30' },
  { id: 'DF2025-10', label: 'DF2025-10', date: '2025-10-31' },
]

export const LATEST_FREEZE_ID = 'DF2025-10'

export interface FreezeMeasureSnapshot {
  diLevel: DILevel
  status: MeasureStatus
  forecastImpact: number
}

type FreezeOverride = Partial<FreezeMeasureSnapshot>

// Deltas from the current (DF2025-10) state in measures.ts.
// Only measures that differ from the current state are listed.
// DI levels are always monotonically non-decreasing across freezes.
const FREEZE_OVERRIDES: Record<string, Record<string, FreezeOverride>> = {
  'DF2025-06': {
    'M-001': { diLevel: 'DI2', forecastImpact: 32_000_000, status: 'Watch' },
    'M-002': { diLevel: 'DI4', forecastImpact: 30_000_000 },
    'M-003': { diLevel: 'DI2', forecastImpact: 16_000_000 },
    'M-004': { diLevel: 'DI1', forecastImpact: 8_000_000, status: 'Watch' },
    'M-005': { diLevel: 'DI3', forecastImpact: 25_000_000 },
    'M-006': { forecastImpact: 56_000_000 },
    'M-007': { diLevel: 'DI2', forecastImpact: 10_000_000 },
    'M-008': { diLevel: 'DI1', forecastImpact: 12_000_000 },
    'M-009': { diLevel: 'DI1', forecastImpact: 18_000_000, status: 'Watch' },
    'M-010': { diLevel: 'DI3', forecastImpact: 15_000_000 },
    'M-011': { forecastImpact: 75_000_000 },
    'M-012': { diLevel: 'DI3', forecastImpact: 9_000_000 },
    'M-013': { diLevel: 'DI2', forecastImpact: 15_000_000 },
    'M-014': { diLevel: 'DI0', forecastImpact: 5_000_000 },
    'M-015': { diLevel: 'DI2', forecastImpact: 20_000_000 },
    'M-016': { diLevel: 'DI1', forecastImpact: 4_500_000 },
    'M-017': { diLevel: 'DI3', forecastImpact: 12_000_000 },
    'M-018': { diLevel: 'DI2', forecastImpact: 6_000_000 },
    'M-019': { diLevel: 'DI3', forecastImpact: 7_000_000 },
    'M-020': { diLevel: 'DI3', forecastImpact: 7_500_000 },
    'M-021': { diLevel: 'DI2', forecastImpact: 15_000_000 },
    'M-022': { diLevel: 'DI2', forecastImpact: 3_500_000 },
    'M-023': { diLevel: 'DI1', forecastImpact: 9_000_000 },
    'M-024': { diLevel: 'DI2', forecastImpact: 4_000_000 },
    'M-025': { diLevel: 'DI1', forecastImpact: 1_500_000 },
    'M-026': { diLevel: 'DI2', forecastImpact: 8_000_000 },
    'M-027': { diLevel: 'DI0', forecastImpact: 1_500_000 },
    'M-028': { diLevel: 'DI3', forecastImpact: 18_000_000 },
    'M-029': { diLevel: 'DI1', forecastImpact: 3_000_000 },
    'M-030': { diLevel: 'DI2', forecastImpact: 7_000_000 },
    'M-031': { diLevel: 'DI0', forecastImpact: 2_500_000 },
    'M-032': { diLevel: 'DI3', forecastImpact: 6_000_000 },
    'M-033': { diLevel: 'DI2', forecastImpact: 6_000_000 },
    'M-034': { diLevel: 'DI1', forecastImpact: 4_000_000 },
    'M-035': { diLevel: 'DI0', forecastImpact: 6_000_000, status: 'Watch' },
    'M-036': { diLevel: 'DI3', forecastImpact: 14_000_000 },
    'M-037': { diLevel: 'DI2', forecastImpact: 9_500_000 },
    'M-039': { diLevel: 'DI1', forecastImpact: 7_000_000, status: 'Watch' },
    'M-040': { diLevel: 'DI1', forecastImpact: 10_000_000 },
    'M-041': { diLevel: 'DI1', forecastImpact: 11_000_000 },
    'M-042': { diLevel: 'DI2', forecastImpact: 2_000_000 },
    'M-043': { diLevel: 'DI3', forecastImpact: 8_000_000 },
    'M-044': { diLevel: 'DI1', forecastImpact: 4_000_000 },
    'M-045': { diLevel: 'DI2', forecastImpact: 3_800_000 },
    'M-046': { diLevel: 'DI2', forecastImpact: 14_000_000 },
    'M-047': { diLevel: 'DI0', forecastImpact: 4_500_000 },
    'M-048': { diLevel: 'DI0', forecastImpact: 3_000_000 },
    'M-049': { diLevel: 'DI0', forecastImpact: 1_500_000 },
    'M-050': { diLevel: 'DI0', forecastImpact: 1_500_000 },
  },
  'DF2025-07': {
    'M-001': { diLevel: 'DI2', forecastImpact: 33_000_000, status: 'Watch' },
    'M-002': { diLevel: 'DI4', forecastImpact: 31_000_000 },
    'M-003': { diLevel: 'DI2', forecastImpact: 18_000_000 },
    'M-004': { diLevel: 'DI1', forecastImpact: 9_000_000, status: 'Watch' },
    'M-005': { diLevel: 'DI4', forecastImpact: 27_000_000 },
    'M-006': { forecastImpact: 57_000_000 },
    'M-007': { diLevel: 'DI2', forecastImpact: 11_000_000 },
    'M-008': { diLevel: 'DI2', forecastImpact: 14_000_000 },
    'M-009': { diLevel: 'DI2', forecastImpact: 20_000_000, status: 'At Risk' },
    'M-010': { diLevel: 'DI3', forecastImpact: 16_000_000 },
    'M-011': { forecastImpact: 76_000_000 },
    'M-012': { diLevel: 'DI3', forecastImpact: 9_500_000 },
    'M-013': { diLevel: 'DI2', forecastImpact: 16_000_000 },
    'M-014': { diLevel: 'DI0', forecastImpact: 5_500_000 },
    'M-015': { diLevel: 'DI2', forecastImpact: 21_000_000 },
    'M-016': { diLevel: 'DI1', forecastImpact: 5_000_000 },
    'M-017': { diLevel: 'DI3', forecastImpact: 12_500_000 },
    'M-018': { diLevel: 'DI2', forecastImpact: 6_500_000 },
    'M-019': { diLevel: 'DI3', forecastImpact: 7_200_000 },
    'M-020': { diLevel: 'DI3', forecastImpact: 8_000_000 },
    'M-021': { diLevel: 'DI2', forecastImpact: 16_000_000 },
    'M-022': { diLevel: 'DI2', forecastImpact: 3_800_000 },
    'M-023': { diLevel: 'DI2', forecastImpact: 9_500_000 },
    'M-024': { diLevel: 'DI2', forecastImpact: 4_200_000 },
    'M-025': { diLevel: 'DI1', forecastImpact: 1_700_000 },
    'M-026': { diLevel: 'DI2', forecastImpact: 8_500_000 },
    'M-027': { diLevel: 'DI0', forecastImpact: 1_600_000 },
    'M-028': { diLevel: 'DI3', forecastImpact: 19_000_000 },
    'M-029': { diLevel: 'DI1', forecastImpact: 3_200_000 },
    'M-030': { diLevel: 'DI2', forecastImpact: 7_500_000 },
    'M-031': { diLevel: 'DI0', forecastImpact: 2_800_000 },
    'M-032': { diLevel: 'DI4', forecastImpact: 6_200_000 },
    'M-033': { diLevel: 'DI2', forecastImpact: 6_300_000 },
    'M-034': { diLevel: 'DI1', forecastImpact: 4_500_000 },
    'M-035': { diLevel: 'DI0', forecastImpact: 6_500_000, status: 'Watch' },
    'M-036': { diLevel: 'DI3', forecastImpact: 15_000_000 },
    'M-037': { diLevel: 'DI2', forecastImpact: 10_000_000 },
    'M-039': { diLevel: 'DI1', forecastImpact: 6_000_000, status: 'At Risk' },
    'M-040': { diLevel: 'DI1', forecastImpact: 11_000_000 },
    'M-041': { diLevel: 'DI2', forecastImpact: 12_000_000 },
    'M-042': { diLevel: 'DI2', forecastImpact: 2_000_000 },
    'M-043': { diLevel: 'DI3', forecastImpact: 8_200_000 },
    'M-044': { diLevel: 'DI1', forecastImpact: 4_200_000 },
    'M-045': { diLevel: 'DI2', forecastImpact: 3_900_000 },
    'M-046': { diLevel: 'DI2', forecastImpact: 14_500_000 },
    'M-047': { diLevel: 'DI1', forecastImpact: 5_000_000 },
    'M-048': { diLevel: 'DI0', forecastImpact: 3_200_000 },
    'M-049': { diLevel: 'DI0', forecastImpact: 1_600_000 },
    'M-050': { diLevel: 'DI1', forecastImpact: 1_700_000 },
  },
  'DF2025-08': {
    'M-001': { diLevel: 'DI3', forecastImpact: 36_000_000 },
    'M-002': { diLevel: 'DI5', forecastImpact: 33_000_000 },
    'M-003': { diLevel: 'DI3', forecastImpact: 19_000_000 },
    'M-004': { diLevel: 'DI2', forecastImpact: 10_000_000, status: 'At Risk' },
    'M-005': { diLevel: 'DI4', forecastImpact: 28_000_000 },
    'M-006': { forecastImpact: 57_500_000 },
    'M-007': { diLevel: 'DI3', forecastImpact: 12_000_000 },
    'M-008': { diLevel: 'DI2', forecastImpact: 15_000_000 },
    'M-009': { diLevel: 'DI2', forecastImpact: 22_000_000, status: 'At Risk' },
    'M-010': { diLevel: 'DI3', forecastImpact: 17_000_000 },
    'M-011': { forecastImpact: 77_000_000 },
    'M-012': { diLevel: 'DI4', forecastImpact: 10_000_000 },
    'M-013': { diLevel: 'DI3', forecastImpact: 17_500_000 },
    'M-014': { diLevel: 'DI1', forecastImpact: 6_000_000 },
    'M-015': { diLevel: 'DI2', forecastImpact: 22_000_000 },
    'M-016': { diLevel: 'DI2', forecastImpact: 5_500_000 },
    'M-017': { diLevel: 'DI4', forecastImpact: 13_000_000 },
    'M-018': { diLevel: 'DI3', forecastImpact: 7_000_000 },
    'M-019': { diLevel: 'DI4', forecastImpact: 7_500_000 },
    'M-020': { diLevel: 'DI3', forecastImpact: 8_500_000 },
    'M-021': { diLevel: 'DI2', forecastImpact: 17_000_000 },
    'M-022': { diLevel: 'DI3', forecastImpact: 4_000_000 },
    'M-023': { diLevel: 'DI2', forecastImpact: 10_000_000 },
    'M-024': { diLevel: 'DI3', forecastImpact: 4_500_000 },
    'M-025': { diLevel: 'DI2', forecastImpact: 1_900_000 },
    'M-026': { diLevel: 'DI3', forecastImpact: 9_000_000 },
    'M-027': { diLevel: 'DI1', forecastImpact: 1_700_000 },
    'M-028': { diLevel: 'DI3', forecastImpact: 20_000_000 },
    'M-029': { diLevel: 'DI2', forecastImpact: 3_400_000 },
    'M-030': { diLevel: 'DI3', forecastImpact: 7_800_000 },
    'M-031': { diLevel: 'DI1', forecastImpact: 3_000_000 },
    'M-033': { diLevel: 'DI3', forecastImpact: 6_600_000 },
    'M-034': { diLevel: 'DI2', forecastImpact: 5_000_000 },
    'M-035': { diLevel: 'DI1', forecastImpact: 7_500_000, status: 'At Risk' },
    'M-036': { diLevel: 'DI3', forecastImpact: 15_500_000 },
    'M-037': { diLevel: 'DI3', forecastImpact: 10_500_000 },
    'M-039': { diLevel: 'DI2', forecastImpact: 5_500_000, status: 'At Risk' },
    'M-040': { diLevel: 'DI2', forecastImpact: 11_500_000 },
    'M-041': { diLevel: 'DI2', forecastImpact: 12_500_000 },
    'M-042': { diLevel: 'DI3', forecastImpact: 2_100_000 },
    'M-043': { diLevel: 'DI3', forecastImpact: 8_500_000 },
    'M-044': { diLevel: 'DI2', forecastImpact: 4_500_000 },
    'M-045': { diLevel: 'DI3', forecastImpact: 4_000_000 },
    'M-046': { diLevel: 'DI3', forecastImpact: 15_000_000 },
    'M-047': { diLevel: 'DI2', forecastImpact: 5_300_000 },
    'M-048': { diLevel: 'DI1', forecastImpact: 3_400_000 },
    'M-049': { diLevel: 'DI1', forecastImpact: 1_700_000 },
    'M-050': { diLevel: 'DI2', forecastImpact: 1_800_000 },
  },
  'DF2025-09': {
    'M-001': { diLevel: 'DI3', forecastImpact: 40_000_000 },
    'M-002': { diLevel: 'DI5', forecastImpact: 34_000_000 },
    'M-003': { diLevel: 'DI3', forecastImpact: 20_000_000 },
    'M-004': { diLevel: 'DI2', forecastImpact: 12_000_000, status: 'At Risk' },
    'M-005': { diLevel: 'DI4', forecastImpact: 29_000_000 },
    'M-006': { forecastImpact: 58_000_000 },
    'M-007': { diLevel: 'DI3', forecastImpact: 13_000_000 },
    'M-008': { diLevel: 'DI2', forecastImpact: 16_000_000 },
    'M-009': { diLevel: 'DI2', forecastImpact: 25_000_000, status: 'At Risk' },
    'M-010': { diLevel: 'DI3', forecastImpact: 18_000_000 },
    'M-011': { forecastImpact: 77_500_000 },
    'M-012': { diLevel: 'DI4', forecastImpact: 10_500_000 },
    'M-013': { diLevel: 'DI3', forecastImpact: 18_500_000 },
    'M-014': { diLevel: 'DI1', forecastImpact: 6_500_000 },
    'M-015': { diLevel: 'DI3', forecastImpact: 24_000_000 },
    'M-016': { diLevel: 'DI1', forecastImpact: 5_800_000 },
    'M-017': { diLevel: 'DI4', forecastImpact: 14_000_000 },
    'M-018': { diLevel: 'DI3', forecastImpact: 7_500_000 },
    'M-019': { diLevel: 'DI4', forecastImpact: 7_800_000 },
    'M-020': { diLevel: 'DI3', forecastImpact: 9_000_000 },
    'M-021': { diLevel: 'DI3', forecastImpact: 18_000_000 },
    'M-022': { diLevel: 'DI3', forecastImpact: 4_500_000 },
    'M-023': { diLevel: 'DI2', forecastImpact: 11_000_000 },
    'M-024': { diLevel: 'DI3', forecastImpact: 5_000_000 },
    'M-025': { diLevel: 'DI2', forecastImpact: 2_000_000 },
    'M-026': { diLevel: 'DI3', forecastImpact: 9_500_000 },
    'M-027': { diLevel: 'DI1', forecastImpact: 1_800_000 },
    'M-028': { diLevel: 'DI4', forecastImpact: 21_000_000 },
    'M-029': { diLevel: 'DI2', forecastImpact: 3_600_000 },
    'M-030': { diLevel: 'DI2', forecastImpact: 8_200_000 },
    'M-031': { diLevel: 'DI1', forecastImpact: 3_200_000 },
    'M-032': { diLevel: 'DI4', forecastImpact: 6_800_000 },
    'M-033': { diLevel: 'DI2', forecastImpact: 7_000_000 },
    'M-034': { diLevel: 'DI2', forecastImpact: 5_200_000 },
    'M-035': { diLevel: 'DI1', forecastImpact: 8_000_000, status: 'At Risk' },
    'M-036': { diLevel: 'DI4', forecastImpact: 16_500_000 },
    'M-037': { diLevel: 'DI3', forecastImpact: 11_000_000 },
    'M-039': { diLevel: 'DI2', forecastImpact: 5_500_000, status: 'At Risk' },
    'M-040': { diLevel: 'DI2', forecastImpact: 12_000_000 },
    'M-041': { diLevel: 'DI2', forecastImpact: 13_000_000 },
    'M-042': { diLevel: 'DI3', forecastImpact: 2_200_000 },
    'M-043': { diLevel: 'DI3', forecastImpact: 8_800_000 },
    'M-044': { diLevel: 'DI2', forecastImpact: 4_800_000 },
    'M-045': { diLevel: 'DI3', forecastImpact: 4_100_000 },
    'M-046': { diLevel: 'DI2', forecastImpact: 16_000_000 },
    'M-047': { diLevel: 'DI1', forecastImpact: 5_600_000 },
    'M-048': { diLevel: 'DI1', forecastImpact: 3_600_000 },
    'M-049': { diLevel: 'DI1', forecastImpact: 1_800_000 },
    'M-050': { diLevel: 'DI2', forecastImpact: 1_900_000 },
  },
}

export function getMeasureSnapshot(measureId: string, freezeId: string): FreezeMeasureSnapshot {
  const measure = measures.find(m => m.id === measureId)
  if (!measure) throw new Error(`Measure ${measureId} not found`)
  const base: FreezeMeasureSnapshot = {
    diLevel: measure.diLevel,
    status: measure.status,
    forecastImpact: measure.forecastImpact,
  }
  if (freezeId === LATEST_FREEZE_ID) return base
  const override = FREEZE_OVERRIDES[freezeId]?.[measureId] ?? {}
  return { ...base, ...override }
}

export function getFreezeTotalForecast(freezeId: string): number {
  return measures.reduce((sum, m) => sum + getMeasureSnapshot(m.id, freezeId).forecastImpact, 0)
}

export function getFreezePortfolioEvolution(): Array<{ label: string; forecast: number }> {
  return DATA_FREEZES.map(f => ({
    label: f.label,
    forecast: Math.round(getFreezeTotalForecast(f.id) / 1e6 * 10) / 10,
  }))
}

export function getDIProgressions(
  fromFreezeId: string,
  toFreezeId: string,
): Array<{ from: DILevel; to: DILevel; count: number }> {
  const transitions: Map<string, number> = new Map()
  for (const m of measures) {
    const prev = getMeasureSnapshot(m.id, fromFreezeId)
    const curr = getMeasureSnapshot(m.id, toFreezeId)
    if (prev.diLevel !== curr.diLevel) {
      const key = `${prev.diLevel}→${curr.diLevel}`
      transitions.set(key, (transitions.get(key) ?? 0) + 1)
    }
  }
  const result: Array<{ from: DILevel; to: DILevel; count: number }> = []
  transitions.forEach((count, key) => {
    const [from, to] = key.split('→') as [DILevel, DILevel]
    result.push({ from, to, count })
  })
  return result.sort((a, b) => a.from.localeCompare(b.from))
}

export function getPreviousFreezeId(freezeId: string): string | null {
  const idx = DATA_FREEZES.findIndex(f => f.id === freezeId)
  if (idx <= 0) return null
  return DATA_FREEZES[idx - 1].id
}
