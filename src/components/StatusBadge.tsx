import type { MeasureStatus, RiskLevel, DILevel, ApprovalStatus } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: MeasureStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<MeasureStatus, string> = {
    'On Track': 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-emerald-200/30',
    'Watch': 'bg-amber-50 text-amber-700 border border-amber-200 ring-amber-200/30',
    'At Risk': 'bg-red-50 text-red-700 border border-red-200 ring-red-200/30',
    'Completed': 'bg-blue-50 text-blue-700 border border-blue-200 ring-blue-200/30',
    'Cancelled': 'bg-slate-100 text-slate-500 border border-slate-200',
  }

  const dot: Record<MeasureStatus, string> = {
    'On Track': 'bg-emerald-500',
    'Watch': 'bg-amber-500',
    'At Risk': 'bg-red-500',
    'Completed': 'bg-blue-500',
    'Cancelled': 'bg-slate-400',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', config[status], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot[status])} />
      {status}
    </span>
  )
}

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config: Record<RiskLevel, string> = {
    Low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    High: 'bg-red-50 text-red-700 border border-red-200',
    Critical: 'bg-red-100 text-red-800 border border-red-300 font-bold',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config[level], className)}>
      {level}
    </span>
  )
}

interface DIBadgeProps {
  level: DILevel
  className?: string
  size?: 'sm' | 'md'
}

export function DIBadge({ level, className, size = 'md' }: DIBadgeProps) {
  const colorMap: Record<DILevel, string> = {
    DI0: 'bg-slate-100 text-slate-600 border border-slate-200',
    DI1: 'bg-violet-50 text-violet-700 border border-violet-200',
    DI2: 'bg-blue-50 text-blue-700 border border-blue-200',
    DI3: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    DI4: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DI5: 'bg-teal-50 text-teal-700 border border-teal-200',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-semibold',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
        colorMap[level],
        className
      )}
    >
      {level}
    </span>
  )
}

interface ApprovalBadgeProps {
  status: ApprovalStatus
  className?: string
}

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  const config: Record<ApprovalStatus, string> = {
    Approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    Rejected: 'bg-red-50 text-red-700 border border-red-200',
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', config[status], className)}>
      {status}
    </span>
  )
}

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config: Record<string, string> = {
    Revenue: 'bg-blue-50 text-blue-700 border border-blue-200',
    Cost: 'bg-orange-50 text-orange-700 border border-orange-200',
    Structural: 'bg-purple-50 text-purple-700 border border-purple-200',
  }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', config[category] ?? 'bg-slate-100 text-slate-600 border border-slate-200', className)}>
      {category}
    </span>
  )
}
