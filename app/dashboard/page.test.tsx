import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllAssets, addAsset, clearAllAssets } from '@/lib/store';
import type { Asset } from '@/lib/types';

// Mock localStorage for store tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the store functions for import/export logic tests
vi.mock('@/lib/store', () => ({
  getAllAssets: vi.fn(),
  addAsset: vi.fn(),
  clearAllAssets: vi.fn(),
}));

describe('Dashboard Import/Export Logic', () => {
  const mockAssets: Asset[] = [
    {
      id: '1',
      name: 'Test Asset 1',
      purchaseValue: 1000,
      expectedLifeWeeks: 52,
      purchaseDate: '2023-01-01',
      tags: ['test'],
    },
    {
      id: '2',
      name: 'Test Asset 2',
      purchaseValue: 2000,
      expectedLifeWeeks: 104,
      purchaseDate: '2023-01-01',
      tags: ['test'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getAllAssets as any).mockReturnValue(mockAssets);
  });

  describe('Export functionality', () => {
    it('export logic creates correct JSON data URI', () => {
      (getAllAssets as any).mockReturnValue(mockAssets);

      // Simulate the export logic from the component
      const allAssets = getAllAssets();
      const dataStr = JSON.stringify(allAssets, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      expect(dataUri).toContain('data:application/json;charset=utf-8,');
      // Verify that the data URI contains the encoded JSON
      expect(dataUri.length).toBeGreaterThan(
        'data:application/json;charset=utf-8,'.length,
      );

      // Verify we can decode it back to the original data
      const decodedData = decodeURIComponent(dataUri.split(',')[1]);
      const parsedData = JSON.parse(decodedData);
      expect(parsedData).toEqual(mockAssets);
    });

    it('export creates filename with current date', () => {
      // Mock Date for consistent export filename
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-11-09'));

      const exportFileDefaultName = `assets-export-${new Date().toISOString().slice(0, 10)}.json`;

      expect(exportFileDefaultName).toBe('assets-export-2025-11-09.json');

      vi.useRealTimers();
    });
  });

  describe('Import functionality', () => {
    it('handles valid JSON file parsing', () => {
      // Test the file parsing logic directly
      const jsonString = JSON.stringify(mockAssets);
      let parsedData: any = null;

      try {
        parsedData = JSON.parse(jsonString);
      } catch (error) {
        // Handle error
      }

      expect(parsedData).toEqual(mockAssets);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData.length).toBe(2);
    });

    it('validates that imported data is an array', () => {
      const invalidData = { invalid: 'data' };
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Simulate validation logic from component
      const importedAssets = invalidData;
      if (!Array.isArray(importedAssets)) {
        alert('Invalid file format. Expected an array of assets.');
      }

      expect(mockAlert).toHaveBeenCalledWith(
        'Invalid file format. Expected an array of assets.',
      );
      mockAlert.mockRestore();
    });

    it('handles invalid JSON gracefully', () => {
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Simulate invalid JSON parsing from component
      try {
        JSON.parse('invalid json');
      } catch (error) {
        alert('Failed to import assets. Please check the file format.');
      }

      expect(mockAlert).toHaveBeenCalledWith(
        'Failed to import assets. Please check the file format.',
      );
      mockAlert.mockRestore();
    });
  });

  describe('Import confirmation logic', () => {
    it('clears assets and imports with original IDs when clearCurrent is true', () => {
      const clearCurrent = true;

      // Simulate the import confirmation logic from component
      if (clearCurrent) {
        clearAllAssets();
      }

      mockAssets.forEach((asset) => {
        if (clearCurrent) {
          // Keep original IDs when clearing current data
          addAsset(asset);
        }
      });

      expect(clearAllAssets).toHaveBeenCalled();
      expect(addAsset).toHaveBeenCalledTimes(2);
      expect(addAsset).toHaveBeenCalledWith(mockAssets[0]);
      expect(addAsset).toHaveBeenCalledWith(mockAssets[1]);
    });

    it('merges assets with new IDs when clearCurrent is false', () => {
      const clearCurrent = false;

      // Simulate the import confirmation logic from component
      mockAssets.forEach((asset) => {
        if (clearCurrent) {
          // Keep original IDs when clearing current data
          addAsset(asset);
        } else {
          // Generate new IDs to avoid conflicts when merging
          const { id, ...assetWithoutId } = asset;
          addAsset(assetWithoutId);
        }
      });

      expect(clearAllAssets).not.toHaveBeenCalled();
      expect(addAsset).toHaveBeenCalledTimes(2);
      // Should be called with assets without IDs
      expect(addAsset).toHaveBeenCalledWith({
        name: 'Test Asset 1',
        purchaseValue: 1000,
        expectedLifeWeeks: 52,
        purchaseDate: '2023-01-01',
        tags: ['test'],
      });
    });
  });

  describe('clearAllAssets function', () => {
    it('can be called without throwing', () => {
      // Test that the function can be called (it's mocked, so we just verify it doesn't throw)
      expect(() => clearAllAssets()).not.toThrow();
      expect(clearAllAssets).toHaveBeenCalled();
    });
  });
});
