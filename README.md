# River - Asset Management System

A modern web application for tracking and managing depreciating assets with real-time value updates, interactive charts, and comprehensive event management.

## Features

### 🏷️ Asset Tracking

- Track assets with purchase value, expected lifespan, and depreciation calculations
- Automatic linear depreciation calculations
- Real-time current value updates every minute
- Support for terminal values (assets that retain value after depreciation)

### 📊 Interactive Charts

- Visual depreciation charts with customizable time ranges
- Event reference lines showing upgrades, repairs, and maintenance
- Multi-line labels for better readability
- Progress bars showing asset lifetime completion

### 🎯 Event Management

- Record asset events (upgrades, repairs, maintenance)
- Events affect depreciation calculations and total invested amounts
- Chronological event sorting with visual indicators
- Positive amounts display with "+" prefix

### 🏷️ Tag System

- Organize assets with customizable tags
- Filter and group assets by tags
- Tag-based analytics and reporting

### 💾 Data Management

- Import/export asset data as JSON
- Local storage persistence
- Data validation and error handling

### 🎨 Modern UI

- Built with Fluent UI components
- Responsive design for all screen sizes
- Dark/light theme support
- Intuitive navigation and user experience

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **UI Library:** Fluent UI React Components
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library
- **Styling:** CSS Modules
- **Package Manager:** npm

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd tag
```

2. Install dependencies:

```bash
npm install
npm run db:setup
```

3. Copy `.env.example` to `.env` (or `.env.local`) and set `APP_BASE_URL` / `PORT` to match the domain + port you want to use. The defaults keep the app on `http://localhost:3000`.

4. Start the development server:

```bash
npm run dev
```

  The dev script loads the same `.env*` files as Next.js itself, so it honors your `PORT`/`APP_BASE_URL` settings automatically.

5. Open the URL you configured in `APP_BASE_URL` (for example [http://localhost:3000](http://localhost:3000)).

### Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

### Code Formatting

Format all files:

```bash
npm run format
```

## Project Structure

```
tag/
├── app/                    # Next.js App Router pages
│   ├── assets/            # Asset detail pages
│   ├── dashboard/         # Main dashboard
│   ├── search/            # Search functionality
│   ├── edit/              # Asset editing
│   └── new/               # New asset creation
├── src/
│   ├── components/        # React components
│   │   ├── AssetCard.tsx  # Asset display card
│   │   ├── AssetForm.tsx  # Asset creation/editing form
│   │   ├── Navigation.tsx # App navigation
│   │   └── Providers.tsx  # Context providers
│   └── lib/               # Utility functions and types
│       ├── store.ts       # Local storage management
│       ├── types.ts       # TypeScript type definitions
│       └── utils.ts       # Calculation utilities
├── public/                # Static assets
└── tests/                 # Test files
```

## Key Components

### AssetCard

Displays asset information with:

- Current value (auto-updates every minute)
- Depreciation progress bar
- Lifetime percentage
- Daily depreciation rate
- Photo support
- Click navigation to detail view

### AssetForm

Comprehensive form for creating and editing assets:

- Basic information (name, description, value)
- Depreciation settings (expected life, terminal value)
- Tag management
- Photo upload
- Event tracking

### Dashboard

Main application view featuring:

- Asset overview cards
- Import/export functionality
- Search and filtering
- Tag-based organization

## Calculation Logic

### Depreciation

Assets depreciate linearly over their expected lifespan:

```
daily_depreciation = (purchase_value - terminal_value) / (expected_life_weeks * 7)
current_value = purchase_value - (daily_depreciation * days_passed)
```

### Events

Asset events modify the total invested amount:

```
total_invested = purchase_value + Σ(event_amounts)
```

Events also affect depreciation calculations by changing the asset's effective value over time.

## API Reference

### Utility Functions

#### `calculateCurrentValue(asset, events?, currentDate?)`

Calculates the current depreciated value of an asset.

#### `calculateTotalInvested(asset)`

Returns total amount invested including all events.

#### `calculateDailyDepreciation(asset)`

Returns daily depreciation rate.

#### `formatCurrency(amount)`

Formats numbers as currency strings.

#### `weeksBetween(startDate, endDate)`

Calculates weeks between two dates.

### Data Types

```typescript
interface Asset {
  id: string;
  name: string;
  description?: string;
  purchaseValue: number;
  expectedLifeWeeks: number;
  purchaseDate: string;
  tags: string[];
  terminalValue?: number;
  photoDataUrl?: string;
  events?: AssetEvent[];
}

interface AssetEvent {
  date: string;
  amount: number;
  description: string;
}
```

## Future Enhancements

- Server persistence (REST or tRPC)
- Authentication & multi-user separation
- Advanced depreciation methods (declining balance, units of production)
- Asset categories and custom fields
- Maintenance scheduling and cost tracking
- Reporting and analytics dashboard
- Better photo storage (object storage / CDN)
- Mobile app companion
- API endpoints for integrations
