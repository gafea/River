import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const res = NextResponse.next();
  const session = (await getIronSession(request, res, sessionOptions)) as any;

  if (session.userId) {
    try {
      const [credentialCount, user] = await Promise.all([
        prisma.credential.count({ where: { userId: session.userId } }),
        prisma.user.findUnique({
          where: { id: session.userId },
          select: { hasCompletedSetup: true },
        }),
      ]);

      if (credentialCount > 0) {
        return NextResponse.json({
          authenticated: true,
          userId: session.userId,
          hasCompletedSetup: user?.hasCompletedSetup ?? false,
        });
      }
      // No credentials yet -> treat as unauthenticated (registration not completed)
      return NextResponse.json({ authenticated: false, pending: true });
    } catch (e) {
      return NextResponse.json({
        authenticated: false,
        error: 'Status check failed',
      });
    }
  }
  return NextResponse.json({ authenticated: false });
}
