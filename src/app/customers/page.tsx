'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { CustomerTable } from './components/customer-table';
import { CustomerDialog } from './components/customer-dialog';
import { useTranslations } from 'next-intl';

export default function CustomersPage() {
  const t = useTranslations('customers');
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          (c.email && c.email.toLowerCase().includes(query))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setCustomers(data);
        setFilteredCustomers(data);
      } else {
        setCustomers([]);
        setFilteredCustomers([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Don't clear existing customers on error, just stop loading
      setLoading(false);
    }
  };

  const handleCustomerSaved = () => {
    fetchCustomers();
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            Manage customer database and view history
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addCustomer')}
        </Button>
      </div>

      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <CustomerTable
        customers={filteredCustomers}
        loading={loading}
        onUpdate={fetchCustomers}
      />

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleCustomerSaved}
      />
    </div>
  );
}
