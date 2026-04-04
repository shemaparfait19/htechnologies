'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Wrench, ShoppingCart, DollarSign } from 'lucide-react';

interface DailyReportTableProps {
  data: any;
}

export function DailyReportTable({ data }: DailyReportTableProps) {
  if (!data?.details) return <div>No details available</div>;

  // 1. Merge and Sort Transactions
  const transactions: any[] = [
    ...(data.details.repairs || []).map((r: any) => ({
      type: 'repair',
      date: r.createdAt, // or completedAt
      ref: r.jobNumber,
      description: `${r.deviceType} - ${r.brand} ${r.model}`,
      technician: r.assignedUser?.fullName || 'Unassigned',
      amount: r.actualCost,
      isIncome: true,
      original: r
    })),
    ...(data.details.sales || []).map((s: any) => ({
      type: 'sale',
      date: s.saleDate,
      ref: s.invoiceNumber,
      description: `Sale (${s.items.length} items)`,
      technician: s.user?.fullName || 'Unknown',
      amount: s.total,
      isIncome: true,
      original: s
    })),
    ...(data.details.expenses || []).map((e: any) => ({
      type: 'expense',
      date: e.expenseDate,
      ref: 'EXP',
      description: e.description,
      technician: 'N/A', // expenses might have userId but conceptually corporate
      amount: e.amount,
      isIncome: false,
      original: e
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Transaction Ledger</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
            <thead>
                <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Ref</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Technician</th>
                    <th className="p-3 text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                {transactions.length > 0 ? (
                    transactions.map((tx, i) => (
                        <tr key={i} className="border-b hover:bg-muted/20">
                            <td className="p-3 font-medium whitespace-nowrap">
                                {formatDateTime(tx.date)}
                            </td>
                            <td className="p-3">
                                <Badge variant="outline" className={`
                                    flex items-center gap-1 w-fit
                                    ${tx.type === 'repair' ? 'border-orange-500 text-orange-600' : ''}
                                    ${tx.type === 'sale' ? 'border-blue-500 text-blue-600' : ''}
                                    ${tx.type === 'expense' ? 'border-red-500 text-red-600' : ''}
                                `}>
                                    {tx.type === 'repair' && <Wrench className="h-3 w-3" />}
                                    {tx.type === 'sale' && <ShoppingCart className="h-3 w-3" />}
                                    {tx.type === 'expense' && <DollarSign className="h-3 w-3" />}
                                    {tx.type.toUpperCase()}
                                </Badge>
                            </td>
                            <td className="p-3 text-muted-foreground">{tx.ref}</td>
                            <td className="p-3">{tx.description}</td>
                            <td className="p-3">{tx.technician}</td>
                            <td className={`p-3 text-right font-bold ${tx.isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                            No transactions found for this period.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
