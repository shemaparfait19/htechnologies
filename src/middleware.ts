import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Add all routes that require authentication here
const protectedRoutes = [
  '/dashboard',
  '/inventory',
  '/sales',
  '/repairs',
  '/customers',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block all access when system is suspended (non-payment)
  if (process.env.SYSTEM_SUSPENDED === 'true') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'System suspended. Contact the developer.' }, { status: 402 });
    }
    if (pathname !== '/suspended') {
      return NextResponse.redirect(new URL('/suspended', request.url));
    }
  }

  // API routes handle their own auth — don't run the rest of this middleware on them
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Root redirects to dashboard (which redirects to login if unauth'd)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check if the route is protected
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const token = request.cookies.get('session_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token validity
    const payload = await verifyToken(token);
    if (!payload) {
      // Token exists but is invalid/expired
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session_token');
      return response;
    }
    
    // Inject user role/branch headers if needed by API downstream
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.id);
    response.headers.set('x-user-role', payload.role);
    if (payload.branchId) {
      response.headers.set('x-user-branch', payload.branchId);
    }
    return response;
  }

  // Prevent logged-in users from seeing the login page
  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('session_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Ignored paths
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.js).*)'],
};
