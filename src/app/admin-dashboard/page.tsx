import { prisma } from '@/lib/prisma';
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, Package, Users, MapPin, AlertTriangle, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  // Fetch high-level global metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const branches = await prisma.branch.findMany({
    include: {
      _count: {
        select: { users: true, repairJobs: true }
      }
    }
  });

  // Calculate global sales today
  const salesToday = await prisma.salesInvoice.aggregate({
    where: { saleDate: { gte: startOfToday } },
    _sum: { total: true },
    _count: true
  });

  const repairsToday = await prisma.repairJob.aggregate({
    where: { completedAt: { gte: startOfToday }, status: 'collected' },
    _sum: { actualCost: true }
  });

  const totalRevenue = (salesToday._sum.total || 0) + (repairsToday._sum.actualCost || 0);

  // Recent Global Activity
  const recentLogs = await prisma.userLog.findMany({
    take: 25,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true } },
      branch: { select: { name: true } }
    }
  });

  // Calculate Global Debt (Loans/Unpaid)
  const unpaidSales = await prisma.salesInvoice.aggregate({
    where: { paymentStatus: { in: ['unpaid', 'partial'] } },
    _sum: { total: true, paidAmount: true },
    _count: true
  });
  const unpaidRepairs = await prisma.repairJob.aggregate({
    where: { balance: { gt: 0 } },
    _sum: { balance: true },
    _count: true
  });
  
  const globalDebtTotal = (unpaidSales._sum.total || 0) - (unpaidSales._sum.paidAmount || 0) + (unpaidRepairs._sum.balance || 0);

  // Global Low Stock Alerts
  const globalLowStock = await prisma.inventoryItem.count({
    where: { active: true, lowStockAlert: true } // Assuming lowStockAlert gets toggled via background or frontend
  });

  // Branch Revenue Comparison (Current Month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const branchMetrics = await Promise.all(branches.map(async (branch) => {
    const bSales = await prisma.salesInvoice.aggregate({
      where: { branchId: branch.id, saleDate: { gte: startOfMonth } },
      _sum: { total: true }
    });
    const bRepairs = await prisma.repairJob.aggregate({
      where: { branchId: branch.id, completedAt: { gte: startOfMonth }, status: 'collected' },
      _sum: { actualCost: true }
    });
    const revenue = (bSales._sum.total || 0) + (bRepairs._sum.actualCost || 0);
    return {
      ...branch,
      revenue,
      salesTotal: bSales._sum.total || 0,
      repairsTotal: bRepairs._sum.actualCost || 0
    };
  }));

  // Sort branches by revenue descending
  branchMetrics.sort((a, b) => b.revenue - a.revenue);
  const topBranch = branchMetrics[0];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Global Revenue Today</h3>
            <div className="h-8 w-8 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center mt-2 text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            <span>Across {branches.length} active branches</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Total Invoices Today</h3>
            <div className="h-8 w-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-white">{salesToday._count}</p>
          <div className="flex items-center mt-2 text-xs text-slate-500">
            <span>Global sales volume</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Top Performing Branch</h3>
            <div className="h-8 w-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold tracking-tight text-white truncate">{topBranch?.name || 'N/A'}</p>
          <div className="flex items-center mt-2 text-xs text-emerald-400 font-medium">
            <span>{formatCurrency(topBranch?.revenue || 0)} this month</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Total Staff</h3>
            <div className="h-8 w-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          {/* Sum of all users across branches */}
          <p className="text-3xl font-bold tracking-tight text-white">
            {branches.reduce((acc, b) => acc + b._count.users, 0)}
          </p>
          <div className="flex items-center mt-2 text-xs text-slate-500">
            <span>Across all locations</span>
          </div>
        </div>

        {/* Global Outstanding Debt */}
        <div className="bg-slate-900/60 border border-rose-900/40 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-400 text-sm font-medium">Global System Debt</h3>
             <div className="h-8 w-8 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
               <CreditCard className="h-4 w-4" />
             </div>
           </div>
           <p className="text-3xl font-bold tracking-tight text-white">{formatCurrency(globalDebtTotal)}</p>
           <div className="flex items-center mt-2 text-xs text-rose-400 font-medium">
             <span>Across {unpaidSales._count + unpaidRepairs._count} open invoices</span>
           </div>
        </div>

        {/* Global Low Stock Warnings */}
        <div className="bg-slate-900/60 border border-amber-900/40 rounded-xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-400 text-sm font-medium">Global Low Stock</h3>
             <div className="h-8 w-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
               <AlertTriangle className="h-4 w-4" />
             </div>
           </div>
           <p className="text-3xl font-bold tracking-tight text-white">{globalLowStock}</p>
           <div className="flex items-center mt-2 text-xs text-amber-400 font-medium">
             <span>Items dangerously low everywhere</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Comparison Table */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-400" />
            Branch Performance (MTD)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Branch Name</th>
                  <th className="px-4 py-3">Sales Rev</th>
                  <th className="px-4 py-3">Repair Rev</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Staff</th>
                </tr>
              </thead>
              <tbody>
                {branchMetrics.map((branch) => (
                  <tr key={branch.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                       {branch.name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(branch.salesTotal)}</td>
                    <td className="px-4 py-3 text-slate-300">{formatCurrency(branch.repairsTotal)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400 text-right">{formatCurrency(branch.revenue)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{branch._count.users}</td>
                  </tr>
                ))}
                {branchMetrics.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-500">No branch data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-400" />
            Global Activity Feed
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[600px]">
            {recentLogs.map((log) => (
              <div key={log.id} className="relative pl-6 border-l-2 border-slate-800 last:border-transparent pb-4 last:pb-0">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-slate-900"></span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-200">
                    {log.user.fullName} <span className="text-slate-500 font-normal">({log.branch?.name || 'HQ'})</span>
                  </span>
                  <span className="text-xs text-blue-400 mt-0.5">{log.action}</span>
                  {log.details && (
                     <span className="text-xs text-slate-400 mt-1 line-clamp-2">{log.details}</span>
                  )}
                  <span className="text-[10px] text-slate-600 mt-1.5 uppercase tracking-wider">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
               <div className="text-center text-slate-500 text-sm py-8 border border-dashed border-slate-800 rounded-lg">
                 No activity recorded yet
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
