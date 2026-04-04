import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard, Users, Activity, Settings, LogOut, ShieldAlert, BarChart3 } from 'lucide-react';
import { getSessionUser } from '@/lib/auth-helper';
import { auth } from '@/lib/auth';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawAuth = await auth();
  const session = await getSessionUser();
  console.log('AdminDashboardLayout - rawAuth:', JSON.stringify(rawAuth, null, 2));
  console.log('AdminDashboardLayout - getSessionUser:', JSON.stringify(session, null, 2));

  if (!session || !session.user) {
    redirect('/login');
  }

  if (session.user.role !== 'owner') {
    redirect('/dashboard');
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get('admin_unlocked')?.value;

  if (unlocked !== 'true') {
    redirect('/admin-pin');
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-50 flex selection:bg-blue-500/30">
      {/* Executive Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-900/50 backdrop-blur-xl flex flex-col hidden md:flex relative z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 font-bold tracking-tight gap-2">
          <ShieldAlert className="h-5 w-5 text-blue-500" />
          <span>EXECUTIVE VIEW</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin-dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600/10 text-blue-400 font-medium transition-colors border border-blue-500/20">
            <LayoutDashboard className="h-4 w-4" />
            Global Overview
          </Link>
          <Link href="/admin-dashboard/activity" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Activity className="h-4 w-4" />
            Activity Logs
          </Link>
          <Link href="/admin-dashboard/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <BarChart3 className="h-4 w-4" />
            Branch Reports
          </Link>
          <Link href="/admin-dashboard/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
            <Users className="h-4 w-4" />
            Global Directory
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
          <Link href="/admin-dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors mb-1">
            <Settings className="h-4 w-4" />
            PIN Settings
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut className="h-4 w-4" />
            Exit Executive Mode
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
        
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60 bg-slate-900/30 backdrop-blur-md z-10">
          <h1 className="text-xl font-semibold tracking-tight">Managing Director</h1>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-sm font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]">
               CH
             </div>
             <span className="text-sm font-medium hidden sm:block">Celestin HABIMANA</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 lg:p-8 z-10 max-h-[calc(100vh-64px)] scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}
