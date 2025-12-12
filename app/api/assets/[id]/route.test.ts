import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    asset: { findUnique: vi.fn() },
  },
}));

vi.mock('iron-session', () => ({
  getIronSession: vi.fn(),
}));
import { getIronSession } from 'iron-session';

describe('API Asset Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns asset if found and authorized', async () => {
    (getIronSession as any).mockResolvedValue({ userId: 'user-1' });
    (prisma.asset.findUnique as any).mockResolvedValue({
      id: 'asset-1',
      userId: 'user-1',
      name: 'My Asset',
      tag: 'tag1',
    });

    const req = new NextRequest('http://localhost/api/assets/asset-1');
    const params = Promise.resolve({ id: 'asset-1' });
    const res = await GET(req, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('My Asset');
  });

  it('GET returns 404 if not found', async () => {
    (getIronSession as any).mockResolvedValue({ userId: 'user-1' });
    (prisma.asset.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/assets/asset-1');
    const params = Promise.resolve({ id: 'asset-1' });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
  });
});
