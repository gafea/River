import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    asset: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock iron-session
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(),
}));
import { getIronSession } from 'iron-session';

describe('API Assets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 if not authenticated', async () => {
    (getIronSession as any).mockResolvedValue({});
    const req = new NextRequest('http://localhost/api/assets');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns assets for user', async () => {
    (getIronSession as any).mockResolvedValue({ userId: 'user-1' });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      tags: '{}',
    });
    (prisma.asset.findMany as any).mockResolvedValue([
      { id: '1', name: 'Asset 1', userId: 'user-1', tag: 'tag1' },
    ]);

    const req = new NextRequest('http://localhost/api/assets');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.assets).toHaveLength(1);
    expect(data.assets[0].name).toBe('Asset 1');
  });
});
