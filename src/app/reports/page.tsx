'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { MonthlySummary } from './components/monthly-summary';
import { DailyReportTable } from './components/daily-report-table';
import { AddExpenseDialog } from './components/add-expense-dialog';
import { Loader2, Calendar, PlusCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/app/components/auth-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loansData, setLoansData] = useState<any>(null);
  const [loansLoading, setLoansLoading] = useState(false);

  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    if (isOwner) {
      fetch('/api/branches')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setBranches(d); });
    }
  }, [isOwner]);

  const handleRangeChange = (value: string) => {
    setDateRange(value);
    const now = new Date();
    let start = now;
    let end = now;
    switch (value) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month': {
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      }
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        return;
    }
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (isOwner && selectedBranch !== 'all') params.set('branchId', selectedBranch);
      const res = await fetch(`/api/reports/financials?${params}`);
      const reportData = await res.json();
      if (res.ok) {
        setData(reportData);
      } else {
        console.error('Failed to fetch reports:', reportData.error);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    setLoansLoading(true);
    try {
      const params = new URLSearchParams();
      if (isOwner && selectedBranch !== 'all') params.set('branchId', selectedBranch);
      const res = await fetch(`/api/reports/loans?${params}`);
      if (res.ok) setLoansData(await res.json());
    } catch (e) {
      console.error('Error fetching loans:', e);
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>

        {/* Branch Selector — owners only */}
        {isOwner && branches.length > 0 && (
          <div className="flex items-center gap-2 bg-muted border rounded-lg px-3 py-1.5">
            <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer"
            >
              <option value="all">🌐 All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filter */}
        <div className="flex flex-wrap items-end gap-2 bg-card p-2 rounded-lg border shadow-sm">
          <div className="w-[140px]">
            <Label className="text-xs mb-1 block">Period</Label>
            <Select value={dateRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateRange('custom'); }}
              className="h-8 w-[130px]"
            />
          </div>
          <div>
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDateRange('custom'); }}
              className="h-8 w-[130px]"
            />
          </div>
          <Button size="sm" onClick={fetchReports} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
            Run
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parts Cost (COGS)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.totalPartsCost)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(data.summary.totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(data.summary.netProfit)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="py-2">Overview</TabsTrigger>
          <TabsTrigger value="daily" className="py-2">Daily Ledger</TabsTrigger>
          <TabsTrigger value="repairs" className="py-2">Repairs</TabsTrigger>
          <TabsTrigger value="sales" className="py-2">Sales</TabsTrigger>
          <TabsTrigger value="expenses" className="py-2">Expenses</TabsTrigger>
          <TabsTrigger value="loans" className="py-2 text-orange-600 font-semibold">
            Loans {loansData?.summary?.totalOwed > 0 && `(${loansData.summary.salesCount + loansData.summary.repairsCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? <div className="p-8 text-center">Loading...</div> : <MonthlySummary data={data} />}
        </TabsContent>

        <TabsContent value="daily">
          {loading ? <div className="p-8 text-center">Loading...</div> : <DailyReportTable data={data} />}
        </TabsContent>

        <TabsContent value="repairs">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <Card>
              <CardHeader><CardTitle>Repairs Report</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Showing {data?.details?.repairs?.length || 0} repair jobs for this period.
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left">
                      <tr className="border-b">
                        <th className="p-2">Job #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Device</th>
                        <th className="p-2">Tech</th>
                        <th className="p-2 w-1/3">Parts Used</th>
                        <th className="p-2 text-right">Revenue</th>
                        <th className="p-2 text-right">Parts Cost</th>
                        <th className="p-2 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.details?.repairs?.map((r: any) => {
                        const partsCost = r.partsUsed?.reduce(
                          (sum: number, p: any) => sum + (p.totalCost || p.unitCost * p.quantity || 0),
                          0
                        ) || 0;
                        const revenue = r.actualCost || 0;
                        const profit = revenue - partsCost;
                        return (
                          <tr key={r.id} className="border-b align-top hover:bg-muted/10">
                            <td className="p-2 font-medium whitespace-nowrap">{r.jobNumber}</td>
                            <td className="p-2 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                            <td className="p-2">{r.deviceType} <span className="text-muted-foreground">{r.brand}</span></td>
                            <td className="p-2 whitespace-nowrap">{r.assignedUser?.fullName}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {r.partsUsed && r.partsUsed.length > 0 ? (
                                  r.partsUsed.map((p: any) => (
                                    <Badge key={p.id} variant="secondary" className="font-normal text-xs whitespace-nowrap">
                                      {p.customName || p.inventoryItem?.name || 'Part'}
                                      <span className="ml-1 text-muted-foreground">
                                        ({formatCurrency(p.totalCost || p.unitCost * p.quantity)})
                                      </span>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">No parts</span>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-right font-medium text-green-700">{formatCurrency(revenue)}</td>
                            <td className="p-2 text-right text-orange-600">{formatCurrency(partsCost)}</td>
                            <td className={`p-2 text-right font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              {formatCurrency(profit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <Card>
              <CardHeader><CardTitle>Sales Report</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Showing {data?.details?.sales?.length || 0} sales for this period.
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-left">
                      <tr className="border-b">
                        <th className="p-2">Inv #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Seller</th>
                        <th className="p-2 w-1/3">Items Sold</th>
                        <th className="p-2 text-right">Revenue</th>
                        <th className="p-2 text-right">Cost (COGS)</th>
                        <th className="p-2 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.details?.sales?.map((s: any) => (
                        <tr key={s.id} className="border-b align-top hover:bg-muted/10">
                          <td className="p-2 font-medium whitespace-nowrap">{s.invoiceNumber}</td>
                          <td className="p-2 whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                          <td className="p-2 whitespace-nowrap">{s.user?.fullName}</td>
                          <td className="p-2">
                            <div className="flex flex-col gap-1">
                              {s.items?.map((item: any, idx: number) => {
                                const cost = (item.item?.unitCost || 0) * item.quantity;
                                const price = item.price * item.quantity;
                                return (
                                  <div key={idx} className="flex justify-between items-center text-xs border rounded p-1 bg-background">
                                    <span>{item.item?.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                                    <span className="font-mono">
                                      {formatCurrency(price)}
                                      <span className="text-orange-600 ml-1" title="Cost">({formatCurrency(cost)})</span>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-2 text-right font-medium text-green-700">{formatCurrency(s.total)}</td>
                          <td className="p-2 text-right text-orange-600">{formatCurrency(s.cogs || 0)}</td>
                          <td className={`p-2 text-right font-bold ${(s.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(s.profit || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(data?.summary?.totalExpenses || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data?.details?.expenses?.length || 0} recorded expense(s)
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency((data?.summary?.totalRevenue || 0) - (data?.summary?.totalPartsCost || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Revenue minus parts cost</p>
                  </CardContent>
                </Card>
                <Card className={`border-2 ${(data?.summary?.netProfit || 0) >= 0 ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}`}>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Net Profit (After Expenses)</p>
                    <p className={`text-2xl font-bold ${(data?.summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data?.summary?.netProfit || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Gross profit − expenses</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Expenses List</CardTitle>
                  <Button onClick={() => setShowAddExpense(true)} size="sm">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-left">
                        <tr className="border-b">
                          <th className="p-2">Date</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Description</th>
                          <th className="p-2">Recorded By</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.details?.expenses?.length || 0) === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No expenses recorded for this period.</td></tr>
                        ) : (
                          data?.details?.expenses?.map((e: any) => (
                            <tr key={e.id} className="border-b hover:bg-muted/10">
                              <td className="p-2 whitespace-nowrap">{formatDateTime(e.expenseDate)}</td>
                              <td className="p-2"><Badge variant="outline">{e.category}</Badge></td>
                              <td className="p-2">
                                {e.description}
                                {e.notes && <div className="text-xs text-muted-foreground mt-1">{e.notes}</div>}
                              </td>
                              <td className="p-2 whitespace-nowrap">{e.user?.fullName || 'Unknown'}</td>
                              <td className="p-2 text-right font-bold text-red-600">{formatCurrency(e.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {(data?.details?.expenses?.length || 0) > 0 && (
                        <tfoot className="bg-muted/50 border-t">
                          <tr>
                            <td colSpan={4} className="p-2 font-bold text-right">Total Expenses:</td>
                            <td className="p-2 font-bold text-right text-red-600">{formatCurrency(data?.summary?.totalExpenses || 0)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <AddExpenseDialog
            open={showAddExpense}
            onOpenChange={setShowAddExpense}
            onSuccess={fetchReports}
          />
        </TabsContent>

        {/* LOANS TAB */}
        <TabsContent value="loans">
          {loansLoading ? (
            <div className="p-8 text-center">Loading loans data...</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Owed to Shop</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(loansData?.summary?.totalOwed || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(loansData?.summary?.salesCount || 0) + (loansData?.summary?.repairsCount || 0)} open loan(s)</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">From Sales</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(loansData?.summary?.totalSalesOwed || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{loansData?.summary?.salesCount || 0} unpaid invoice(s)</p>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">From Repairs</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(loansData?.summary?.totalRepairsOwed || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{loansData?.summary?.repairsCount || 0} repair(s) with balance</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Repairs with Outstanding Balance</CardTitle></CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-left">
                        <tr className="border-b">
                          <th className="p-2">Job #</th>
                          <th className="p-2">Customer</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Device</th>
                          <th className="p-2 text-right">Total (Est.)</th>
                          <th className="p-2 text-right">Deposit</th>
                          <th className="p-2 text-right text-red-600">Balance Owed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(loansData?.unpaidRepairs?.length || 0) === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No outstanding repair balances</td></tr>
                        ) : loansData.unpaidRepairs.map((r: any) => (
                          <tr key={r.id} className="border-b hover:bg-muted/10">
                            <td className="p-2 font-medium">
                              <a href={`/repairs/${r.id}`} className="text-blue-600 hover:underline">{r.jobNumber}</a>
                            </td>
                            <td className="p-2">{r.customer?.name || 'Unknown'}<br /><span className="text-xs text-muted-foreground">{r.customer?.phone}</span></td>
                            <td className="p-2 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                            <td className="p-2">{r.deviceType} {r.brand}</td>
                            <td className="p-2 text-right">{formatCurrency(r.estimatedCost)}</td>
                            <td className="p-2 text-right text-green-600">{formatCurrency(r.depositPaid)}</td>
                            <td className="p-2 text-right font-bold text-red-600">{formatCurrency(r.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Unpaid / Partial Sales Invoices</CardTitle></CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-left">
                        <tr className="border-b">
                          <th className="p-2">Inv #</th>
                          <th className="p-2">Customer</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Paid</th>
                          <th className="p-2 text-right text-red-600">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(loansData?.unpaidSales?.length || 0) === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No unpaid sales invoices</td></tr>
                        ) : loansData.unpaidSales.map((s: any) => (
                          <tr key={s.id} className="border-b hover:bg-muted/10">
                            <td className="p-2 font-medium">{s.invoiceNumber}</td>
                            <td className="p-2">{s.customer?.name || 'Walk-in'}<br /><span className="text-xs text-muted-foreground">{s.customer?.phone}</span></td>
                            <td className="p-2 whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                            <td className="p-2">
                              <Badge variant="outline" className={s.paymentStatus === 'partial' ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}>
                                {s.paymentStatus}
                              </Badge>
                            </td>
                            <td className="p-2 text-right">{formatCurrency(s.total)}</td>
                            <td className="p-2 text-right text-green-600">{formatCurrency(s.paidAmount)}</td>
                            <td className="p-2 text-right font-bold text-red-600">{formatCurrency(s.total - s.paidAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
