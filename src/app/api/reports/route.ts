// API route for reports
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let reportData: any = {};

    if (type === 'sales') {
      // Sales Report
      const sales = await prisma.salesInvoice.findMany({
        where: {
          saleDate: {
            gte: start,
            lte: end,
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
          customer: true,
        },
      });

      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const transactionCount = sales.length;
      const itemsSold = sales.reduce(
        (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
        0
      );
      const uniqueItems = new Set(sales.flatMap(sale => sale.items.map(item => item.itemId))).size;

      // Get previous period for growth calculation
      const periodLength = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodLength);
      const prevEnd = start;

      const prevSales = await prisma.salesInvoice.findMany({
        where: {
          saleDate: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
      });

      const prevRevenue = prevSales.reduce((sum, sale) => sum + sale.total, 0);
      const growthRate = prevRevenue > 0 
        ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1)
        : 0;

      reportData = {
        totalRevenue,
        transactionCount,
        itemsSold,
        uniqueItems,
        growthRate,
        completedJobs: 0,
        totalJobs: 0,
        avgTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
        customerSatisfaction: 95,
        completionRate: 87,
        details: sales.map(sale => ({
          date: sale.saleDate.toISOString().split('T')[0],
          description: `Invoice ${sale.invoiceNumber} - ${sale.customer?.name || 'Walk-in'}`,
          amount: sale.total,
        })),
      };
    } else if (type === 'repairs') {
      // Repairs Report
      const repairs = await prisma.repairJob.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          customer: true,
          partsUsed: true,
        },
      });

      const totalJobs = repairs.length;
      const completedJobs = repairs.filter(r => r.status === 'collected').length;
      const totalRevenue = repairs.reduce((sum, repair) => sum + (repair.actualCost || repair.estimatedCost), 0);
      const avgTransactionValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
      const completionRate = totalJobs > 0 ? (completedJobs / totalJobs * 100).toFixed(1) : 0;

      reportData = {
        totalRevenue,
        transactionCount: totalJobs,
        completedJobs,
        totalJobs,
        itemsSold: 0,
        uniqueItems: 0,
        growthRate: 0,
        avgTransactionValue,
        customerSatisfaction: 95,
        completionRate,
        details: repairs.map(repair => ({
          date: repair.createdAt.toISOString().split('T')[0],
          description: `${repair.jobNumber} - ${repair.customer.name} - ${repair.deviceType}`,
          amount: repair.actualCost || repair.estimatedCost,
        })),
      };
    } else if (type === 'inventory') {
      // Inventory Report
      const items = await prisma.inventoryItem.findMany({
        include: {
          category: true,
        },
      });

      const totalValue = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const lowStockItems = items.filter(item => item.quantity <= item.reorderLevel).length;

      reportData = {
        totalRevenue: totalValue,
        transactionCount: items.length,
        itemsSold: totalItems,
        uniqueItems: items.length,
        completedJobs: 0,
        totalJobs: 0,
        growthRate: 0,
        avgTransactionValue: items.length > 0 ? totalValue / items.length : 0,
        customerSatisfaction: 95,
        completionRate: 100 - (lowStockItems / items.length * 100),
        details: items.map(item => ({
          date: new Date().toISOString().split('T')[0],
          description: `${item.name} - ${item.quantity} in stock`,
          amount: item.unitCost * item.quantity,
        })),
      };
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
