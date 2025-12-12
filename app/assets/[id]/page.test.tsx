import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AssetDetailPage from './page';
import { getAsset } from '@/lib/store';
import { useUI } from '@/components/UIContext';

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useParams: () => ({ id: 'test-id' }),
}));

// Mock store
vi.mock('@/lib/store', () => ({
  getAsset: vi.fn(),
  deleteAsset: vi.fn(),
}));

// Mock UIContext
vi.mock('@/components/UIContext', () => ({
  useUI: vi.fn(),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  calculateCurrentValue: () => 500,
  formatCurrency: (val: number) => `$${val}`,
  weeksBetween: () => 10,
  calculateTotalInvested: () => 1000,
  calculateDailyDepreciation: () => 5,
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div>LineChart</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
}));

// Mock GooeyTitle
vi.mock('@/components/GooeyTitle', () => ({
  GooeyTitle: ({ text }: { text: string }) => <div>{text}</div>,
}));

describe('AssetDetailPage', () => {
  const mockAsset = {
    id: 'test-id',
    name: 'Test Asset',
    description: 'Test Description',
    purchaseValue: 1000,
    expectedLifeWeeks: 100,
    purchaseDate: '2023-01-01',
    tag: 'Test Tag',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUI as any).mockReturnValue({
      setPageLoading: vi.fn(),
      setShowTransitionOverlay: vi.fn(),
    });
  });

  it('renders loading state initially', () => {
    (getAsset as any).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AssetDetailPage />);
    const main = screen.getByRole('main');
    expect(main).toBeTruthy();
  });

  it('renders asset details after loading', async () => {
    (getAsset as any).mockResolvedValue(mockAsset);
    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Asset')).toBeTruthy();
    });

    expect(screen.getByText('Test Description')).toBeTruthy();
    expect(screen.getByText('$1000')).toBeTruthy();
    expect(screen.getByText('Test Tag')).toBeTruthy();
  });

  it('renders not found if asset is null', async () => {
    (getAsset as any).mockResolvedValue(null);
    render(<AssetDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Asset not found')).toBeTruthy();
    });
  });
});
