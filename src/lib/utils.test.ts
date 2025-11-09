import { describe, it, expect, vi } from 'vitest';
import { calculateCurrentValue, groupAssetsByTag, weeksBetween } from './utils';
import type { Asset } from './types';

describe('utils', () => {
  it('calculates linear depreciation to zero', () => {
    const a: Asset = {
      id: '1',
      name: 'Test',
      purchaseValue: 1000,
      expectedLifeWeeks: 260, // ~5 years
      purchaseDate: new Date(
        new Date().setFullYear(new Date().getFullYear() - 2),
      ).toISOString(),
      tags: [],
    };
    const val = calculateCurrentValue(a, new Date());
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(1000);
  });

  it('groups by tags and includes untagged', () => {
    const assets: Asset[] = [
      {
        id: 'a',
        name: 'A',
        purchaseValue: 100,
        expectedLifeWeeks: 52,
        purchaseDate: new Date().toISOString(),
        tags: ['X'],
      },
      {
        id: 'b',
        name: 'B',
        purchaseValue: 100,
        expectedLifeWeeks: 52,
        purchaseDate: new Date().toISOString(),
        tags: [],
      },
    ];
    const grouped = groupAssetsByTag(assets);
    expect(grouped['X'].length).toBe(1);
    expect(grouped['Untagged'].length).toBe(1);
  });

  it('calculates with terminal price', () => {
    const a: Asset = {
      id: '1',
      name: 'Test',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: new Date(
        new Date().setFullYear(new Date().getFullYear() - 1),
      ).toISOString(),
      tags: [],
      terminalPrice: 100,
    };
    const val = calculateCurrentValue(a, new Date());
    expect(val).toBe(100); // At end of life, should be terminal price
  });

  it('includes events in value', () => {
    const a: Asset = {
      id: '1',
      name: 'Test',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: new Date().toISOString(),
      tags: [],
      events: [{ date: new Date().toISOString(), amount: 50 }],
    };
    const val = calculateCurrentValue(a);
    expect(val).toBe(1050);
  });

  it('handles negative events correctly', () => {
    const a: Asset = {
      id: '1',
      name: 'Test',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: new Date().toISOString(),
      tags: [],
      events: [{ date: new Date().toISOString(), amount: -200 }], // Repair cost
    };
    const val = calculateCurrentValue(a);
    // Negative event depreciates over remaining 52 weeks
    // Event age = 0, so no depreciation yet
    // Current = 1000 + (-200 - 0) = 800
    expect(val).toBe(800);
  });

  it('depreciates events over time', () => {
    // Asset: $1000, 9 weeks life, $100 terminal
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - 6 * 7); // 6 weeks ago

    const eventDate = new Date(); // Today (week 6)

    const a: Asset = {
      id: '1',
      name: 'Test Asset',
      purchaseValue: 1000,
      expectedLifeWeeks: 9,
      purchaseDate: purchaseDate.toISOString(),
      terminalPrice: 100,
      tags: [],
      events: [{ date: eventDate.toISOString(), amount: 500 }],
    };

    const val = calculateCurrentValue(a);
    // Asset depreciation: 100 * 6 = 600, so 1000 - 600 = 400
    // Event added at week 6, remaining life = 9 - 6 = 3 weeks
    // Event depreciation rate = 500 / 3 ≈ 166.67 per week
    // Event age = 0 weeks, so depreciation = 0
    // Event value = 500 - 0 = 500
    // Total: 400 + 500 = 900
    expect(val).toBe(900);
  });
});
