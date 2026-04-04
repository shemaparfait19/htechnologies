import { StatsCards } from './components/stats-cards';
import { AttentionNeeded } from './components/attention-needed';
import { RepairStatus } from './components/repair-status';
import { RecentRepairs } from './components/recent-repairs';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCards />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <RepairStatus />
          <RecentRepairs />
        </div>
        <div className="lg:col-span-1">
          <AttentionNeeded />
        </div>
      </div>
    </div>
  );
}
