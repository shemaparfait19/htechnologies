import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user || session.user.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { oldPin, newPin } = await request.json();
    if (!oldPin || !newPin || newPin.length !== 5) {
      return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
    }

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'System not initialized' }, { status: 500 });
    }

    if (settings.adminPin !== oldPin) {
      return NextResponse.json({ error: 'Incorrect current PIN' }, { status: 401 });
    }

    await prisma.adminSettings.update({
      where: { id: settings.id },
      data: { adminPin: newPin },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CHANGE PIN ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
