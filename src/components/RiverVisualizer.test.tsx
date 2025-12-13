import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RiverVisualizer } from './RiverVisualizer';
import type { Asset, IncomeSource } from '@/lib/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatCurrency: (val: number) => `$${val}`,
  calculateDailyDepreciation: () => 10,
  calculateCurrentValue: () => 500,
  weeksBetween: () => 5,
}));

// Mock UIContext
vi.mock('./UIContext', () => ({
  useUI: () => ({
    triggerTransition: vi.fn(),
  }),
}));

describe('RiverVisualizer', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      value: 800,
    });
  });

  const mockAssets: Asset[] = [
    {
      id: '1',
      name: 'Test Asset',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: '2025-01-01',
      tag: 'test',
      isSold: false,
    },
  ];

  const mockSources: IncomeSource[] = [
    {
      id: 's1',
      name: 'Job',
      type: 'FIXED',
      amount: 5000,
    },
  ];

  it('renders without crashing', () => {
    render(
      <RiverVisualizer
        assets={mockAssets}
        sources={mockSources}
        entries={[]}
        onUpdateSource={() => {}}
      />,
    );
    expect(
      screen.getByText(
        new Date().toLocaleDateString('default', {
          month: 'long',
          year: 'numeric',
        }),
      ),
    ).toBeDefined();
  });

  it('renders assets', () => {
    render(
      <RiverVisualizer
        assets={mockAssets}
        sources={mockSources}
        entries={[]}
        onUpdateSource={() => {}}
      />,
    );
    expect(screen.getAllByText('Test Asset')).toBeDefined();
  });
});
