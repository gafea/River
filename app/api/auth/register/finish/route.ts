import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = (await getIronSession(
    request,
    response,
    sessionOptions,
  )) as any;

  if (!session.challenge || !session.pendingUserId) {
    return NextResponse.json(
      { error: 'No challenge or pending user ID' },
      { status: 400 },
    );
  }

  const body = await request.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: session.challenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || 'http://localhost:8003',
      expectedRPID: process.env.RP_ID || 'localhost',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: `Verification failed: ${(error as Error).message}` },
      { status: 400 },
    );
  }

  const { verified, registrationInfo } = verification;

  if (!verified || !registrationInfo) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  // Create user and credential
  const user = await prisma.user.create({
    data: {
      id: session.pendingUserId,
    },
  });

  await prisma.credential.create({
    data: {
      credentialId: registrationInfo.credential.id,
      publicKey: Buffer.from(registrationInfo.credential.publicKey).toString(
        'base64',
      ),
      counter: registrationInfo.credential.counter,
      transports: JSON.stringify(registrationInfo.credential.transports || []),
      userId: user.id,
    },
  });

  // Promote pending user to authenticated user
  session.userId = user.id;
  delete session.challenge;
  delete session.pendingUserId;

  await session.save();

  const finalResponse = NextResponse.json({ success: true, userId: user.id });
  finalResponse.headers.set(
    'Set-Cookie',
    response.headers.get('Set-Cookie') || '',
  );
  return finalResponse;
}
