'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  Loader2,
  MapPin,
} from 'lucide-react';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(val);
}

export default function AdminReportsPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setBranches(d);
    });
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (selectedBranch !== 'all') params.set('branchId', selectedBranch);
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [selectedBranch, startDate, endDate]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Branch Reports</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
            <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">All Branches (Global)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none"
          />

          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: data.summary?.totalRevenue || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Sales Revenue', value: data.summary?.salesRevenue || 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Repair Revenue', value: data.summary?.repairsRevenue || 0, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Total Expenses', value: data.summary?.totalExpenses || 0, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            ].map(card => (
              <div key={card.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className={`h-9 w-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <DollarSign className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-slate-400 text-sm">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{formatCurrency(card.value)}</p>
              </div>
            ))}
          </div>

          {/* Sales Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
              <span className="text-sm text-slate-400">{data.sales?.length || 0} invoices</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales?.slice(0, 50).map((s: any) => (
                    <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-white">{s.invoiceNumber}</td>
                      <td className="px-4 py-3 text-blue-400">{s.branch?.name || 'N/A'}</td>
                      <td className="px-4 py-3">{s.user?.fullName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-400">{new Date(s.saleDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-medium">{formatCurrency(s.total)}</td>
                    </tr>
                  ))}
                  {(!data.sales || data.sales.length === 0) && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No sales found for this period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
