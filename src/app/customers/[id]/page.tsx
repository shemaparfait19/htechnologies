'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, CreditCard, History, ShoppingCart, Wrench } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteCustomers } from '@/lib/permissions';
import { CustomerDialog } from '../components/customer-dialog';
import { useToast } from '@/hooks/use-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const canDelete = canDeleteCustomers(user?.role);
  
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCustomer();
    }
  }, [params.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      } else {
        toast({ title: 'Customer not found', variant: 'destructive' });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customer:', error);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if(!confirm('Are you sure you want to delete this customer? All sales and history will be affected.')) return;
    
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: 'DELETE' });
      if(res.ok) {
        toast({ title: 'Customer deleted' });
        router.push('/customers');
      } else {
        const err = await res.json();
        toast({ title: 'Failed to delete', description: err.error, variant: 'destructive' });
      }
    } catch(e) {
      toast({ title: 'Error deleting customer', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center">Customer not found</div>;
  }

  // Merge repairs and sales into a single timeline
  const repairs = (customer.repairJobs || []).map((r: any) => ({
    id: r.id,
    type: 'repair',
    date: r.createdAt,
    ref: r.jobNumber,
    description: `${r.deviceType} - ${r.brand} ${r.model}`,
    amount: r.actualCost || r.estimatedCost,
    balance: r.balance,
    status: r.status,
    href: `/repairs/${r.id}`,
  }));

  const sales = (customer.salesInvoices || []).map((s: any) => ({
    id: s.id,
    type: 'sale',
    date: s.saleDate || s.createdAt,
    ref: s.invoiceNumber,
    description: `Sale - ${s.items?.length || 0} item(s)`,
    amount: s.total,
    balance: s.total - (s.paidAmount || 0),
    status: s.paymentStatus,
    href: null,
  }));

  const timeline = [...repairs, ...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalOwed = timeline.reduce((sum, t) => sum + (t.balance > 0 ? t.balance : 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/customers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{customer.customerType}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Customer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{customer.phone}</p>
                {customer.phone2 && <p className="text-sm text-muted-foreground">{customer.phone2}</p>}
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p>{customer.email}</p>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p>{customer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Total Spent</span>
              </div>
              <span className="font-bold text-lg">{formatCurrency(customer.totalSpent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span>Loyalty Points</span>
              </div>
              <span className="font-bold text-lg">{customer.loyaltyPoints}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span>Visits</span>
              </div>
              <span className="font-bold text-lg">{timeline.length}</span>
            </div>
            {totalOwed > 0 && (
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-950 rounded-md p-2">
                <span className="text-sm text-red-600 font-medium">Outstanding Balance</span>
                <span className="font-bold text-red-600">{formatCurrency(totalOwed)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {customer.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{customer.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction History Tab */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Transaction History ({timeline.length})
          </TabsTrigger>
          <TabsTrigger value="repairs">
            <Wrench className="h-4 w-4 mr-2" />
            Repairs ({customer.repairJobs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sales">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Sales ({customer.salesInvoices?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Combined Timeline */}
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr className="border-b">
                      <th className="p-2">Date</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Ref</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Amount</th>
                      <th className="p-2 text-right">Balance</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No transactions yet</td></tr>
                    ) : timeline.map((tx) => (
                      <tr key={tx.id} className="border-b hover:bg-muted/10">
                        <td className="p-2 whitespace-nowrap">{formatDateTime(tx.date)}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={tx.type === 'repair' ? 'border-orange-500 text-orange-600' : 'border-blue-500 text-blue-600'}>
                            {tx.type === 'repair' ? <Wrench className="h-3 w-3 mr-1 inline" /> : <ShoppingCart className="h-3 w-3 mr-1 inline" />}
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {tx.href ? <a href={tx.href} className="text-blue-600 hover:underline">{tx.ref}</a> : tx.ref}
                        </td>
                        <td className="p-2">{tx.description}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(tx.amount)}</td>
                        <td className="p-2 text-right font-bold text-red-600">{tx.balance > 0 ? formatCurrency(tx.balance) : <span className="text-green-600">Paid</span>}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={
                            tx.status === 'paid' || tx.status === 'collected' ? 'border-green-500 text-green-600' :
                            tx.status === 'partial' ? 'border-yellow-500 text-yellow-600' : 'border-gray-400 text-gray-600'
                          }>{tx.status?.replace('_', ' ')}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repairs only */}
        <TabsContent value="repairs">
          <Card>
            <CardHeader><CardTitle>Repair History</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr className="border-b">
                      <th className="p-2">Job #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Device</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.repairJobs?.length || 0) === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No repairs found</td></tr>
                    ) : customer.repairJobs.map((r: any) => (
                      <tr key={r.id} className="border-b hover:bg-muted/10">
                        <td className="p-2"><a href={`/repairs/${r.id}`} className="text-blue-600 hover:underline font-medium">{r.jobNumber}</a></td>
                        <td className="p-2 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                        <td className="p-2">{r.deviceType} {r.brand} {r.model}</td>
                        <td className="p-2"><Badge variant="outline">{r.status.replace('_', ' ')}</Badge></td>
                        <td className="p-2 text-right">{formatCurrency(r.actualCost || r.estimatedCost)}</td>
                        <td className="p-2 text-right font-bold text-red-600">{r.balance > 0 ? formatCurrency(r.balance) : <span className="text-green-600">Paid</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales only */}
        <TabsContent value="sales">
          <Card>
            <CardHeader><CardTitle>Purchase History</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left">
                    <tr className="border-b">
                      <th className="p-2">Inv #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Payment</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customer.salesInvoices?.length || 0) === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No purchases found</td></tr>
                    ) : customer.salesInvoices.map((s: any) => (
                      <tr key={s.id} className="border-b hover:bg-muted/10">
                        <td className="p-2 font-medium">{s.invoiceNumber}</td>
                        <td className="p-2 whitespace-nowrap">{formatDateTime(s.saleDate)}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={s.paymentStatus === 'paid' ? 'border-green-500 text-green-600' : s.paymentStatus === 'partial' ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}>
                            {s.paymentStatus}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{formatCurrency(s.total)}</td>
                        <td className="p-2 text-right text-green-600">{formatCurrency(s.paidAmount || 0)}</td>
                        <td className="p-2 text-right font-bold text-red-600">{(s.total - (s.paidAmount || 0)) > 0 ? formatCurrency(s.total - s.paidAmount) : <span className="text-green-600">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        customer={customer}
        onSuccess={() => {
          fetchCustomer();
          setShowEditDialog(false);
        }}
      />
    </div>
  );
}
