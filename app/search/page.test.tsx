import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SearchPage from './page';
import { getAllAssets } from '@/lib/store';
import { calculateCurrentValue } from '@/lib/utils';

// Mock dependencies
const mockSearchParams = {
  get: vi.fn((key) => (key === 'q' ? '' : null)),
  toString: vi.fn(() => ''),
};

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => mockSearchParams),
}));

vi.mock('@/lib/store', () => ({
  getAllAssets: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  calculateCurrentValue: vi.fn(),
}));

vi.mock('@/components/AssetCard', () => ({
  default: ({ asset }: { asset: any }) => (
    <div data-testid="asset-card">{asset.name}</div>
  ),
}));

// Mock Fluent UI Input to ensure fireEvent.change works reliably
vi.mock('@fluentui/react-components', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Input: ({ onChange, value, placeholder, ...props }: any) => (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e, { value: e.target.value })}
        {...props}
      />
    ),
  };
});

describe('SearchPage', () => {
  const mockAssets = [
    { id: '1', name: 'Laptop', description: 'Work laptop', tags: [] },
    { id: '2', name: 'Phone', description: 'Personal phone', tags: [] },
    { id: '3', name: 'Monitor', description: 'Office monitor', tags: [] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getAllAssets as any).mockResolvedValue(mockAssets);
    (calculateCurrentValue as any).mockReturnValue(100);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders search input', async () => {
    await act(async () => {
      render(<SearchPage />);
    });
    expect(screen.getByPlaceholderText(/Search by asset name/i)).toBeTruthy();
  });

  it('loads assets on mount', async () => {
    await act(async () => {
      render(<SearchPage />);
    });
    expect(getAllAssets).toHaveBeenCalled();
  });

  it('filters assets based on search term', async () => {
    await act(async () => {
      render(<SearchPage />);
    });

    const input = screen.getByPlaceholderText(/Search by asset name/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Laptop' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Found 1 asset.*matching "Laptop"/)).toBeTruthy();
    });
    
    expect(screen.getByText('Laptop')).toBeTruthy();
    expect(screen.queryByText('Phone')).toBeNull();
  });

  it('shows no results message when no matches found', async () => {
    await act(async () => {
      render(<SearchPage />);
    });

    const input = screen.getByPlaceholderText(/Search by asset name/i);
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'NonExistent' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/No assets found matching "NonExistent"/)).toBeTruthy();
    });
  });

  it('shows initial state message when search is empty', async () => {
    await act(async () => {
      render(<SearchPage />);
    });
    expect(screen.getByText('Enter a search term to find assets')).toBeTruthy();
  });
});
