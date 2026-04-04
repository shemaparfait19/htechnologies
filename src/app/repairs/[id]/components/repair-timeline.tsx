'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Package, Wrench, User } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface RepairTimelineProps {
  repair: any;
}

export function RepairTimeline({ repair }: RepairTimelineProps) {
  const events = [
    {
      icon: User,
      title: 'Job Created',
      description: `Created by ${repair.createdBy}`,
      timestamp: repair.createdAt,
      color: 'text-blue-600',
    },
  ];

  if (repair.diagnosedAt) {
    events.push({
      icon: Wrench,
      title: 'Diagnosed',
      description: repair.diagnosisNotes ? 'Diagnosis completed' : 'Status updated',
      timestamp: repair.diagnosedAt,
      color: 'text-purple-600',
    });
  }

  if (repair.startedAt) {
    events.push({
      icon: Clock,
      title: 'Repair Started',
      description: 'Work in progress',
      timestamp: repair.startedAt,
      color: 'text-orange-600',
    });
  }

  if (repair.completedAt) {
    events.push({
      icon: CheckCircle,
      title: 'Repair Completed',
      description: 'Ready for collection',
      timestamp: repair.completedAt,
      color: 'text-green-600',
    });
  }

  if (repair.collectedAt) {
    events.push({
      icon: Package,
      title: 'Device Collected',
      description: 'Job closed',
      timestamp: repair.collectedAt,
      color: 'text-gray-600',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div key={index} className="flex gap-3">
                <div className={`mt-1 ${event.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
