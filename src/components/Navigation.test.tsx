import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Navigation from './Navigation';
import { getAllAssets } from '@/lib/store';
import { useAuth } from '@/components/AuthProvider';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  usePathname: vi.fn(() => '/dashboard'),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

vi.mock('@/lib/store', () => ({
  getAllAssets: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  groupAssetsByTag: vi.fn((assets) => ({
    IT: [assets[0]],
    Office: [assets[1]],
  })),
}));

vi.mock('@/components/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('Navigation', () => {
  const mockAssets = [
    { id: '1', name: 'Laptop', tags: ['IT'] },
    { id: '2', name: 'Chair', tags: ['Office'] },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (getAllAssets as any).mockResolvedValue(mockAssets);
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      logout: vi.fn(),
    });
  });

  it('renders navigation items when authenticated', async () => {
    await act(async () => {
      render(<Navigation />);
    });

    expect(screen.getByText('River')).toBeTruthy();
    expect(screen.getByText('New Asset')).toBeTruthy();
    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByText('Logout')).toBeTruthy();
  });

  it('renders authenticate button when not authenticated', async () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    await act(async () => {
      render(<Navigation />);
    });

    expect(screen.getByText('Authenticate')).toBeTruthy();
    expect(screen.queryByText('New Asset')).toBeNull();
  });

  it('renders tags', async () => {
    await act(async () => {
      render(<Navigation />);
    });

    expect(screen.getByText('IT (1)')).toBeTruthy();
    expect(screen.getByText('Office (1)')).toBeTruthy();
  });

  it('navigates to new asset page', async () => {
    await act(async () => {
      render(<Navigation />);
    });

    fireEvent.click(screen.getByText('New Asset'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard?new=1');
  });

  it('navigates to search page', async () => {
    await act(async () => {
      render(<Navigation />);
    });

    fireEvent.click(screen.getByText('Search'));
    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('navigates to tag filter', async () => {
    await act(async () => {
      render(<Navigation />);
    });

    fireEvent.click(screen.getByText('IT (1)'));
    // The mock implementation of groupAssetsByTag returns mocked data,
    // but the click handler constructs the URL based on the tag name.
    // We need to check if push was called with the correct URL.
    // Note: URLSearchParams might encode characters, so we check for containment or exact match if simple.
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard?tag=IT'),
    );
  });

  it('calls logout when logout button clicked', async () => {
    const logoutMock = vi.fn();
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      logout: logoutMock,
    });

    await act(async () => {
      render(<Navigation />);
    });

    fireEvent.click(screen.getByText('Logout'));
    expect(logoutMock).toHaveBeenCalled();
  });
});
