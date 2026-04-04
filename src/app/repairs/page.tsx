'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { KanbanBoard } from './components/kanban-board';
import { NewRepairDialog } from './components/new-repair-dialog';
import { useAuth } from '@/app/components/auth-provider';
import { useTranslations } from 'next-intl';

export default function RepairsPage() {
  const t = useTranslations('repairs');
  const tNav = useTranslations('nav');
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [filteredRepairs, setFilteredRepairs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchRepairs();
    const interval = setInterval(fetchRepairs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRepairs();
  }, [repairs, searchQuery, activeTab]);

  const fetchRepairs = async () => {
    try {
      const response = await fetch('/api/repairs');
      const data = await response.json();
      setRepairs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repairs:', error);
      setLoading(false);
    }
  };

  const filterRepairs = () => {
    let filtered = [...repairs];

    if (activeTab === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(
        (r) =>
          new Date(r.promisedDate) < now &&
          !['collected', 'abandoned'].includes(r.status)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.jobNumber.toLowerCase().includes(query) ||
          r.customer.name.toLowerCase().includes(query) ||
          r.deviceType.toLowerCase().includes(query) ||
          r.brand.toLowerCase().includes(query) ||
          r.model.toLowerCase().includes(query)
      );
    }

    setFilteredRepairs(filtered);
  };

  const handleRepairCreated = () => {
    fetchRepairs();
    setDialogOpen(false);
  };

  const handleStatusUpdate = () => {
    fetchRepairs();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            Manage and track all repair jobs
          </p>
        </div>
        {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'sales') && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newRepair')}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">{t('title')}</TabsTrigger>
            <TabsTrigger value="overdue">{t('title')} - Overdue</TabsTrigger> {/* Using title as placeholder since overdue key might be missing */}
            <TabsTrigger value="my-jobs">My Jobs</TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          <KanbanBoard
            repairs={filteredRepairs}
            loading={loading}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>
      </Tabs>

      <NewRepairDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleRepairCreated}
      />
    </div>
  );
}
