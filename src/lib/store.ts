"use client"

import { Asset } from './types'

const STORAGE_KEY = 'assets.v1'
const INITIALIZED_KEY = 'assets.initialized'

function read(): Asset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Asset[]
  } catch (e) {
    console.warn('Failed to read assets from storage', e)
    return []
  }
}

function write(data: Asset[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to write assets to storage', e)
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw e
    }
  }
}

function isInitialized(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(INITIALIZED_KEY) === 'true'
}

function markInitialized() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(INITIALIZED_KEY, 'true')
}

export function getAllAssets(): Asset[] {
  const data = read()
  
  // Only seed demo data if this is the first time ever (not initialized)
  if (data.length === 0 && !isInitialized()) {
    return seed()
  }
  
  return data
}

function seed(): Asset[] {
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const demo: Asset[] = [
    {
      id: crypto.randomUUID(),
      name: 'MacBook Pro 14"',
      description: 'Developer laptop',
      purchaseValue: 2400,
      expectedLifeWeeks: 208, // ~4 years
      purchaseDate: iso(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())),
      tags: ['IT', 'Laptop']
    },
    {
      id: crypto.randomUUID(),
      name: 'Office Chair',
      description: 'Ergonomic chair',
      purchaseValue: 350,
      expectedLifeWeeks: 312, // ~6 years
      purchaseDate: iso(new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())),
      tags: ['Furniture']
    }
  ]
  write(demo)
  markInitialized() // Mark that we've initialized with demo data
  return demo
}

export function addAsset(asset: Omit<Asset, 'id'>): Asset {
  // Mark as initialized when first asset is added
  if (!isInitialized()) {
    markInitialized()
  }
  
  const all = getAllAssets()
  const newAsset: Asset = { ...asset, id: crypto.randomUUID() }
  write([newAsset, ...all])
  return newAsset
}

export function updateAsset(updated: Asset) {
  const all = getAllAssets()
  write(all.map(a => (a.id === updated.id ? updated : a)))
}

export function deleteAsset(id: string) {
  const all = getAllAssets()
  write(all.filter(a => a.id !== id))
}
