import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { appConfig } from '@/lib/config';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = (await getIronSession(
    request,
    response,
    sessionOptions,
  )) as any;

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userCredentials = await prisma.credential.findMany({
    where: { userId: session.userId },
  });

  const allowCredentials = userCredentials.map((cert) => ({
    id: cert.credentialId,
    type: 'public-key' as const,
  }));

  const options = await generateAuthenticationOptions({
    rpID: appConfig.rpId,
    userVerification: 'preferred',
    allowCredentials,
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
