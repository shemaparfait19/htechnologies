import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'Environment Diagnostics',
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databasePrefix: process.env.DATABASE_URL?.substring(0, 10) || 'None',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'None passed',
    authUrl: process.env.AUTH_URL || process.env.NEXTAUTH_URL || 'None passed manually',
    vercelProdUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || 'Unknown'
  });
}
