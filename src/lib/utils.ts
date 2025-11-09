import { Asset } from './types'

export function weeksBetween(startISO: string, end: Date = new Date()): number {
  const start = new Date(startISO)
  const ms = end.getTime() - start.getTime()
  const weeks = ms / (1000 * 60 * 60 * 24 * 7)
  return Math.max(0, weeks)
}

export function calculateCurrentValue(asset: Asset, asOf: Date = new Date()): number {
  const ageWeeks = weeksBetween(asset.purchaseDate, asOf)
  const terminal = asset.terminalPrice ?? 0
  const depPerWeek = asset.expectedLifeWeeks > 0 ? (asset.purchaseValue - terminal) / asset.expectedLifeWeeks : 0
  const depreciation = depPerWeek * Math.min(ageWeeks, asset.expectedLifeWeeks)
  let current = asset.purchaseValue - depreciation
  if (ageWeeks >= asset.expectedLifeWeeks) {
    current = terminal
  }

  // Add events with depreciation
  if (asset.events) {
    for (const event of asset.events) {
      const eventDate = new Date(event.date)
      if (eventDate <= asOf) {
        const eventAgeWeeks = weeksBetween(event.date, asOf)
        // All events depreciate over the remaining life of the asset from when they were added
        const remainingWeeksAtEvent = Math.max(0, asset.expectedLifeWeeks - weeksBetween(asset.purchaseDate, eventDate))
        const eventDepPerWeek = remainingWeeksAtEvent > 0 ? event.amount / remainingWeeksAtEvent : 0
        const eventDepreciation = eventDepPerWeek * Math.min(eventAgeWeeks, remainingWeeksAtEvent)
        const currentEventValue = event.amount - eventDepreciation
        current += currentEventValue
      }
    }
  }

  // Round to 2 decimals for display stability
  return Math.round(Math.max(terminal, current) * 100) / 100
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
