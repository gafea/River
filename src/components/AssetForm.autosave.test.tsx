import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import AssetForm from './AssetForm';
import type { Asset } from '@/lib/types';

// Mock store functions
vi.mock('@/lib/store', () => {
  return {
    addAsset: vi.fn(),
    updateAsset: vi.fn(),
    getTagDefaults: vi.fn(() => ({})),
    getAllAssets: vi.fn(() => Promise.resolve([])),
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { addAsset, updateAsset } from '@/lib/store';

function flushTimers() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000); // allow debounce (800ms) to finish
  });
}

describe('AssetForm autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates new asset automatically once required fields valid', async () => {
    (addAsset as any).mockResolvedValue({
      id: 'auto-id-1',
      name: 'Laptop',
      description: '',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: '2025-01-01',
      tag: '',
    } as Asset);

    render(<AssetForm onSaved={() => {}} />);

    const nameInput = screen.getByLabelText(/Name/i);
    const purchaseValueInput = screen.getByLabelText(/Purchase Value/i);

    act(() => {
      fireEvent.change(nameInput, { target: { value: 'Laptop' } });
      fireEvent.change(purchaseValueInput, { target: { value: '1000' } });
    });

    // Fast-forward debounce
    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(addAsset).toHaveBeenCalled();
  });

  it('updates existing asset automatically after changes', async () => {
    const existing: Asset = {
      id: 'existing-1',
      name: 'Phone',
      description: '',
      purchaseValue: 500,
      expectedLifeWeeks: 104,
      purchaseDate: '2025-01-01',
      tag: '',
    };

    render(<AssetForm asset={existing} />);

    const nameInput = screen.getByLabelText(/Name/i);

    act(() => {
      fireEvent.change(nameInput, { target: { value: 'Phone Pro' } });
      vi.advanceTimersByTime(900);
    });

    expect(updateAsset).toHaveBeenCalled();
  });
});
