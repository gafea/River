import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = NextResponse.next();
  const session = await getIronSession(request, res, sessionOptions) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  const asset = await prisma.asset.updateMany({
    where: { id: id, userId: session.userId },
    data: {
      ...body,
      tags: JSON.stringify(body.tags || []),
      events: body.events ? JSON.stringify(body.events) : null,
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
    tags: JSON.parse(updated.tags),
    events: updated.events ? JSON.parse(updated.events) : undefined,
  };

  return NextResponse.json(formatted);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = NextResponse.next();
  const session = await getIronSession(request, res, sessionOptions) as any;

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