'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteCustomers } from '@/lib/permissions';
import { useTranslations } from 'next-intl';

interface CustomerTableProps {
  customers: any[];
  loading: boolean;
  onUpdate: () => void;
}

const customerTypeColors = {
  walk_in: 'bg-gray-500',
  regular: 'bg-blue-500',
  vip: 'bg-purple-500',
  corporate: 'bg-green-500',
};

export function CustomerTable({ customers, loading, onUpdate }: CustomerTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const canDelete = canDeleteCustomers(user?.role);
  const t = useTranslations('customers');
  const tCommon = useTranslations('common');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{tCommon('loading')}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mb-4 opacity-50" />
            <p>{t('noCustomers')}</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-3rem)] md:max-w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('phone')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('totalSpent')}</TableHead>
                  <TableHead>{t('loyaltyPoints')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => router.push(`/customers/${customer.id}`)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>
                      <Badge className={customerTypeColors[customer.customerType as keyof typeof customerTypeColors]}>
                        {t(`types.${customer.customerType}` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell>{customer.loyaltyPoints}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/customers/${customer.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if(confirm(tCommon('confirm') + '?')) { // Simplified confirm for now
                                try {
                                    const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' });
                                    if(res.ok) {
                                        onUpdate();
                                    } else {
                                        const err = await res.json();
                                        alert(err.error || 'Failed to delete');
                                    }
                                } catch(err: any) {
                                    alert('Error deleting');
                                }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
