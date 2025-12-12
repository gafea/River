'use client';

import { Asset } from './types';

const TAG_DEFAULTS_KEY = 'tags.v1';

export function getTags(): Record<string, number> {
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

function writeTags(data: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TAG_DEFAULTS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write tag defaults to storage', e);
  }
}

// In-memory cache for assets
let assetsCache: Asset[] = [];
let assetsPromise: Promise<Asset[]> | null = null;

export async function getAllAssets(): Promise<Asset[]> {
  if (assetsPromise) return assetsPromise;

  assetsPromise = (async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        if (data.assets && data.tags) {
          writeTags(data.tags);
          assetsCache = data.assets;
          return data.assets;
        }
        const list = Array.isArray(data) ? data : [];
        assetsCache = list;
        return list;
      } else if (res.status === 401) {
        return [];
      } else {
        throw new Error('Failed to fetch assets');
      }
    } catch (e) {
      console.error('Failed to fetch assets', e);
      return [];
    } finally {
      assetsPromise = null;
    }
  })();

  return assetsPromise;
}

export async function getAsset(id: string): Promise<Asset | null> {
  try {
    const res = await fetch(`/api/assets/${id}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch asset', e);
    return null;
  }
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<Asset> {
  setTagDefault(asset.tag, asset.expectedLifeWeeks);
  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset),
  });
  if (res.ok) {
    const newAsset = await res.json();
    assetsCache.push(newAsset);
    return newAsset;
  } else {
    throw new Error('Failed to create asset');
  }
}

export async function updateAsset(updated: Asset) {
  setTagDefault(updated.tag, updated.expectedLifeWeeks);
  const res = await fetch(`/api/assets/${updated.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });
  if (!res.ok) {
    throw new Error('Failed to update asset');
  }
  // Update cache
  assetsCache = assetsCache.map((a) => (a.id === updated.id ? updated : a));
}

export async function deleteAsset(id: string) {
  const res = await fetch(`/api/assets/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to delete asset');
  }
  // Update cache
  assetsCache = assetsCache.filter((a) => a.id !== id);
}

export async function clearAllAssets() {
  const res = await fetch('/api/assets', {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('Failed to clear assets');
  }
  assetsCache = [];
}

export function clearAllUserData() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(TAG_DEFAULTS_KEY);
    } catch (e) {
      console.warn('Failed to clear user data', e);
    }
  }
  assetsCache = [];
}

export function setTagDefault(tag: string, weeks: number) {
  if (!tag || weeks <= 0) return;
  const defaults = getTags();
  defaults[tag] = weeks;
  writeTags(defaults);

  // Sync with server
  fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(defaults),
  }).catch((e) => console.warn('Failed to sync tag defaults', e));
}
