import { Asset } from './types'

export function weeksBetween(startISO: string, end: Date = new Date()): number {
  const start = new Date(startISO)
  const ms = end.getTime() - start.getTime()
  const weeks = ms / (1000 * 60 * 60 * 24 * 7)
  return Math.max(0, weeks)
}

export function calculateCurrentValue(asset: Asset, asOf: Date = new Date()): number {
  const ageWeeks = weeksBetween(asset.purchaseDate, asOf)
  const depPerWeek = asset.expectedLifeWeeks > 0 ? asset.purchaseValue / asset.expectedLifeWeeks : asset.purchaseValue
  const depreciation = depPerWeek * ageWeeks
  const current = Math.max(0, asset.purchaseValue - depreciation)
  // Round to 2 decimals for display stability
  return Math.round(current * 100) / 100
}

export function groupAssetsByTag(assets: Asset[]): Record<string, Asset[]> {
  const grouped: Record<string, Asset[]> = {}
  for (const a of assets) {
    const tags = a.tags && a.tags.length > 0 ? a.tags : ['Untagged']
    for (const t of tags) {
      const key = t.trim()
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(a)
    }
  }
  return grouped
}

export function formatCurrency(value: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}
