import { prisma } from '@/lib/prisma';
import { Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminActivityPage() {
  const logs = await prisma.userLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true } },
      branch: { select: { name: true } }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-6 w-6 text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">Global Activity Logs</h1>
      </div>
      
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Time</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Branch</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-white">{log.user.fullName}</td>
                <td className="px-6 py-4 text-blue-400">{log.branch?.name || 'Systems / HQ'}</td>
                <td className="px-6 py-4 text-emerald-400">{log.action}</td>
                <td className="px-6 py-4 text-slate-400 max-w-md truncate">{log.details || '-'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No activity logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
