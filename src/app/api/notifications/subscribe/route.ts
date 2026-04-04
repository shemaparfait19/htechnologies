import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, subscription } = body;

    // Ensure user is subscribing for themselves or is admin
    if (session.user.id !== userId && !['owner', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store subscription in database
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error subscribing to push:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
