import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth-service';
import { signToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // This throws an error if invalid
    const user = await signIn(email, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const payload = {
        id: user.id,
        email: user.email,
        name: user.fullName,
        fullName: user.fullName, // Keep fullName for backwards compatibility
        role: user.role,
        branchId: user.branchId
    };

    const token = await signToken(payload);

    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({ user: payload });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
