'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, FileText, Package, Clock, CheckCircle, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency, formatDateTime, getRepairStatusColor, getPriorityColor } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteRepairs } from '@/lib/permissions';
import { RepairTimeline } from './components/repair-timeline';
import { DiagnosisForm } from './components/diagnosis-form';
import { PartsUsed } from './components/parts-used';
import { PhotoGallery } from './components/photo-gallery';
import { StatusUpdateDialog } from './components/status-update-dialog';
import { RepairInvoiceDialog } from './components/repair-invoice-dialog';
import { EditRepairDialog } from './components/edit-repair-dialog';
import { Pencil } from 'lucide-react';

export default function RepairDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [internalSaleLoading, setInternalSaleLoading] = useState(false);
  const canDelete = canDeleteRepairs(user?.role);
  const handleDelete = async () => {
    if(!confirm('Are you sure you want to delete this repair job? This action cannot be undone.')) return;
    try {
        const res = await fetch(`/api/repairs/${params.id}`, { method: 'DELETE' });
        if(res.ok) {
            toast({ title: 'Repair deleted' });
            router.push('/repairs');
        } else {
            const err = await res.json();
            toast({ title: 'Failed to delete', description: err.error, variant: 'destructive' });
        }
    } catch(e) {
        toast({ title: 'Error deleting', variant: 'destructive' });
    }
  };

  const handleInternalSale = async () => {
    const shopParts = repair.partsUsed?.filter((p: any) => p.inventoryItem?.category?.type === 'SHOP' || p.itemId);
    if (!shopParts?.length) {
      toast({ title: 'No inventory parts found', description: 'Add parts from SHOP inventory first', variant: 'destructive' });
      return;
    }
    if (!confirm(`This will create an internal sales invoice for ${shopParts.length} part(s) used in this repair. Continue?`)) return;
    setInternalSaleLoading(true);
    try {
      const res = await fetch(`/api/repairs/${params.id}/internal-sale`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Internal sale recorded!', description: `Invoice ${data.invoiceNumber} created` });
        fetchRepair();
      } else {
        toast({ title: 'Failed', description: data.error, variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error creating internal sale', variant: 'destructive' });
    } finally {
      setInternalSaleLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchRepair();
    }
  }, [params.id]);

  const fetchRepair = async () => {
    try {
      const response = await fetch(`/api/repairs/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRepair(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching repair:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading repair details...</div>;
  }

  if (!repair) {
    return <div className="p-8 text-center">Repair not found</div>;
  }

  const statusColor = getRepairStatusColor(repair.status);
  const priorityColor = getPriorityColor(repair.priority);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/repairs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{repair.jobNumber}</h2>
            <p className="text-muted-foreground">
              {repair.deviceType} - {repair.brand} {repair.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={priorityColor.bgColor + ' ' + priorityColor.color}>
            {repair.priority}
          </Badge>
          <Badge className={statusColor.bgColor + ' ' + statusColor.color}>
            {repair.status.replace('_', ' ')}
          </Badge>
          <Button variant="outline" onClick={() => setShowInvoiceDialog(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          {(user?.role === 'owner' || user?.role === 'manager') && repair.partsUsed?.length > 0 && (
            <Button variant="outline" onClick={handleInternalSale} disabled={internalSaleLoading}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {internalSaleLoading ? 'Recording...' : 'Record Parts Sale'}
            </Button>
          )}
          {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'technician') && (
             <Button variant="outline" onClick={() => setShowEditDialog(true)}>
               <Pencil className="h-4 w-4 mr-2" />
               Edit Job
             </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'sales') && (
            <Button onClick={() => setShowStatusDialog(true)}>
              Update Status
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="parts">Parts</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Device Type</p>
                      <p className="font-medium">{repair.deviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Brand</p>
                      <p className="font-medium">{repair.brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{repair.model}</p>
                    </div>
                    {repair.serialNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Serial Number</p>
                        <p className="font-medium font-mono text-sm">{repair.serialNumber}</p>
                      </div>
                    )}
                    {repair.imei && (
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="font-medium font-mono text-sm">{repair.imei}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{repair.problemDescription}</p>
                </CardContent>
              </Card>

              {repair.diagnosisNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnosis Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{repair.diagnosisNotes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="diagnosis">
              <DiagnosisForm repair={repair} onUpdate={fetchRepair} />
            </TabsContent>

            <TabsContent value="parts">
              <PartsUsed repair={repair} onUpdate={fetchRepair} />
            </TabsContent>

            <TabsContent value="photos">
              <PhotoGallery repair={repair} onUpdate={fetchRepair} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Timeline & Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{repair.customer.name}</p>
              <p className="text-sm text-muted-foreground">{repair.customer.phone}</p>
              {repair.customer.email && (
                <p className="text-sm text-muted-foreground">{repair.customer.email}</p>
              )}
            </CardContent>
          </Card>

          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(repair.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Promised Date</p>
                <p className="font-medium">{formatDateTime(repair.promisedDate)}</p>
              </div>
              {repair.assignedUser && (
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{repair.assignedUser.fullName}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="font-medium">{formatCurrency(repair.estimatedCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposit Paid</p>
                <p className="font-medium">{formatCurrency(repair.depositPaid)}</p>
              </div>
              {repair.actualCost > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Final Cost</p>
                  <p className="font-medium text-lg">{formatCurrency(repair.actualCost)}</p>
                </div>
              )}
              {repair.balance > 0 && (
                <div className="bg-red-50 dark:bg-red-950 rounded-md p-3 border border-red-200">
                  <p className="text-sm font-medium text-red-600">Balance Owed by Customer</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(repair.balance)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Customer has not paid this amount yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <RepairTimeline repair={repair} />
        </div>
      </div>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        repair={repair}
        onSuccess={fetchRepair}
      />

      {/* Invoice Dialog */}
      <RepairInvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        repair={repair}
      />
      {/* Edit Repair Dialog */}
      <EditRepairDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        repair={repair}
        onSuccess={fetchRepair}
      />
    </div>
  );
}
