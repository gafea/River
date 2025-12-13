import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = NextResponse.next();
  const session = (await getIronSession(request, res, sessionOptions)) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: id },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (asset.userId !== session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const formatted = {
    ...asset,
    tag: asset.tag,
    events: asset.events ? JSON.parse(asset.events) : undefined,
  };

  return NextResponse.json(formatted);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = NextResponse.next();
  const session = (await getIronSession(request, res, sessionOptions)) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Explicitly pick allowed fields to prevent mass assignment/IDOR
  const {
    name,
    description,
    purchaseValue,
    expectedLifeWeeks,
    purchaseDate,
    tag,
    photoDataUrl,
    terminalPrice,
    events,
    isSold,
    soldDate,
    soldValue,
  } = body;

  if (photoDataUrl && !photoDataUrl.startsWith('data:image/')) {
    return NextResponse.json(
      { error: 'Invalid photo format' },
      { status: 400 },
    );
  }

  if (events && !Array.isArray(events)) {
    return NextResponse.json(
      { error: 'Events must be an array' },
      { status: 400 },
    );
  }

  const asset = await prisma.asset.updateMany({
    where: { id: id, userId: session.userId },
    data: {
      name,
      description,
      purchaseValue,
      expectedLifeWeeks,
      purchaseDate,
      tag: tag || '',
      photoDataUrl,
      terminalPrice,
      events: events ? JSON.stringify(events) : null,
      isSold,
      soldDate,
      soldValue,
    },
  });

  if (asset.count === 0) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const updated = await prisma.asset.findUnique({
    where: { id: id },
  });

  if (!updated) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const formatted = {
    ...updated,
    tag: updated.tag,
    events: updated.events ? JSON.parse(updated.events) : undefined,
  };

  return NextResponse.json(formatted);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = NextResponse.next();
  const session = (await getIronSession(request, res, sessionOptions)) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const asset = await prisma.asset.deleteMany({
    where: { id: id, userId: session.userId },
  });

  if (asset.count === 0) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
