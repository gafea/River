export type AssetEvent = {
  date: string; // ISO date
  amount: number; // positive for addition, negative for deduction
  description?: string;
};

export type Asset = {
  id: string;
  name: string;
  description?: string;
  photoDataUrl?: string;
  purchaseValue: number;
  expectedLifeWeeks: number;
  purchaseDate: string; // ISO date string
  tag: string;
  terminalPrice?: number;
  events?: AssetEvent[];
  isSold?: boolean;
  soldDate?: string | null;
  soldValue?: number | null;
};

export type IncomeSource = {
  id: string;
  name: string;
  type: 'FIXED' | 'DYNAMIC';
  amount: number | null;
  startDate?: string | null;
  endDate?: string | null;
};
