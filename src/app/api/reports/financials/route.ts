import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { startOfDay, endOfDay, parseISO, format, isValid } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['owner', 'manager', 'sales'].includes(session.user.role)) {
      console.warn(`Access denied to Financials for user ${session.user.id} with role ${session.user.role}`);
      return NextResponse.json({ error: 'Forbidden: Access restricted to owners and managers' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchIdParam = searchParams.get('branchId'); // owner-only branch filter

    // Default to current month if no dates provided
    const now = new Date();
    const startDate = startDateParam ? parseISO(startDateParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateParam ? parseISO(endDateParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (!isValid(startDate) || !isValid(endDate)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    let branchFilter: any = {};
    if (session.user.role === 'owner') {
      // Owner can optionally filter by a specific branch; if none selected, sees all
      if (branchIdParam) branchFilter = { branchId: branchIdParam };
    } else if (session.user.branchId) {
      // Non-owners are always locked to their branch
      branchFilter = { branchId: session.user.branchId };
    }

    // 1. Fetch Completed Repair Jobs (Income & Parts Cost)
    const repairs = await prisma.repairJob.findMany({
      where: {
        AND: [
             // Use completedAt or collectedAt or updatedAt? Use updatedAt for simplicity or completedAt if strictly enforced
             // User's report seems to trigger on dates. Let's use `updatedAt` or `completedAt`.
             // If status is 'collected' or 'ready', it counts as potential income?
             // Actually, `depositPaid` happens anytime. `balance` happens later.
             // To simplify: We track based on `createdAt` or `completedAt`. 
             // Let's use `createdAt` for now to match the user's likely mental model of "Jobs received/done today", 
             // OR `updatedAt` for when money came in? 
             // BETTER: Use `completedAt` for finished jobs, or fall back to `createdAt`.
             // Given the "RAPOLO" context, it's usually cash flow. But we lack a separate "Payments" table.
             // We will use `createdAt` for grouping for now as it's the stable "Job Date".
             { createdAt: { gte: startOfDay(startDate) } },
             { createdAt: { lte: endOfDay(endDate) } },
             branchFilter
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: true,
        partsUsed: true
      }
    });

    // 2. Fetch Sales (Income & COGS)
    const sales = await prisma.salesInvoice.findMany({
      where: {
        saleDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        ...branchFilter
      },
      include: {
        user: true,
        items: {
          include: {
            item: true
          }
        }
      }
    });

    // 3. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate)
        },
        ...branchFilter
      },
      include: {
        user: true
      }
    });

    // 4. Aggregate Data
    // We want a daily breakdown and a technician breakdown.
    
    // Map to hold daily data
    // Key: YYYY-MM-DD
    const dailyMap = new Map<string, any>();

    // Helper to init day
    const getDayEntry = (date: Date) => {
        const key = format(date, 'yyyy-MM-dd');
        if (!dailyMap.has(key)) {
            dailyMap.set(key, {
                date: key,
                income: 0, // Revenue
                partsCost: 0, // COGS
                expenses: 0,
                technicians: {} 
            });
        }
        return dailyMap.get(key);
    };

    // Helper to init tech in a day
    const getTechEntry = (dayEntry: any, user: any) => {
        const userId = user?.id || 'unknown';
        const userName = user?.fullName || 'Unknown';
        
        if (!dayEntry.technicians[userId]) {
            dayEntry.technicians[userId] = {
                name: userName,
                revenue: 0, 
                partsCost: 0,
                grossProfit: 0,
                quotaShortfall: 0 // "Loss" against 12,500
            };
        }
        return dayEntry.technicians[userId];
    };

    // Process Repairs
    repairs.forEach(repair => {
        let partsTotal = 0;
        repair.partsUsed.forEach(part => {
             partsTotal += part.totalCost || (part.unitCost * part.quantity) || 0;
        });

        // Self-heal: If actualCost is missing, try to derive it
        // Priority: existing actualCost > estimatedCost > sum of parts
        let effectiveRevenue = repair.actualCost;
        if (!effectiveRevenue || effectiveRevenue === 0) {
             if (repair.estimatedCost && repair.estimatedCost > 0) {
                 effectiveRevenue = repair.estimatedCost;
             } else {
                 effectiveRevenue = partsTotal;
             }
             // Update the object so the frontend "Repairs" detail list shows this value
             // @ts-ignore
             repair.actualCost = effectiveRevenue;
        }

        const partsCost = partsTotal; // This is the Cost of Goods

        const entry = getDayEntry(repair.createdAt);
        const tech = getTechEntry(entry, repair.assignedUser);

        entry.income += effectiveRevenue;
        entry.partsCost += partsCost;
        
        tech.revenue += effectiveRevenue;
        tech.partsCost += partsCost;
        tech.grossProfit = tech.revenue - tech.partsCost;
        // Quota check happens at end of aggregation
    });

    // Process Sales
    // Process Sales
    sales.forEach(sale => {
        const revenue = sale.total;
        let partsCost = 0;
        sale.items.forEach(lineItem => {
            partsCost += (lineItem.item?.unitCost || 0) * lineItem.quantity;
        });

        const profit = revenue - partsCost;

        // Attach details for Frontend Report
        // @ts-ignore
        sale.cogs = partsCost;
        // @ts-ignore
        sale.profit = profit;

        const entry = getDayEntry(sale.saleDate);
        const tech = getTechEntry(entry, sale.user);

        entry.income += revenue;
        entry.partsCost += partsCost;

        tech.revenue += revenue;
        tech.partsCost += partsCost;
        tech.grossProfit = tech.revenue - tech.partsCost;
    });

    // Process Expenses
    expenses.forEach(expense => {
        const entry = getDayEntry(expense.expenseDate);
        entry.expenses += expense.amount;
    });

    // Post-Process Quota Logic (12,500 RWF Target)
    const DAILY_QUOTA = 12500;
    
    dailyMap.forEach(day => {
        Object.values(day.technicians).forEach((t: any) => {
             // Logic: If they worked (have entry), check quota.
             // Loss = Max(0, 12500 - GrossProfit)
             t.quotaShortfall = Math.max(0, DAILY_QUOTA - t.grossProfit);
             
             // For the RAPOLO view "Income" column usually means "Money they brought in" (Gross Profit)
             // And "Loss" means "Shortfall".
        });
    });

    // Convert Map to sorted Array
    const dailyReport = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Summary/Totals
    const summary = {
        totalRevenue: 0,
        totalPartsCost: 0,
        totalExpenses: 0,
        totalQuotaShortfall: 0,
        netProfit: 0, // Genuine business profit
        byTechnician: {} as any
    };

    dailyReport.forEach(day => {
        summary.totalRevenue += day.income;
        summary.totalPartsCost += day.partsCost;
        summary.totalExpenses += day.expenses;
        
        Object.values(day.technicians).forEach((t: any) => {
            summary.totalQuotaShortfall += t.quotaShortfall;

            if (!summary.byTechnician[t.name]) {
                summary.byTechnician[t.name] = { revenue: 0, partsCost: 0, grossProfit: 0, quotaShortfall: 0 };
            }
            summary.byTechnician[t.name].revenue += t.revenue;
            summary.byTechnician[t.name].partsCost += t.partsCost;
            summary.byTechnician[t.name].grossProfit += t.grossProfit;
            summary.byTechnician[t.name].quotaShortfall += t.quotaShortfall;
        });
    });

    // Net Profit for Business = (Total Revenue - Total Parts Cost - Expenses)
    // The "Quota Shortfall" is a metric for the *Technician*, not necessarily a cash loss for the business (unless they pay it).
    // The User's report shows "Balance" day by day.
    // User Balance Row: "51,000 (Income) | 10,000 (Loss??) | 46,400 (Balance?)"
    // Let's stick to standard Accounting Profit for the "Balance" column: Revenue - Parts - Expenses.
    summary.netProfit = summary.totalRevenue - summary.totalPartsCost - summary.totalExpenses;

    return NextResponse.json({
        period: { start: startDate, end: endDate },
        daily: dailyReport,
        summary,
        details: {
            repairs,
            sales,
            expenses
        }
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
