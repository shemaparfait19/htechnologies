// API route for dashboard stats
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helper';
import { getDashboardStats } from '@/lib/data-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branchIdToFilter = session.user.role !== 'owner' ? session.user.branchId : undefined;
    const stats = await getDashboardStats(branchIdToFilter || undefined);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
