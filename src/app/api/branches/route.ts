import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {

    const branches = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, location: true }
    });

    return NextResponse.json(branches);
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
