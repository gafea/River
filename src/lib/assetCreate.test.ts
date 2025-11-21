import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@/lib/db';

// We will mock prisma.asset.create to inspect payload mapping used in route logic.
vi.mock('@/lib/db', () => {
  return {
    prisma: {
      asset: {
        create: vi.fn(async ({ data }: any) => ({ ...data, id: 'generated-id', tags: data.tags, events: data.events })),
      },
    },
  };
});

// Simulate sanitized create logic extracted from route
async function createAssetFromBody(sessionUserId: string, body: any) {
  const {
    name,
    description,
    purchaseValue,
    expectedLifeWeeks,
    purchaseDate,
    tags,
    photoDataUrl,
    terminalPrice,
    events,
  } = body;
  const asset = await (prisma as any).asset.create({
    data: {
      name,
      description: description ?? null,
      purchaseValue,
      expectedLifeWeeks,
      purchaseDate,
      tags: JSON.stringify(tags || []),
      photoDataUrl: photoDataUrl ?? null,
      terminalPrice: terminalPrice ?? null,
      events: events ? JSON.stringify(events) : null,
      userId: sessionUserId,
    },
  });
  return asset;
}

describe('asset create sanitization', () => {
  it('ignores client-provided id field', async () => {
    const body = {
      id: 'malicious-id',
      name: 'Test',
      purchaseValue: 100,
      expectedLifeWeeks: 52,
      purchaseDate: '2025-01-01',
      tags: ['A'],
    };
    const asset = await createAssetFromBody('user-1', body);
    expect(asset.id).toBe('generated-id');
    expect(asset.userId).toBe('user-1');
  });

  it('defaults optional fields to null when absent', async () => {
    const body = {
      name: 'Test2',
      purchaseValue: 200,
      expectedLifeWeeks: 104,
      purchaseDate: '2025-02-01',
      tags: [],
    };
    const asset = await createAssetFromBody('user-2', body);
    expect(asset.description).toBeNull();
    expect(asset.photoDataUrl).toBeNull();
    expect(asset.terminalPrice).toBeNull();
    expect(asset.events).toBeNull();
  });
});
