import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { appConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = (await getIronSession(
    request,
    response,
    sessionOptions,
  )) as any;

  const options = await generateAuthenticationOptions({
    rpID: appConfig.rpId,
    userVerification: 'preferred',
  });

  session.challenge = options.challenge;

  await session.save();

  const finalResponse = NextResponse.json(options);
  finalResponse.headers.set(
    'Set-Cookie',
    response.headers.get('Set-Cookie') || '',
  );
  return finalResponse;
}
