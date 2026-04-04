'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RepairCard } from './repair-card';
import { Wrench } from 'lucide-react';
import type { RepairStatus } from '@prisma/client';
import { useTranslations } from 'next-intl';

interface KanbanBoardProps {
  repairs: any[];
  loading: boolean;
  onStatusUpdate: () => void;
}

export function KanbanBoard({ repairs, loading, onStatusUpdate }: KanbanBoardProps) {
  const t = useTranslations('repairs.statuses');
  const tCommon = useTranslations('common');

  const columns: { status: RepairStatus; label: string; color: string }[] = [
    { status: 'pending', label: t('pending'), color: 'bg-gray-100' },
    { status: 'diagnosed', label: t('diagnosed'), color: 'bg-blue-100' },
    { status: 'in_progress', label: t('in_progress'), color: 'bg-yellow-100' },
    { status: 'ready', label: t('ready'), color: 'bg-green-100' },
    { status: 'collected', label: t('collected'), color: 'bg-purple-100' },
  ];

  const getRepairsByStatus = (status: RepairStatus) => {
    return repairs.filter((r) => r.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{tCommon('loading')}...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {columns.map((column) => {
        const columnRepairs = getRepairsByStatus(column.status);
        
        return (
          <Card key={column.status} className={column.color}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{column.label}</span>
                <Badge variant="secondary">{columnRepairs.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  {columnRepairs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Wrench className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No jobs</p> {/* TODO: Add translation term */}
                    </div>
                  ) : (
                    columnRepairs.map((repair) => (
                      <RepairCard
                        key={repair.id}
                        repair={repair}
                        onUpdate={onStatusUpdate}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
