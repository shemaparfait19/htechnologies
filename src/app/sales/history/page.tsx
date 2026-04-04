'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { InvoiceDialog } from '../components/invoice-dialog';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteSales } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const canDelete = canDeleteSales(user?.role);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (sale: any) => {
    // Transform sale data to invoice format if needed, or pass directly
    // The InvoiceDialog expects an 'invoice' object.
    // Assuming sale object has necessary fields or compatible structure
    setSelectedInvoice(sale);
    setShowInvoice(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale record? This action cannot be undone.')) return;

    try {
        const res = await fetch(`/api/sales/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
            toast({ title: 'Sale deleted' });
            fetchSales();
        } else {
            const err = await res.json();
            toast({ title: 'Failed to delete', description: err.error, variant: 'destructive' });
        }
    } catch (e) {
        toast({ title: 'Error deleting sale', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sales history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales recorded yet.</p>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Invoice #</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Items</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Payment</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">{formatDateTime(sale.createdAt)}</td>
                      <td className="p-4 align-middle font-medium">{sale.invoiceNumber}</td>
                      <td className="p-4 align-middle">{sale.items.length} items</td>
                      <td className="p-4 align-middle">{formatCurrency(sale.totalAmount)}</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="capitalize">
                          {sale.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(sale)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Invoice
                        </Button>
                        {canDelete && (
                            <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(sale.id)}
                            >
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceDialog
        open={showInvoice}
        onOpenChange={setShowInvoice}
        invoice={selectedInvoice}
      />
    </div>
  );
}
