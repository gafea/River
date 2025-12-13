import { NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const res = NextResponse.next();
  const session = await getIronSession(request as any, res, sessionOptions);

  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: (session as any).userId },
    data: { hasCompletedSetup: true },
  });

  return NextResponse.json({ success: true });
}
