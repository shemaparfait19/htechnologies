import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['owner', 'manager', 'sales'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchIdParam = searchParams.get('branchId');

    // Date filter (optional)
    const dateFilter: any = {};
    if (startDateParam && endDateParam) {
      const startDate = parseISO(startDateParam);
      const endDate = parseISO(endDateParam);
      if (isValid(startDate) && isValid(endDate)) {
        dateFilter.gte = startOfDay(startDate);
        dateFilter.lte = endOfDay(endDate);
      }
    }

    let branchFilter: any = {};
    if (session.user.role === 'owner') {
      if (branchIdParam) branchFilter = { branchId: branchIdParam };
    } else if (session.user.branchId) {
      branchFilter = { branchId: session.user.branchId };
    }

    // Unpaid / partial sales
    const unpaidSales = await prisma.salesInvoice.findMany({
      where: {
        paymentStatus: { in: ['unpaid', 'partial'] },
        ...(dateFilter.gte ? { saleDate: dateFilter } : {}),
        ...branchFilter,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        user: { select: { fullName: true } },
        items: { include: { item: { select: { name: true } } } },
      },
      orderBy: { saleDate: 'desc' },
    });

    // Repairs with outstanding balance (balance > 0)
    const unpaidRepairs = await prisma.repairJob.findMany({
      where: {
        balance: { gt: 0 },
        ...(dateFilter.gte ? { createdAt: dateFilter } : {}),
        ...branchFilter,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSalesOwed = unpaidSales.reduce((sum, s) => sum + (s.total - s.paidAmount), 0);
    const totalRepairsOwed = unpaidRepairs.reduce((sum, r) => sum + r.balance, 0);

    return NextResponse.json({
      unpaidSales,
      unpaidRepairs,
      summary: {
        totalSalesOwed,
        totalRepairsOwed,
        totalOwed: totalSalesOwed + totalRepairsOwed,
        salesCount: unpaidSales.length,
        repairsCount: unpaidRepairs.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
