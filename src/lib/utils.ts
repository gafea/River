import { Asset } from './types';

export function weeksBetween(startISO: string, end: Date = new Date()): number {
  const start = new Date(startISO);
  const ms = end.getTime() - start.getTime();
  const weeks = ms / (1000 * 60 * 60 * 24 * 7);
  return Math.max(0, weeks);
}

export function calculateCurrentValue(
  asset: Asset,
  asOf: Date = new Date(),
): number {
  const ageWeeks = weeksBetween(asset.purchaseDate, asOf);
  const terminal = asset.terminalPrice ?? 0;
  const depPerWeek =
    asset.expectedLifeWeeks > 0
      ? (asset.purchaseValue - terminal) / asset.expectedLifeWeeks
      : 0;
  const depreciation = depPerWeek * Math.min(ageWeeks, asset.expectedLifeWeeks);
  let current = asset.purchaseValue - depreciation;
  if (ageWeeks >= asset.expectedLifeWeeks) {
    current = terminal;
  }

  // Add events with depreciation
  if (asset.events) {
    for (const event of asset.events) {
      const eventDate = new Date(event.date);
      if (eventDate <= asOf) {
        const eventAgeWeeks = weeksBetween(event.date, asOf);
        // All events depreciate over the remaining life of the asset from when they were added
        const remainingWeeksAtEvent = Math.max(
          0,
          asset.expectedLifeWeeks - weeksBetween(asset.purchaseDate, eventDate),
        );
        const eventDepPerWeek =
          remainingWeeksAtEvent > 0 ? event.amount / remainingWeeksAtEvent : 0;
        const eventDepreciation =
          eventDepPerWeek * Math.min(eventAgeWeeks, remainingWeeksAtEvent);
        const currentEventValue = event.amount - eventDepreciation;
        current += currentEventValue;
      }
    }
  }

  // Round to 2 decimals for display stability
  return Math.round(Math.max(terminal, current) * 100) / 100;
}

export function groupAssetsByTag(assets: Asset[]): Record<string, Asset[]> {
  const grouped: Record<string, Asset[]> = {};
  for (const a of assets) {
    const tag = a.tag && a.tag.trim() ? a.tag.trim() : 'Untagged';
    if (!grouped[tag]) grouped[tag] = [];
    grouped[tag].push(a);
  }
  return grouped;
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  locale = 'en-US',
) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    value,
  );
}

export function calculateTotalInvested(asset: Asset): number {
  let total = asset.purchaseValue;
  if (asset.events) {
    for (const event of asset.events) {
      total += event.amount;
    }
  }
  return total;
}

export function calculateDailyDepreciation(
  asset: Asset,
  asOf: Date = new Date(),
): number {
  const ageWeeks = weeksBetween(asset.purchaseDate, asOf);
  const terminal = asset.terminalPrice ?? 0;

  // Daily depreciation of original asset
  const totalDays = asset.expectedLifeWeeks * 7;
  let dailyDep = 0;
  if (totalDays > 0 && ageWeeks < asset.expectedLifeWeeks) {
    dailyDep = (asset.purchaseValue - terminal) / totalDays;
  }

  // Add daily depreciation of events
  if (asset.events) {
    for (const event of asset.events) {
      const eventDate = new Date(event.date);
      if (eventDate <= asOf) {
        const eventAgeWeeks = weeksBetween(event.date, asOf);
        const remainingWeeksAtEvent = Math.max(
          0,
          asset.expectedLifeWeeks - weeksBetween(asset.purchaseDate, eventDate),
        );
        if (
          remainingWeeksAtEvent > 0 &&
          eventAgeWeeks < remainingWeeksAtEvent
        ) {
          const eventDepPerWeek = event.amount / remainingWeeksAtEvent;
          dailyDep += eventDepPerWeek / 7; // Convert to daily
        }
      }
    }
  }

  return Math.abs(dailyDep); // Return positive value for display
}
