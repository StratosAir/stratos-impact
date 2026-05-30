import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(decimals)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `€${(value / 1_000).toFixed(decimals)}K`
  }
  return `€${value.toFixed(0)}`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value)
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function calcGap(target: number, forecast: number): number {
  return forecast - target
}

export function calcAchievement(realized: number, target: number): number {
  if (target === 0) return 0
  return Math.round((realized / target) * 100)
}
