// Get user notifications
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getSessionUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const session = await getSessionUser(request);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Ensure user is requesting their own notifications or is admin
    // if (session.user.id !== userId && session.user.role !== 'owner' && session.user.role !== 'manager') {
    //    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
