import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify admin cookie
  const cookieStore = await cookies();
  if (cookieStore.get('admin_unlocked')?.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const branchId = searchParams.get('branchId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const branchFilter = branchId ? { branchId } : {};
  const dateFilter = { gte: start, lte: end };

  const [sales, repairs, expenses] = await Promise.all([
    prisma.salesInvoice.findMany({
      where: { saleDate: dateFilter, ...branchFilter },
      include: {
        user: { select: { fullName: true } },
        branch: { select: { name: true } },
      },
      orderBy: { saleDate: 'desc' },
    }),
    prisma.repairJob.aggregate({
      where: { completedAt: dateFilter, status: 'collected', ...branchFilter },
      _sum: { actualCost: true },
    }),
    prisma.expense.aggregate({
      where: { expenseDate: dateFilter, ...branchFilter },
      _sum: { amount: true },
    }),
  ]);

  const salesRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const repairsRevenue = repairs._sum.actualCost || 0;
  const totalExpenses = expenses._sum.amount || 0;

  return NextResponse.json({
    summary: {
      salesRevenue,
      repairsRevenue,
      totalRevenue: salesRevenue + repairsRevenue,
      totalExpenses,
      netProfit: salesRevenue + repairsRevenue - totalExpenses,
    },
    sales,
  });
}
