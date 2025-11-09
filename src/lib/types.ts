export type Asset = {
  id: string
  name: string
  description?: string
  photoDataUrl?: string
  purchaseValue: number
  expectedLifeWeeks: number
  purchaseDate: string // ISO date string
  tags: string[]
}
