'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/auth-provider';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item: any;
}

export function StockAdjustmentDialog({ open, onOpenChange, onSuccess, item }: StockAdjustmentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('adjustment');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const qty = parseInt(quantity);
      if (qty <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: qty,
          type: adjustmentType,
          reason,
          userId: user.id,
          notes: notes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to adjust stock');

      toast({
        title: 'Stock adjusted',
        description: `${item.name} stock has been ${adjustmentType === 'IN' ? 'increased' : 'decreased'} by ${qty}.`,
      });

      onSuccess();
      setQuantity('');
      setNotes('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust stock',
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
          <DialogTitle>Adjust Stock - {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Current Stock</Label>
            <div className="text-2xl font-bold">{item.quantity} units</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as 'IN' | 'OUT')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN">Stock In (Increase)</SelectItem>
                <SelectItem value="OUT">Stock Out (Decrease)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter quantity to adjust"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as TransactionReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase/Restock</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="repair_use">Used in Repair</SelectItem>
                <SelectItem value="damage">Damaged</SelectItem>
                <SelectItem value="theft">Theft/Loss</SelectItem>
                <SelectItem value="return">Customer Return</SelectItem>
                <SelectItem value="adjustment">Manual Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">
              New Stock Level:{' '}
              <span className="text-lg font-bold">
                {quantity
                  ? adjustmentType === 'IN'
                    ? item.quantity + parseInt(quantity)
                    : item.quantity - parseInt(quantity)
                  : item.quantity}{' '}
                units
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
