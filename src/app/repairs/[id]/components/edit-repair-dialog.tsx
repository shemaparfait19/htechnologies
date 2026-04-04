'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Pencil } from 'lucide-react';

interface EditRepairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair: any;
  onSuccess: () => void;
}

export function EditRepairDialog({ open, onOpenChange, repair, onSuccess }: EditRepairDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    deviceType: repair.deviceType || '',
    brand: repair.brand || '',
    model: repair.model || '',
    serialNumber: repair.serialNumber || '',
    imei: repair.imei || '',
    problemDescription: repair.problemDescription || '',
    estimatedCost: repair.estimatedCost || 0,
    depositPaid: repair.depositPaid || 0,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/repairs/${repair.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update repair details');

      toast({
        title: 'Success',
        description: 'Repair details updated successfully',
      });

      onSuccess();
      onOpenChange(false);
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Repair Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Device Type</Label>
            <Input 
              value={formData.deviceType} 
              onChange={(e) => handleChange('deviceType', e.target.value)} 
              placeholder="e.g. Smartphone, Laptop"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Input 
                value={formData.brand} 
                onChange={(e) => handleChange('brand', e.target.value)} 
                placeholder="e.g. iPhone"
              />
            </div>
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input 
                value={formData.model} 
                onChange={(e) => handleChange('model', e.target.value)} 
                placeholder="e.g. 13 Pro"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>Serial Number</Label>
               <Input 
                 value={formData.serialNumber} 
                 onChange={(e) => handleChange('serialNumber', e.target.value)} 
               />
             </div>
             <div className="grid gap-2">
               <Label>IMEI (Optional)</Label>
               <Input 
                 value={formData.imei} 
                 onChange={(e) => handleChange('imei', e.target.value)} 
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
               <Label>Estimated Cost (RWF)</Label>
               <Input 
                 type="number"
                 value={formData.estimatedCost} 
                 onChange={(e) => handleChange('estimatedCost', parseFloat(e.target.value) || 0)} 
               />
             </div>
             <div className="grid gap-2">
               <Label>Deposit Paid (RWF)</Label>
               <Input 
                 type="number"
                 value={formData.depositPaid} 
                 onChange={(e) => handleChange('depositPaid', parseFloat(e.target.value) || 0)} 
               />
             </div>
          </div>

          <div className="grid gap-2">
            <Label>Problem Description</Label>
            <Textarea 
              value={formData.problemDescription} 
              onChange={(e) => handleChange('problemDescription', e.target.value)} 
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
