import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  return NextResponse.json({ success: true });
}

export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete('session_token');
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:9002'));
}
