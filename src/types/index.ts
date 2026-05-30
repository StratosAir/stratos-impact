export type DILevel = 'DI0' | 'DI1' | 'DI2' | 'DI3' | 'DI4' | 'DI5'
export type MeasureStatus = 'On Track' | 'Watch' | 'At Risk' | 'Completed' | 'Cancelled'
export type MeasureCategory = 'Revenue' | 'Cost' | 'Structural'
export type MeasureType = 'Sustainable' | 'One-Off'
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected'

export type PnLLine =
  | 'Passenger Revenue'
  | 'Cargo Revenue'
  | 'Ancillary Revenue'
  | 'Personnel Cost'
  | 'Fuel Cost'
  | 'Maintenance Cost'
  | 'Airport Charges'
  | 'Distribution Cost'
  | 'IT Cost'
  | 'External Services'
  | 'Other Operating Cost'

export interface Approval {
  type: 'DI2' | 'DI4'
  status: ApprovalStatus
  approver: string
  date: string | null
  comments: string
}

export interface Risk {
  id: string
  title: string
  description: string
  level: RiskLevel
  mitigationStatus: 'Open' | 'In Progress' | 'Mitigated'
  owner: string
}

export interface Assumption {
  id: string
  title: string
  description: string
  validatedBy: string
  validationDate: string | null
  status: 'Validated' | 'Pending' | 'Invalidated'
}

export interface ImpactMonth {
  month: string
  target: number
  forecast: number
  realized: number
}

export interface Measure {
  id: string
  title: string
  description: string
  businessUnit: string
  division: string
  program: string
  workstream: string
  owner: string
  sponsor: string
  diLevel: DILevel
  status: MeasureStatus
  category: MeasureCategory
  type: MeasureType
  pnlLine: PnLLine
  riskLevel: RiskLevel
  targetImpact: number
  forecastImpact: number
  realizedImpact: number
  fteTarget: number
  fteForecast: number
  fteRealized: number
  approvals: Approval[]
  risks: Risk[]
  assumptions: Assumption[]
  impactTimeline: ImpactMonth[]
  startDate: string
  targetDate: string
  lastUpdated: string
  tags: string[]
}

export interface KPISummary {
  targetImpact: number
  forecastImpact: number
  realizedImpact: number
  activeMeasures: number
  openDI2Approvals: number
  openDI4Approvals: number
  highRiskMeasures: number
}
