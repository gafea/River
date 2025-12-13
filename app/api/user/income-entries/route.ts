import { NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  const where: any = { userId: (session as any).userId };
  if (month) {
    where.date = {
      startsWith: month,
    };
  }

  const entries = await prisma.incomeEntry.findMany({
    where,
    include: { source: true },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { date, amount, description, sourceId } = body;

  const entry = await prisma.incomeEntry.create({
    data: {
      userId: (session as any).userId,
      date,
      amount: parseFloat(amount),
      description,
      sourceId,
    },
  });

  return NextResponse.json(entry);
}
