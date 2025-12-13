import { NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await prisma.incomeSource.delete({
    where: {
      id,
      userId: (session as any).userId,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, type, amount } = body;

  const source = await prisma.incomeSource.update({
    where: {
      id,
      userId: (session as any).userId,
    },
    data: {
      name,
      type,
      amount: amount ? parseFloat(amount) : null,
    },
  });

  return NextResponse.json(source);
}
