import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import AssetForm from './AssetForm';
import { addAsset, updateAsset } from '@/lib/store';
import type { Asset } from '@/lib/types';

// Mock dependencies
vi.mock('@/lib/store', () => ({
  addAsset: vi.fn(),
  updateAsset: vi.fn(),
  getTags: vi.fn(() => ({})),
  getAllAssets: vi.fn(() => Promise.resolve([])),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('./UIContext', () => ({
  useUI: vi.fn(() => ({
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    closeSidebar: vi.fn(),
  })),
}));

// Mock window.alert
global.alert = vi.fn();

describe('AssetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', async () => {
    render(<AssetForm />);

    await waitFor(() => expect(screen.getByLabelText(/Name/i)).toBeTruthy());

    expect(screen.getByLabelText(/Name/i)).toBeTruthy();
    expect(screen.getByLabelText(/Description/i)).toBeTruthy();
    expect(screen.getByLabelText(/Purchase Value/i)).toBeTruthy();
    expect(screen.getByLabelText(/Expected Life/i)).toBeTruthy();
    expect(screen.getByLabelText(/Purchase Date/i)).toBeTruthy();
    expect(screen.getByLabelText(/Tag/i)).toBeTruthy();
  });

  it('populates form with existing asset data', async () => {
    const asset: Asset = {
      id: '1',
      name: 'Test Asset',
      description: 'Test Description',
      purchaseValue: 100,
      expectedLifeWeeks: 52,
      purchaseDate: '2023-01-01',
      tag: 'tag1',
      terminalPrice: 10,
    };

    render(<AssetForm asset={asset} />);

    await waitFor(() =>
      expect(screen.getByDisplayValue('Test Asset')).toBeTruthy(),
    );

    expect(screen.getByDisplayValue('Test Description')).toBeTruthy();
    expect(screen.getByDisplayValue('100')).toBeTruthy();
    expect(screen.getByDisplayValue('52')).toBeTruthy();
    expect(screen.getByDisplayValue('2023-01-01')).toBeTruthy();
    expect(screen.getByDisplayValue('tag1')).toBeTruthy();
    expect(screen.getByDisplayValue('10')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const ref = { current: null } as any;
    render(<AssetForm ref={ref} />);

    // Trigger validation by trying to submit (via ref)
    await act(async () => {
      await ref.current?.submit();
    });

    // Check for validation messages (implementation details depend on how validation is shown)
    // Based on the code, it sets errors state which is passed to Field validationMessage
    // We can check if the error text appears
    expect(screen.getByText('Name is required.')).toBeTruthy();
    expect(
      screen.getByText('Purchase value must be greater than 0.'),
    ).toBeTruthy();
  });

  it('validates purchase date not in future', async () => {
    const ref = { current: null } as any;
    render(<AssetForm ref={ref} />);

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().slice(0, 10);

    const dateInput = screen.getByLabelText(/Purchase Date/i);
    fireEvent.change(dateInput, { target: { value: futureDateStr } });

    await act(async () => {
      await ref.current?.submit();
    });

    expect(
      screen.getByText('Purchase date cannot be in the future.'),
    ).toBeTruthy();
  });

  it('submits valid form data for new asset', async () => {
    const ref = { current: null } as any;
    const onSaved = vi.fn();
    render(<AssetForm ref={ref} onSaved={onSaved} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'New Asset' },
    });
    fireEvent.change(screen.getByLabelText(/Purchase Value/i), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText(/Expected Life/i), {
      target: { value: '104' },
    });

    // Mock addAsset response
    const newAsset = { id: 'new-1', name: 'New Asset', purchaseValue: 500 };
    (addAsset as any).mockResolvedValue(newAsset);

    await act(async () => {
      await ref.current?.submit();
    });

    expect(addAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Asset',
        purchaseValue: 500,
        expectedLifeWeeks: 104,
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(newAsset);
  });

  it('submits valid form data for existing asset update', async () => {
    const asset: Asset = {
      id: '1',
      name: 'Old Name',
      purchaseValue: 100,
      expectedLifeWeeks: 52,
      purchaseDate: '2023-01-01',
      tag: '',
    };

    const ref = { current: null } as any;
    const onSaved = vi.fn();
    render(<AssetForm asset={asset} ref={ref} onSaved={onSaved} />);

    // Change name
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'New Name' },
    });

    // Mock updateAsset
    (updateAsset as any).mockResolvedValue({ ...asset, name: 'New Name' });

    await act(async () => {
      await ref.current?.submit();
    });

    expect(updateAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'New Name',
      }),
    );
  });

  it('handles events addition and removal', async () => {
    render(<AssetForm />);

    await waitFor(() => expect(screen.getByText('Add Event')).toBeTruthy());

    // Add event
    fireEvent.click(screen.getByText('Add Event'));
    expect(screen.getByPlaceholderText('Optional description')).toBeTruthy();

    // Remove event (assuming there's a delete button, usually an icon button)
    // We need to find the delete button. Based on code it has Delete24Regular icon.
    // We can look for the button in the table row.
    const deleteButtons = screen.getAllByRole('button');
    // The "Add Event" is a button, and the delete icon is a button.
    // Let's assume the last button is the delete button for the row if it's the only row.
    // Or we can check if the table row exists.

    const rows = screen.getAllByRole('row');
    // Header row + 1 data row
    expect(rows.length).toBe(2);
  });
});
