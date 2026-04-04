// Push notification sending API
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userIds, title, message, icon, data } = body;

    if ((!userId && !userIds) || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get target user IDs
    const targetUserIds = userIds || [userId];

    // In production, this would:
    // 1. Fetch user push subscriptions from database
    // 2. Use web-push library to send notifications
    // 3. Handle failures and retry logic
    
    // For now, create in-app notifications
    const notifications = await Promise.all(
      targetUserIds.map((uid: string) =>
        prisma.notification.create({
          data: {
            userId: uid,
            type: data?.type || 'general',
            message: `${title}: ${message}`,
            relatedId: data?.relatedId || null,
          },
        })
      )
    );

    // Send actual push notifications
    const pushResults = await Promise.all(
      targetUserIds.map((uid: string) =>
        sendPushNotification(
          uid,
          title,
          message,
          data?.url || '/'
        )
      )
    );
    
    console.log('Push results:', pushResults);

    return NextResponse.json({
      success: true,
      sent: notifications.length,
      pushSent: pushResults.reduce((acc, res) => acc + (res.sent || 0), 0),
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

import { sendPushNotification } from '@/lib/push-service';
