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

  const sources = await prisma.incomeSource.findMany({
    where: { userId: (session as any).userId },
  });

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, amount } = body;

  const source = await prisma.incomeSource.create({
    data: {
      userId: (session as any).userId,
      name,
      type,
      amount: amount ? parseFloat(amount) : null,
    },
  });

  return NextResponse.json(source);
}
