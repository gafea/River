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

export function getAllAssets(): Asset[] {
  const data = read();

  // Only seed demo data if this is the first time ever (not initialized)
  if (data.length === 0 && !isInitialized()) {
    return seed();
  }

  return data;
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

export function addAsset(asset: Omit<Asset, 'id'>): Asset {
  // Mark as initialized when first asset is added
  if (!isInitialized()) {
    markInitialized();
  }

  const all = getAllAssets();
  const newAsset: Asset = { ...asset, id: crypto.randomUUID() };
  write([newAsset, ...all]);
  return newAsset;
}

export function updateAsset(updated: Asset) {
  const all = getAllAssets();
  write(all.map((a) => (a.id === updated.id ? updated : a)));
}

export function deleteAsset(id: string) {
  const all = getAllAssets();
  write(all.filter((a) => a.id !== id));
}

export function clearAllAssets() {
  write([]);
}

export function getTagDefaults(): Record<string, number> {
  return readTagDefaults();
}

export function setTagDefault(tag: string, expectedLifeWeeks: number) {
  const defaults = readTagDefaults();
  defaults[tag] = expectedLifeWeeks;
  writeTagDefaults(defaults);
}

export function removeTagDefault(tag: string) {
  const defaults = readTagDefaults();
  delete defaults[tag];
  writeTagDefaults(defaults);
}
