'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, CreditCard, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export function AttentionNeeded() {
  const t = useTranslations('dashboard');
  const tStats = useTranslations('dashboard.stats');
  const [stats, setStats] = useState({
    lowStockItems: 0,
    overdueRepairs: 0,
    unpaidInvoices: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats({
          lowStockItems: data.lowStockItems,
          overdueRepairs: data.overdueRepairs,
          unpaidInvoices: data.unpaidInvoices,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const alerts = [
    {
      text: `${stats.lowStockItems} ${tStats('itemsLowStock')}`,
      icon: Package,
      className: 'text-yellow-600',
    },
    {
      text: `${stats.overdueRepairs} ${tStats('repairsOverdue')}`,
      icon: Clock,
      className: 'text-red-600',
    },
    {
      text: `${formatCurrency(stats.unpaidInvoices)} ${tStats('unpaidInvoices')}`,
      icon: CreditCard,
      className: 'text-blue-600',
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('attentionNeeded')}</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {alerts.map((alert, index) => (
            <li key={index} className="flex items-center">
              <alert.icon
                className={`h-5 w-5 mr-3 ${alert.className}`}
              />
              <span className="font-medium">{alert.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
