'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface StatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair: any;
  onSuccess: () => void;
}

export function StatusUpdateDialog({ open, onOpenChange, repair, onSuccess }: StatusUpdateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState(repair.status);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/repairs/${repair.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast({
        title: 'Status updated',
        description: `Repair status changed to ${newStatus.replace('_', ' ')}`,
      });

      onSuccess();
      onOpenChange(false);
      setNotes('');

      // Prompt for Client Notification
      if (newStatus === 'ready' || newStatus === 'collected') {
        if (confirm('Do you want to notify the client via WhatsApp about this update?')) {
          const phone = repair.customer?.phone ? repair.customer.phone.replace(/\D/g, '') : '';
          let finalPhone = phone;
          
          if (finalPhone) {
             if (finalPhone.startsWith('07')) finalPhone = '250' + finalPhone.substring(1);
             else if (finalPhone.startsWith('7')) finalPhone = '250' + finalPhone;
             
             const message = newStatus === 'ready' 
                ? `Hello ${repair.customer.name}, your device (${repair.deviceType}) is ready for pickup at H TECHNOLOGIES LTD.`
                : `Hello ${repair.customer.name}, thank you for collecting your device. We appreciate your business!`;
             
             window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
          } else {
             alert('Customer phone number not available.');
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Repair Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="diagnosed">Diagnosed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready">Ready for Pickup</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
