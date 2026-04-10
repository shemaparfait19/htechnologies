'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, PencilLine, RotateCcw } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { InvoiceDialog } from '../components/invoice-dialog';
import { ReturnDialog } from '../components/return-dialog';
import { EditSaleDialog } from '../components/edit-sale-dialog';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteSales } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const canDelete = canDeleteSales(user?.role);
  const canEdit = user?.role === 'owner' || user?.role === 'manager';

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
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
    setSelectedInvoice(sale);
    setShowInvoice(true);
  };

  const handleReturnClick = (sale: any) => {
    setSelectedInvoice(sale);
    setShowReturn(true);
  };

  const handleEditClick = (sale: any) => {
    setSelectedInvoice(sale);
    setShowEdit(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sale? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast({ title: 'Sale deleted' });
        fetchSales();
      } else {
        const err = await res.json();
        toast({ title: 'Failed to delete', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error deleting sale', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'unpaid': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading sales history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
          <p className="text-muted-foreground">{sales.length} total invoices</p>
        </div>
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
                <thead>
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Invoice #</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Items</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">Total</th>
                    <th className="h-12 px-4 text-left font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(sale.saleDate || sale.createdAt)}
                      </td>
                      <td className="p-4 align-middle font-medium">{sale.invoiceNumber}</td>
                      <td className="p-4 align-middle hidden md:table-cell text-sm">
                        {sale.customer?.name || <span className="text-muted-foreground italic">Walk-in</span>}
                      </td>
                      <td className="p-4 align-middle">{sale.items?.length ?? 0} items</td>
                      <td className="p-4 align-middle font-semibold">{formatCurrency(sale.total)}</td>
                      <td className="p-4 align-middle hidden sm:table-cell">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(sale.paymentStatus)}`}>
                          {sale.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <Button size="sm" variant="outline" onClick={() => handleViewInvoice(sale)} title="View Invoice">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Return */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={() => handleReturnClick(sale)}
                            title="Process Return"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>

                          {/* Edit */}
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => handleEditClick(sale)}
                              title="Edit Sale"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(sale.id)}
                              title="Delete Sale"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

      <ReturnDialog
        open={showReturn}
        onOpenChange={setShowReturn}
        invoice={selectedInvoice}
        onSuccess={fetchSales}
      />

      <EditSaleDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        invoice={selectedInvoice}
        onSuccess={fetchSales}
      />
    </div>
  );
}
