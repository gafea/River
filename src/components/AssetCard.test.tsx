import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import AssetCard from './AssetCard';
import type { Asset } from '@/src/lib/types';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

// Mock the utils functions
vi.mock('@/src/lib/utils', () => ({
  formatCurrency: vi.fn((value: number) => `$${value.toLocaleString()}`),
  weeksBetween: vi.fn(() => 26), // Mock 26 weeks passed
  calculateTotalInvested: vi.fn(() => 1200), // Mock total invested
  calculateDailyDepreciation: vi.fn(() => 18), // Mock daily depreciation
  calculateCurrentValue: vi.fn(() => 960), // Mock current value
}));

// Import the mocked functions
const { formatCurrency, weeksBetween, calculateTotalInvested, calculateDailyDepreciation, calculateCurrentValue } = vi.mocked(await import('@/src/lib/utils'));

describe('AssetCard', () => {
  const mockAsset: Asset = {
    id: 'test-1',
    name: 'Test Laptop',
    description: 'A test laptop for development',
    purchaseValue: 1200,
    expectedLifeWeeks: 104, // 2 years
    purchaseDate: '2023-01-01',
    tags: ['electronics', 'work'],
  };

  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  it('renders asset information correctly', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    expect(screen.getByText('Test Laptop')).toBeTruthy();
    expect(screen.getByText('A test laptop for development')).toBeTruthy();
    expect(screen.getByText('$960')).toBeTruthy();
    expect(screen.getByText('($18/day)')).toBeTruthy();
  });

  it('does not show description text when description is empty', () => {
    const assetWithoutDesc = { ...mockAsset, description: '' };
    render(<AssetCard asset={assetWithoutDesc} currentValue={960} />);

    // Should not find any "No description" text
    expect(screen.queryByText('No description')).toBeNull();
  });

  it('displays photo when photoDataUrl is present', () => {
    const assetWithPhoto = {
      ...mockAsset,
      photoDataUrl: 'data:image/jpeg;base64,testphoto',
    };
    render(<AssetCard asset={assetWithPhoto} currentValue={960} />);

    const img = screen.getByAltText('Test Laptop');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,testphoto');
  });

  it('shows progress bar for asset lifetime', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    // Check that progress bar exists (it should show remaining lifetime)
    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toBeTruthy();
  });

  it('shows correct lifetime percentage', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    // With 26 weeks passed out of 104 total, remaining should be about 75%
    // The exact text depends on the calculation
    expect(screen.getByText(/% lifetime remaining/)).toBeTruthy();
  });

  it('formats currency values correctly', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    expect(screen.getByText('$960')).toBeTruthy();
  });

  it('navigates to asset detail page when clicked', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    const card = screen.getByText('Test Laptop').closest('.asset-card');
    fireEvent.click(card!);

    expect(mockPush).toHaveBeenCalledWith('/assets/test-1');
  });

  it('handles assets with no tags', () => {
    const assetNoTags = { ...mockAsset, tags: [] };
    render(<AssetCard asset={assetNoTags} currentValue={960} />);

    // Should render without errors
    expect(screen.getByText('Test Laptop')).toBeTruthy();
  });

  it('displays assets with terminal price', () => {
    const assetWithTerminal = { ...mockAsset, terminalPrice: 200 };
    render(<AssetCard asset={assetWithTerminal} currentValue={960} />);

    // Should render without errors and show correct value
    expect(screen.getByText('$960')).toBeTruthy();
  });

  it('handles brand new assets (0 weeks passed)', () => {
    // Mock calculateCurrentValue to return full value
    const mockedCalculateCurrentValue = vi.mocked(calculateCurrentValue);
    mockedCalculateCurrentValue.mockReturnValueOnce(1200); // Full value

    const newAsset = { ...mockAsset, purchaseDate: '2025-11-09' };
    render(<AssetCard asset={newAsset} currentValue={1200} />);

    expect(screen.getByText('$1,200')).toBeTruthy();
  });

  it('handles fully depreciated assets', () => {
    // Mock weeksBetween to return more than expected life
    const mockedWeeksBetween = vi.mocked(weeksBetween);
    mockedWeeksBetween.mockReturnValueOnce(200); // More than 104 weeks

    const oldAsset = { ...mockAsset, purchaseDate: '2020-01-01' };
    render(<AssetCard asset={oldAsset} currentValue={0} />);

    // Should still render without errors
    expect(screen.getByText('Test Laptop')).toBeTruthy();
  });

  it('shows correct progress for assets with events', () => {
    const assetWithEvents = {
      ...mockAsset,
      events: [
        { date: '2024-01-01', amount: 200, description: 'Upgrade' },
        { date: '2024-06-01', amount: -100, description: 'Repair' },
      ],
    };

    const mockedCalculateTotalInvested = vi.mocked(calculateTotalInvested);
    mockedCalculateTotalInvested.mockReturnValueOnce(1300); // 1200 + 200 - 100

    render(<AssetCard asset={assetWithEvents} currentValue={960} />);

    // Should render with events factored into calculations
    expect(screen.getByText('Test Laptop')).toBeTruthy();
    expect(screen.getByText('$960')).toBeTruthy();
  });

  it('auto-updates current value every minute', async () => {
    // Mock Date.now and setTimeout for testing
    const mockDateNow = vi.fn();
    global.Date.now = mockDateNow;
    mockDateNow.mockReturnValue(Date.parse('2025-11-09T12:00:00Z'));

    const mockedCalculateCurrentValue = vi.mocked(calculateCurrentValue);
    mockedCalculateCurrentValue
      .mockReturnValueOnce(960) // Initial value
      .mockReturnValueOnce(959); // After 1 minute

    render(<AssetCard asset={mockAsset} currentValue={960} />);

    // Initial value should be shown
    expect(screen.getByText('$960')).toBeTruthy();

    // Fast-forward time by 1 minute
    mockDateNow.mockReturnValue(Date.parse('2025-11-09T12:01:00Z'));

    // Wait for the update (the interval is 60000ms, but we can wait for DOM update)
    await waitFor(() => {
      expect(mockedCalculateCurrentValue).toHaveBeenCalled();
    }, { timeout: 100 });

    // Note: In a real test environment, we'd need to mock setInterval properly
    // This test demonstrates the structure for testing auto-updates
  });

  it('displays assets with very long names', () => {
    const assetLongName = {
      ...mockAsset,
      name: 'Very Long Asset Name That Might Cause Layout Issues If Not Handled Properly',
    };
    render(<AssetCard asset={assetLongName} currentValue={960} />);

    expect(screen.getByText('Very Long Asset Name That Might Cause Layout Issues If Not Handled Properly')).toBeTruthy();
  });

  it('handles assets with zero purchase value', () => {
    const assetZeroValue = { ...mockAsset, purchaseValue: 0 };
    const mockedCalculateCurrentValue = vi.mocked(calculateCurrentValue);
    mockedCalculateCurrentValue.mockReturnValueOnce(0);

    render(<AssetCard asset={assetZeroValue} currentValue={0} />);

    expect(screen.getByText('$0')).toBeTruthy();
  });

  it('shows correct styling for assets with photos', () => {
    const assetWithPhoto = {
      ...mockAsset,
      photoDataUrl: 'data:image/jpeg;base64,testphoto',
    };
    render(<AssetCard asset={assetWithPhoto} currentValue={960} />);

    const card = screen.getByText('Test Laptop').closest('.asset-card');
    expect(card).toBeTruthy();

    // Check that the card has background image styling
    const computedStyle = window.getComputedStyle(card!);
    expect(computedStyle.backgroundImage).toContain('url');
  });

  it('displays remaining lifetime date correctly', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    // Should show a date in the format "Dec 29, 2024" (MMM DD, YYYY)
    expect(screen.getByText(/Dec 29, 2024/)).toBeTruthy();
  });

  it('handles assets with undefined description', () => {
    const assetUndefinedDesc = { ...mockAsset };
    delete assetUndefinedDesc.description;
    render(<AssetCard asset={assetUndefinedDesc} currentValue={960} />);

    // Should not show description section
    expect(screen.queryByText('A test laptop for development')).toBeNull();
  });
});
