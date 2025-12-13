import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { prisma } from '@/lib/db';
import { appConfig } from '@/lib/config';

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

  if (!session.challenge) {
    return NextResponse.json({ error: 'No challenge' }, { status: 400 });
  }

  const body = await request.json();

  const credential = await prisma.credential.findUnique({
    where: { credentialId: body.id },
  });

  if (!credential || credential.userId !== session.userId) {
    return NextResponse.json(
      { error: 'Credential not found or invalid' },
      { status: 400 },
    );
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: session.challenge,
      expectedOrigin: appConfig.expectedOrigin,
      expectedRPID: appConfig.rpId,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, 'base64')),
        counter: credential.counter,
        transports: JSON.parse(credential.transports || '[]'),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: `Verification failed: ${(error as Error).message}` },
      { status: 400 },
    );
  }

  if (verification.verified) {
    // 1. Fetch all data for export
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        assets: true,
        incomeSources: true,
        incomeEntries: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exportData = {
      userId: session.userId,
      assets: user.assets,
      incomeSources: user.incomeSources,
      incomeEntries: user.incomeEntries,
      tags: user.tags ? JSON.parse(user.tags) : {},
      version: 1,
      exportDate: new Date().toISOString(),
    };

    // 2. Delete user
    await prisma.user.delete({
      where: { id: session.userId },
    });

    // 3. Clear session
    session.destroy();
    await session.save();

    // 4. Return data
    return NextResponse.json({ success: true, exportData });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
}
