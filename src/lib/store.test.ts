import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  clearAllAssets,
} from './store';

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
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('returns empty array when API returns empty', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ assets: [], tags: {} }),
    });
    const assets = await getAllAssets();
    expect(assets).toEqual([]);
  });

  it('returns assets from API', async () => {
    const mockAssets = [{ id: '1', name: 'Test', tag: 'test' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ assets: mockAssets, tags: {} }),
    });
    const assets = await getAllAssets();
    expect(assets).toEqual(mockAssets);
  });

  it('saves new asset via API', async () => {
    const newAsset = { name: 'New', tag: 'test', expectedLifeWeeks: 10 };
    const createdAsset = { ...newAsset, id: '123' };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/assets') {
        return Promise.resolve({
          ok: true,
          json: async () => createdAsset,
        });
      }
      if (url === '/api/tags') {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject();
    });

    const result = await addAsset(newAsset as any);
    expect(result).toEqual(createdAsset);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assets',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newAsset),
      }),
    );
  });

  it('updates existing asset via API', async () => {
    const updatedAsset = {
      id: '1',
      name: 'Updated',
      tag: 'test',
      expectedLifeWeeks: 10,
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/assets/1')) {
        return Promise.resolve({
          ok: true,
          json: async () => updatedAsset,
        });
      }
      if (url === '/api/tags') {
        return Promise.resolve({ ok: true });
      }
      return Promise.reject();
    });

    await updateAsset(updatedAsset as any);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assets/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatedAsset),
      }),
    );
  });

  it('deletes asset via API', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });
    await deleteAsset('1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assets/1',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('clears all assets via API', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });
    await clearAllAssets();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/assets',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });
});
