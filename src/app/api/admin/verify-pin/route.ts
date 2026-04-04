import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();
    if (!pin) {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
    }

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      // Auto-create settings with default PIN if not found
      await prisma.adminSettings.create({ data: { adminPin: '00000' } });
    }

    const storedPin = settings?.adminPin ?? '00000';

    if (storedPin === pin) {
      // Set a secure HTTP-only cookie, valid for 24 hours (Next.js 15 async cookies)
      const cookieStore = await cookies();
      cookieStore.set('admin_unlocked', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      // Log the admin login event
      try {
        const session = await getSessionUser(request);
        if (session?.user) {
          await prisma.userLog.create({
            data: {
              userId: session.user.id,
              branchId: session.user.branchId || null,
              action: 'Admin Login',
              details: 'Unlocked the Executive Dashboard via correct PIN',
            },
          });
        }
      } catch (_) {}

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  } catch (error: any) {
    console.error('VERIFY PIN ERROR:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
