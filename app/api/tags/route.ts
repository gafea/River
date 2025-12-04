import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const res = NextResponse.next();
  const session = (await getIronSession(request, res, sessionOptions)) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      tags: JSON.stringify(body),
    },
  });

  return NextResponse.json({ success: true });
}
