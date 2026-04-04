import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  return NextResponse.json({
    message: 'Session Debug',
    session,
    cookies: request.headers.get('cookie'),
    env_secret_set: !!process.env.NEXTAUTH_SECRET,
    auth_secret_set: !!process.env.AUTH_SECRET,
  });
}
