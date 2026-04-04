'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, DollarSign, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function StatsCards() {
  const t = useTranslations('dashboard.stats');
  const tCommon = useTranslations('common');
  const [stats, setStats] = useState({
    todaySales: 0,
    repairRevenue: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats({
          todaySales: data.todaySales,
          repairRevenue: data.repairRevenue,
          netProfit: data.netProfit,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsData = [
    {
      title: t('todaySales'),
      value: stats.todaySales,
      icon: DollarSign,
      description: t('todaySalesDesc'),
    },
    {
      title: t('repairRevenue'),
      value: stats.repairRevenue,
      icon: Wrench,
      description: t('repairRevenueDesc'),
    },
    {
      title: t('netProfit'),
      value: stats.netProfit,
      icon: Activity,
      description: t('netProfitDesc'),
    },
  ];

  return (
    <>
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? tCommon('loading') + '...' : formatCurrency(stat.value)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
