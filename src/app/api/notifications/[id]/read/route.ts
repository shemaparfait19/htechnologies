// Mark notification as read
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}
