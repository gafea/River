import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';

vi.mock('@/lib/db', () => ({
  prisma: {
    incomeSource: {
      create: vi.fn(),
    },
  },
}));

vi.mock('iron-session', () => ({
  getIronSession: vi.fn(),
}));

describe('API Income Sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST creates income source with dates', async () => {
    (getIronSession as any).mockResolvedValue({ userId: 'user-1' });
    (prisma.incomeSource.create as any).mockResolvedValue({
      id: 's1',
      name: 'Job',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    });

    const req = new NextRequest('http://localhost/api/user/income-sources', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Job',
        type: 'FIXED',
        amount: 5000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.startDate).toBe('2025-01-01');
    expect(prisma.incomeSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          startDate: '2025-01-01',
          endDate: '2025-12-31',
        }),
      }),
    );
  });
});
