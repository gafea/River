'use client';

import { Asset } from './types';

const STORAGE_KEY = 'assets.v1';
const INITIALIZED_KEY = 'assets.initialized';
const TAG_DEFAULTS_KEY = 'tagDefaults.v1';

function read(): Asset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Asset[];
  } catch (e) {
    console.warn('Failed to read assets from storage', e);
    return [];
  }
}

function readTagDefaults(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TAG_DEFAULTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch (e) {
    console.warn('Failed to read tag defaults from storage', e);
    return {};
  }
}

function writeTagDefaults(data: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TAG_DEFAULTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write tag defaults to storage', e);
  }
}

function write(data: Asset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write assets to storage', e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw e;
    }
  }
}

function isInitialized(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(INITIALIZED_KEY) === 'true';
}

function markInitialized() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INITIALIZED_KEY, 'true');
}

export async function getAllAssets(): Promise<Asset[]> {
  try {
    const res = await fetch('/api/assets');
    if (res.ok) {
      return res.json();
    } else if (res.status === 401) {
      // Not authenticated, return empty
      return [];
    } else {
      throw new Error('Failed to fetch assets');
    }
  } catch (e) {
    console.warn(
      'Failed to fetch assets from API, falling back to localStorage',
      e,
    );
    // Fallback to localStorage
    const data = read();
    if (data.length === 0 && !isInitialized()) {
      return seed();
    }
    return data;
  }
}

function seed(): Asset[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const demo: Asset[] = [
    {
      id: crypto.randomUUID(),
      name: 'Dell Inspiron 5477',
      description: '',
      purchaseValue: 8299,
      expectedLifeWeeks: 626,
      purchaseDate: iso(new Date(2018, 7 - 1, 11)),
      tags: ['PC'],
    },
    {
      id: crypto.randomUUID(),
      name: 'iPhone 16 Pro',
      description: '',
      purchaseValue: 7721,
      expectedLifeWeeks: 260,
      purchaseDate: iso(new Date(2025, 9 - 1, 11)),
      tags: ['iPhone'],
    },
  ];
  write(demo);
  markInitialized(); // Mark that we've initialized with demo data
  return demo;
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  try {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
    if (res.ok) {
      return res.json();
    } else {
      throw new Error('Failed to create asset');
    }
  } catch (e) {
    console.warn(
      'Failed to add asset via API, falling back to localStorage',
      e,
    );
    // Fallback
    if (!isInitialized()) {
      markInitialized();
    }
    const all = read();
    const newAsset: Asset = { ...asset, id: crypto.randomUUID() };
    write([newAsset, ...all]);
    return newAsset;
  }
}

export async function updateAsset(updated: Asset) {
  try {
    const res = await fetch(`/api/assets/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if (!res.ok) {
      throw new Error('Failed to update asset');
    }
  } catch (e) {
    console.warn('Failed to update asset via API', e);
    // Fallback
    const all = read();
    write(all.map((a) => (a.id === updated.id ? updated : a)));
  }
}

export async function deleteAsset(id: string) {
  try {
    const res = await fetch(`/api/assets/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to delete asset');
    }
  } catch (e) {
    console.warn('Failed to delete asset via API', e);
    // Fallback
    const all = read();
    write(all.filter((a) => a.id !== id));
  }
}

export function clearAllAssets() {
  write([]);
}

export function clearAllUserData() {
  // Clear assets
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('assets.v1');
      window.localStorage.removeItem('assets.initialized');
      window.localStorage.removeItem('tagDefaults.v1');
    } catch (e) {
      console.warn('Failed to clear user data', e);
    }
  }
}

export function getTagDefaults(): Record<string, number> {
  return readTagDefaults();
}

