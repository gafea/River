import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = (await getIronSession(
    request,
    response,
    sessionOptions,
  )) as any;

  const pendingUserId = crypto.randomUUID();

  const options = await generateRegistrationOptions({
    rpName: 'Asset Manager',
    rpID: process.env.RP_ID || 'localhost',
    userID: new Uint8Array(Buffer.from(pendingUserId, 'utf8')),
    userName: `user-${pendingUserId}`, // Since no username, use ID
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  session.challenge = options.challenge;
  session.pendingUserId = pendingUserId;

  await session.save();

  const finalResponse = NextResponse.json(options);
  finalResponse.headers.set(
    'Set-Cookie',
    response.headers.get('Set-Cookie') || '',
  );
  return finalResponse;
}
