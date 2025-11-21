import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession(request, res, sessionOptions) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure the user row still exists (DB may have been reset while cookie persists)
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    try {
      session.destroy();
      await session.save();
    } catch {}
    return NextResponse.json({ error: 'User not found. Please re-authenticate.' }, { status: 401 });
  }

  const assets = await prisma.asset.findMany({
    where: { userId: session.userId },
  });

  // Convert to the expected format
  const formatted = assets.map(asset => ({
    ...asset,
    tags: JSON.parse(asset.tags),
    events: asset.events ? JSON.parse(asset.events) : undefined,
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession(request, res, sessionOptions) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate user still exists (in case DB was cleared or migrated)
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    try {
      session.destroy();
      await session.save();
    } catch {}
    return NextResponse.json({ error: 'User not found. Please re-authenticate.' }, { status: 401 });
  }

  const body = await request.json();
  // Explicitly pick allowed fields; ignore any client-provided id to prevent P2002 duplication
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

  try {
    const asset = await prisma.asset.create({
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
        userId: session.userId,
      },
    });

    const formatted = {
      ...asset,
      tags: JSON.parse(asset.tags),
      events: asset.events ? JSON.parse(asset.events) : undefined,
    };

    return NextResponse.json(formatted);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Duplicate asset id' }, { status: 409 });
    }
    if (e.code === 'P2003') {
      // Foreign key violation => userId reference invalid; force re-auth
      try {
        session.destroy();
        await session.save();
      } catch {}
      return NextResponse.json({ error: 'User reference invalid. Please re-authenticate.' }, { status: 409 });
    }
    console.error('Asset create failed', e);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}