'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PackageCheck, RotateCcw } from 'lucide-react';

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess: () => void;
}

export function ReturnDialog({ open, onOpenChange, invoice, onSuccess }: ReturnDialogProps) {
  const { toast } = useToast();
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!invoice) return null;

  const handleQtyChange = (itemId: string, val: string) => {
    const num = parseInt(val);
    setReturnQtys((prev) => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleSubmit = async () => {
    const itemsToReturn = invoice.items
      .filter((si: any) => (returnQtys[si.itemId] || 0) > 0)
      .map((si: any) => ({ itemId: si.itemId, returnQty: returnQtys[si.itemId] }));

    if (itemsToReturn.length === 0) {
      toast({ title: 'No items selected', description: 'Enter a quantity to return for at least one item.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${invoice.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReturn, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process return');

      toast({ title: '✅ Return processed', description: data.message });
      setReturnQtys({});
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalReturnValue = invoice.items.reduce((sum: number, si: any) => {
    const qty = returnQtys[si.itemId] || 0;
    return sum + qty * si.unitPrice;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            Process Return — Invoice #{invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the quantity to return for each item. Stock will be automatically added back.
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {invoice.items.map((si: any) => (
              <div key={si.itemId} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{si.item?.name || 'Item'}</p>
                  <p className="text-xs text-muted-foreground">
                    Sold: <span className="font-semibold">{si.quantity}</span> @ {formatCurrency(si.unitPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Return qty:</Label>
                  <Input
                    type="number"
                    min={0}
                    max={si.quantity}
                    value={returnQtys[si.itemId] || ''}
                    onChange={(e) => handleQtyChange(si.itemId, e.target.value)}
                    className="w-20 h-8 text-center"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          {totalReturnValue > 0 && (
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Total Return Value:</span>
              <Badge variant="outline" className="text-orange-600 border-orange-400 text-base font-bold">
                {formatCurrency(totalReturnValue)}
              </Badge>
            </div>
          )}

          <div className="space-y-2">
            <Label>Reason for Return</Label>
            <Textarea
              placeholder="e.g. Faulty product, wrong item, customer changed mind..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <PackageCheck className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
