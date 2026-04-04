import { SignJWT, jwtVerify } from 'jose';

// Define the shape of our JWT payload based on NextAuth logic
export interface SessionPayload {
  id: string;
  email: string;
  name?: string;
  role: string;
  branchId?: string | null;
}

// Fallback secret for local development. Vercel must have AUTH_SECRET set!
const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-h-tech-123'
);

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Log out after 24 hours
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
