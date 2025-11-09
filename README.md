# Asset Manager (Next.js + Fluent UI)

A lightweight client-side asset management dashboard demonstrating:

- Next.js App Router (TypeScript)
- Microsoft Fluent UI v9 components
- LocalStorage persistence (no backend)
- Linear depreciation calculation (weeks)
- Tag-based grouping & filtering
- Image (base64) attachment

## Features

| Feature | Status |
|---------|--------|
| Add new asset with details & photo | ✅ |
| Dashboard grid of cards | ✅ (initial) |
| Tag filter | ✅ (via sidebar) |
| Linear depreciation (straight-line) | ✅ |
| Edit / Delete actions | ✅ |
| Tests for utils | ✅ |

## Data Model

```
Asset {
  id: string
  name: string
  description?: string
  photoDataUrl?: string (base64)
  purchaseValue: number
  expectedLifeWeeks: number
  purchaseDate: ISO Date (yyyy-mm-dd)
  tags: string[]
}
```

Current value = max(0, purchaseValue - (purchaseValue / expectedLifeWeeks) * ageWeeks)

## Getting Started

```bash
pnpm install # or npm install / yarn
pnpm dev
```

Then open http://localhost:3000

## Tests

```bash
pnpm test
```

## Future Enhancements

- Server persistence (REST or tRPC)
- Authentication & multi-user separation
- Bulk import/export (CSV)
- Charting depreciation curves
- Better photo storage (object storage / CDN)
- Accessibility & keyboard refinements
