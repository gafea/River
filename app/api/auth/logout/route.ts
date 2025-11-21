import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = (await getIronSession(
    request,
    response,
    sessionOptions,
  )) as any;

  delete session.userId;
  delete session.challenge;

  await session.save();

  const finalResponse = NextResponse.json({ success: true });
  finalResponse.headers.set(
    'Set-Cookie',
    response.headers.get('Set-Cookie') || '',
  );
  return finalResponse;
}
