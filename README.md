# River (Next.js + Fluent UI)

A comprehensive client-side asset management dashboard demonstrating modern web development practices with advanced depreciation tracking, event-based accounting, and interactive data visualization.

**Key Capabilities:**

- Complete asset lifecycle management (CRUD operations)
- Advanced linear depreciation with terminal values
- Event tracking for additional investments and expenses
- Interactive charts showing value depreciation over time
- Real-time search and tag-based filtering
- Photo attachment support
- Comprehensive test coverage

## Features

| Feature                               | Status           |
| ------------------------------------- | ---------------- |
| Add new asset with details & photo    | ✅               |
| Dashboard grid of cards               | ✅               |
| Tag filter                            | ✅ (via sidebar) |
| Linear depreciation (straight-line)   | ✅               |
| Edit / Delete actions                 | ✅               |
| Asset detail pages with charts        | ✅               |
| Search & filtering                    | ✅               |
| Terminal value (salvage price)        | ✅               |
| Event tracking (investments/expenses) | ✅               |
| Photo attachments (base64)            | ✅               |
| Comprehensive test suite              | ✅ (20 tests)    |

## Advanced Features

- **Depreciation Charts**: Interactive line charts showing asset value over time with proper year-based X-axis
- **Event System**: Track additional investments and expenses that depreciate over remaining asset life
- **Terminal Value**: Assets depreciate to a minimum salvage/residual value instead of $0
- **Search Functionality**: Real-time search and filtering across asset names, descriptions, and tags
- **Responsive Design**: Mobile-friendly interface using Fluent UI components
- **Data Persistence**: Client-side localStorage with error handling and demo data seeding

## Data Model

### Asset

```typescript
Asset {
  id: string
  name: string
  description?: string
  photoDataUrl?: string (base64)
  purchaseValue: number
  expectedLifeWeeks: number
  purchaseDate: string (ISO date: yyyy-mm-dd)
  tags: string[]
  terminalPrice?: number (salvage/residual value)
  events?: AssetEvent[] (additional investments/expenses)
}
```

### AssetEvent

```typescript
AssetEvent {
  date: string (ISO date)
  amount: number (positive for additions, negative for deductions)
  description?: string
}
```

## Depreciation Formulas

### Linear Depreciation (Straight-Line Method)

**Asset Depreciation:**

- Weekly depreciation rate = (Purchase Value - Terminal Value) / Expected Life (weeks)
- Total depreciation = Rate × min(Age in weeks, Expected Life)
- Current value = Purchase Value - Total Depreciation
- When Age ≥ Expected Life: Current value = Terminal Value

**Event Depreciation:**

- Events (additional investments/expenses) depreciate over the remaining asset life from when they were added
- Event weekly rate = Event Amount / Remaining Weeks at Event Date
- Event depreciation = Rate × min(Event Age, Remaining Weeks)
- Current event value = Event Amount - Event Depreciation

**Total Current Value:**
Current Value = Asset Value + Σ(Current Event Values)

**Daily Depreciation Rate:**

- Asset daily rate = (Purchase Value - Terminal Value) / (Expected Life × 7)
- Event daily rate = Event Weekly Rate / 7
- Total daily depreciation = Σ(All daily rates)

### Key Features

- **Terminal Value**: Assets depreciate to a minimum salvage/residual value instead of $0
- **Event Tracking**: Additional investments and expenses are tracked and depreciated separately
- **Time-based Calculations**: All calculations use precise date differences in weeks
- **Currency Formatting**: Localized currency display with proper rounding

## Getting Started

```bash
pnpm install # or npm install / yarn
pnpm dev
```

Then open http://localhost:3000

## Technical Architecture

- **Frontend**: Next.js 16 with App Router and TypeScript
- **UI Framework**: Microsoft Fluent UI v9 components
- **Charts**: Recharts for interactive data visualization
- **Persistence**: Browser localStorage with JSON serialization
- **Testing**: Vitest with React Testing Library and jsdom
- **Styling**: CSS variables with Fluent UI theming
- **Date Handling**: Native JavaScript Date objects with ISO string storage
- **Image Storage**: Base64 encoded data URLs for client-side storage

## Calculation Engine

The depreciation engine handles complex scenarios:

- **Multi-event depreciation**: Each investment/expense depreciates independently
- **Terminal value handling**: Assets never depreciate below salvage value
- **Time-based precision**: Weekly calculations with daily rate conversions
- **Chart data generation**: Efficient weekly sampling for smooth curves
- **Currency stability**: Consistent rounding to prevent display jitter

## Future Enhancements

- Server persistence (REST or tRPC)
- Authentication & multi-user separation
- Bulk import/export (CSV, JSON)
- Advanced depreciation methods (declining balance, units of production)
- Asset categories and custom fields
- Maintenance scheduling and cost tracking
- Reporting and analytics dashboard
- Better photo storage (object storage / CDN)
- Mobile app companion
- API endpoints for integrations
