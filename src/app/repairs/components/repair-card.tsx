import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Clock, User, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/auth-provider';
import { useTranslations } from 'next-intl';

interface RepairCardProps {
  repair: any;
  onUpdate: () => void;
}

const priorityColors = {
  normal: 'bg-gray-500',
  urgent: 'bg-orange-500',
  express: 'bg-red-500',
};

export function RepairCard({ repair, onUpdate }: RepairCardProps) {
  const t = useTranslations('repairs.actions');
  const tRepairs = useTranslations('repairs');
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isOverdue = new Date(repair.promisedDate) < new Date() && 
    !['collected', 'abandoned'].includes(repair.status);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/repairs/${repair.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: t('statusUpdated'),
        description: t('jobMoved', {jobNumber: repair.jobNumber, status: newStatus}),
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-500 border-2' : ''
      }`}
      onClick={() => router.push(`/repairs/${repair.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-semibold">
              {repair.jobNumber}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {repair.customer.name}
            </p>
          </div>
          {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'sales') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('diagnosed');
                }}>
                  {t('markDiagnosed')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('in_progress');
                }}>
                  {t('startRepair')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('ready');
                }}>
                  {t('markReady')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('collected');
                }}>
                  {t('markCollected')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className={priorityColors[repair.priority as keyof typeof priorityColors]}>
            {tRepairs(`form.priorities.${repair.priority}`)}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              {tRepairs('overdue')}
            </Badge>
          )}
        </div>
        
        <p className="text-sm font-medium">
          {repair.deviceType} - {repair.brand}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {repair.problemDescription}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(new Date(repair.promisedDate))}</span>
          </div>
          {repair.assignedUser && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">{repair.assignedUser.fullName.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {repair.estimatedCost > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-semibold">
              {formatCurrency(repair.estimatedCost)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
