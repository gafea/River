import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllAssets, addAsset, updateAsset, deleteAsset } from './store';
import type { Asset } from './types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('store', () => {
  beforeEach(() => {
    // Clear localStorage mocks
    vi.clearAllMocks();
  });

  it('returns empty array when no assets stored', () => {
    // Mock no assets and already initialized
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'assets.v1') return null;
      if (key === 'assets.initialized') return 'true';
      return null;
    });
    const assets = getAllAssets();
    expect(assets).toEqual([]);
  });

  it('returns stored assets', () => {
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Test Asset',
        purchaseValue: 1000,
        expectedLifeWeeks: 52,
        purchaseDate: '2023-01-01',
        tags: ['test'],
      },
    ];
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'assets.v1') return JSON.stringify(mockAssets);
      if (key === 'assets.initialized') return 'true';
      return null;
    });

    const assets = getAllAssets();
    expect(assets).toEqual(mockAssets);
    expect(assets[0].name).toBe('Test Asset');
  });

  it('saves new asset', () => {
    const newAssetData = {
      name: 'New Asset',
      purchaseValue: 500,
      expectedLifeWeeks: 26,
      purchaseDate: '2024-01-01',
      tags: ['electronics'],
    };

    addAsset(newAssetData);

    // Check that localStorage.setItem was called with the new asset
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'assets.v1',
      expect.stringContaining('"name":"New Asset"'),
    );
  });

  it('updates existing asset', () => {
    const existingAsset: Asset = {
      id: '1',
      name: 'Old Name',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: '2023-01-01',
      tags: ['old'],
    };

    const updatedAsset: Asset = {
      ...existingAsset,
      name: 'Updated Name',
      tags: ['updated'],
    };

    // Mock existing data
    localStorageMock.getItem.mockReturnValueOnce(
      JSON.stringify([existingAsset]),
    );

    updateAsset(updatedAsset);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'assets.v1',
      JSON.stringify([updatedAsset]),
    );
  });

  it('deletes asset by id', () => {
    const assets: Asset[] = [
      {
        id: '1',
        name: 'Asset 1',
        purchaseValue: 100,
        expectedLifeWeeks: 10,
        purchaseDate: '2023-01-01',
        tags: [],
      },
      {
        id: '2',
        name: 'Asset 2',
        purchaseValue: 200,
        expectedLifeWeeks: 20,
        purchaseDate: '2023-01-01',
        tags: [],
      },
    ];

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'assets.v1') return JSON.stringify(assets);
      if (key === 'assets.initialized') return 'true';
      return null;
    });

    deleteAsset('1');

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'assets.v1',
      JSON.stringify([assets[1]]), // Only asset with id '2' should remain
    );
  });

  it('handles deleting non-existent asset', () => {
    const assets: Asset[] = [
      {
        id: '1',
        name: 'Asset 1',
        purchaseValue: 100,
        expectedLifeWeeks: 10,
        purchaseDate: '2023-01-01',
        tags: [],
      },
    ];

    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'assets.v1') return JSON.stringify(assets);
      if (key === 'assets.initialized') return 'true';
      return null;
    });

    deleteAsset('999'); // Non-existent ID

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'assets.v1',
      JSON.stringify(assets), // Should remain unchanged
    );
  });

  it('handles malformed JSON gracefully', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'assets.v1') return 'invalid json';
      if (key === 'assets.initialized') return 'true';
      return null;
    });

    // Should not throw and return empty array
    expect(() => getAllAssets()).not.toThrow();
    expect(getAllAssets()).toEqual([]);
  });

  it('generates unique IDs for new assets', () => {
    const asset1Data = {
      name: 'Asset 1',
      purchaseValue: 100,
      expectedLifeWeeks: 10,
      purchaseDate: '2023-01-01',
      tags: [],
    };

    const asset2Data = {
      name: 'Asset 2',
      purchaseValue: 200,
      expectedLifeWeeks: 20,
      purchaseDate: '2023-01-01',
      tags: [],
    };

    const addedAsset1 = addAsset(asset1Data);
    const addedAsset2 = addAsset(asset2Data);

    expect(addedAsset1.id).not.toBe('');
    expect(addedAsset2.id).not.toBe('');
    expect(addedAsset1.id).not.toBe(addedAsset2.id);
  });
});
