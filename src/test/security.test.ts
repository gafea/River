import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '../../app/api/assets/[id]/route';
import { NextRequest } from 'next/server';

// Mock iron-session
vi.mock('iron-session', () => ({
  getIronSession: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    asset: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

describe('Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent IDOR/Mass Assignment in PUT /api/assets/[id]', async () => {
    // Setup session
    (getIronSession as any).mockResolvedValue({
      userId: 'user-1',
      save: vi.fn(),
      destroy: vi.fn(),
    });

    // Mock prisma response
    (prisma.asset.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.asset.findUnique as any).mockResolvedValue({
      id: 'asset-1',
      userId: 'user-1',
      tag: 'test',
      events: null,
    });

    // Create request with malicious payload
    const body = {
      name: 'Updated Asset',
      userId: 'user-2', // Malicious attempt to change owner
    };

    const req = new NextRequest('http://localhost/api/assets/asset-1', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const params = Promise.resolve({ id: 'asset-1' });

    await PUT(req, { params });

    // Check what prisma was called with
    const updateCall = (prisma.asset.updateMany as any).mock.calls[0];
    const updateData = updateCall[0].data;

    // If vulnerable, updateData will contain userId: 'user-2'
    // We expect this to FAIL currently
    expect(updateData).not.toHaveProperty('userId');
    expect(updateData).not.toHaveProperty('id');
  });

  it('should validate photoDataUrl to prevent XSS/malicious content', async () => {
    // Setup session
    (getIronSession as any).mockResolvedValue({
      userId: 'user-1',
      save: vi.fn(),
      destroy: vi.fn(),
    });

    // Mock prisma response
    (prisma.asset.updateMany as any).mockResolvedValue({ count: 1 });
    (prisma.asset.findUnique as any).mockResolvedValue({
      id: 'asset-1',
      userId: 'user-1',
    });

    // Malicious payload
    const body = {
      photoDataUrl: 'javascript:alert(1)',
    };

    const req = new NextRequest('http://localhost/api/assets/asset-1', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const params = Promise.resolve({ id: 'asset-1' });

    const res = await PUT(req, { params });

    // Should return 400 Bad Request
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid photo');
  });

  it('should validate events is an array', async () => {
    // Setup session
    (getIronSession as any).mockResolvedValue({
      userId: 'user-1',
      save: vi.fn(),
      destroy: vi.fn(),
    });

    // Mock prisma response
    (prisma.asset.updateMany as any).mockResolvedValue({ count: 1 });

    // Malicious payload
    const body = {
      events: 'not-an-array',
    };

    const req = new NextRequest('http://localhost/api/assets/asset-1', {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const params = Promise.resolve({ id: 'asset-1' });

    const res = await PUT(req, { params });

    // Should return 400 Bad Request
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Events must be an array');
  });
});
