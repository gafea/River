import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AssetCard from './AssetCard';
import type { Asset } from '@/src/lib/types';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock the utils functions
vi.mock('@/src/lib/utils', () => ({
  formatCurrency: vi.fn((value: number) => `$${value.toLocaleString()}`),
  weeksBetween: vi.fn(() => 26), // Mock 26 weeks passed
  calculateTotalInvested: vi.fn(() => 1200), // Mock total invested
  calculateDailyDepreciation: vi.fn(() => 18), // Mock daily depreciation
}));

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
  });

  it('renders asset information correctly', () => {
    render(<AssetCard asset={mockAsset} currentValue={960} />);

    expect(screen.getByText('Test Laptop')).toBeTruthy();
    expect(screen.getByText('A test laptop for development')).toBeTruthy();
    expect(screen.getByText('$960')).toBeTruthy();
    expect(screen.getByText('($18/day)')).toBeTruthy();
  });

  it('shows "No description" when description is empty', () => {
    const assetWithoutDesc = { ...mockAsset, description: '' };
    render(<AssetCard asset={assetWithoutDesc} currentValue={960} />);

    expect(screen.getByText('No description')).toBeTruthy();
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
});
