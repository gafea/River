export type AssetEvent = {
  date: string // ISO date
  amount: number // positive for addition, negative for deduction
  description?: string
}

export type Asset = {
  id: string
  name: string
  description?: string
  photoDataUrl?: string
  purchaseValue: number
  expectedLifeWeeks: number
  purchaseDate: string // ISO date string
  tags: string[]
  terminalPrice?: number
  events?: AssetEvent[]
}
