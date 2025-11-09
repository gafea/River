import { describe, it, expect, vi } from 'vitest'
import { calculateCurrentValue, groupAssetsByTag, weeksBetween } from './utils'
import type { Asset } from './types'

describe('utils', () => {
  it('calculates linear depreciation to zero', () => {
    const a: Asset = {
      id: '1',
      name: 'Test',
      purchaseValue: 1000,
      expectedLifeWeeks: 260, // ~5 years
      purchaseDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString(),
      tags: []
    }
    const val = calculateCurrentValue(a, new Date())
    expect(val).toBeGreaterThan(0)
    expect(val).toBeLessThan(1000)
  })

  it('groups by tags and includes untagged', () => {
    const assets: Asset[] = [
      { id: 'a', name: 'A', purchaseValue: 100, expectedLifeWeeks: 52, purchaseDate: new Date().toISOString(), tags: ['X'] },
      { id: 'b', name: 'B', purchaseValue: 100, expectedLifeWeeks: 52, purchaseDate: new Date().toISOString(), tags: [] }
    ]
    const grouped = groupAssetsByTag(assets)
    expect(grouped['X'].length).toBe(1)
    expect(grouped['Untagged'].length).toBe(1)
  })

  it('weeksBetween is non-negative', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(weeksBetween(future.toISOString())).toBe(0)
  })
})
