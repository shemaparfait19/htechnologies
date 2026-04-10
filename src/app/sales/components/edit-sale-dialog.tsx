'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PencilLine, Plus, Trash2, Save } from 'lucide-react';
import { CustomerSearch } from './customer-search';

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess: () => void;
}

export function EditSaleDialog({ open, onOpenChange, invoice, onSuccess }: EditSaleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Initialise from invoice
  useEffect(() => {
    if (invoice && open) {
      setPaymentMethod(invoice.paymentMethod || 'cash');
      setDiscount(invoice.discount || 0);
      setAmountPaid(invoice.paidAmount || invoice.total || 0);
      setSelectedCustomer(invoice.customer || null);
      setCartItems(
        invoice.items.map((si: any) => ({
          itemId: si.itemId,
          name: si.item?.name || 'Item',
          quantity: si.quantity,
          unitPrice: si.unitPrice,
          maxStock: si.item?.quantity ?? 999, // current stock + already sold (approx)
        }))
      );
    }
  }, [invoice, open]);

  // Load inventory for item picker
  useEffect(() => {
    if (open) {
      fetch('/api/inventory')
        .then((r) => r.json())
        .then((data) => setInventoryItems(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [open]);

  const [itemSearch, setItemSearch] = useState('');

  if (!invoice) return null;

  const subtotal = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal - (discount || 0);

  const updateItem = (idx: number, field: string, value: any) => {
    setCartItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const removeItem = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addItem = (invItem: any) => {
    const exists = cartItems.find((c) => c.itemId === invItem.id);
    if (exists) {
      setCartItems((prev) =>
        prev.map((c) => (c.itemId === invItem.id ? { ...c, quantity: c.quantity + 1 } : c))
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          itemId: invItem.id,
          name: invItem.name,
          quantity: 1,
          unitPrice: invItem.sellingPrice,
          maxStock: invItem.quantity,
        },
      ]);
    }
  };

  const handleSave = async () => {
    if (cartItems.length === 0) {
      toast({ title: 'No items', description: 'Add at least one item.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: 0,
          })),
          customerId: selectedCustomer?.id || null,
          paymentMethod,
          discount,
          amountPaid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update sale');

      toast({ title: '✅ Sale updated', description: `Invoice ${invoice.invoiceNumber} has been updated.` });
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredInv = inventoryItems.filter(
    (i) =>
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.sku?.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-5 w-5 text-blue-500" />
            Edit Invoice #{invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Cart */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Sale Items</h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate flex-1">{item.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-500 h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-8 text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-8 text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Subtotal</Label>
                      <p className="h-8 flex items-center justify-center text-sm font-semibold text-primary">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {cartItems.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">No items yet. Add from the list →</p>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Discount:</span>
                <Input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="h-7 w-28 text-right"
                />
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Amount Paid:</span>
                <Input
                  type="number"
                  min={0}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="h-7 w-28 text-right"
                />
              </div>
              {amountPaid < total && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(total - amountPaid)}</span>
                </div>
              )}
            </div>

            {/* Payment & Customer */}
            <div className="space-y-3">
              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="momo_mtn">MTN MoMo</SelectItem>
                    <SelectItem value="momo_airtel">Airtel Money</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Customer</Label>
                <CustomerSearch onSelectCustomer={setSelectedCustomer} selectedCustomer={selectedCustomer} />
              </div>
            </div>
          </div>

          {/* Right: Add Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Add Items</h3>
            <Input
              placeholder="Search products..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredInv.slice(0, 30).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between border rounded-lg p-2.5 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => addItem(inv)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.name}</p>
                    <p className="text-xs text-muted-foreground">Stock: {inv.quantity} | {formatCurrency(inv.sellingPrice)}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 ml-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filteredInv.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-6">No products found</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
