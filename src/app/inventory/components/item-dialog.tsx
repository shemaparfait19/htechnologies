'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSKU } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { InventoryType } from '@/lib/types';

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  type: InventoryType;
  item?: any | null;
}

export function ItemDialog({ open, onOpenChange, onSuccess, type, item }: ItemDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    unitCost: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: '',
    reorderQuantity: '',
    location: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        sku: item.sku,
        barcode: item.barcode || '',
        unitCost: item.unitCost.toString(),
        sellingPrice: item.sellingPrice.toString(),
        quantity: item.quantity.toString(),
        reorderLevel: item.reorderLevel.toString(),
        reorderQuantity: item.reorderQuantity.toString(),
        location: item.location || '',
      });
    } else {
      setFormData({
        name: '',
        sku: generateSKU(type === 'SHOP' ? 'SHOP' : 'REPAIR'),
        barcode: '',
        unitCost: '',
        sellingPrice: '',
        quantity: '0',
        reorderLevel: '10',
        reorderQuantity: '50',
        location: '',
      });
    }
  }, [item, type, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find or create category
      const categoryResponse = await fetch('/api/inventory/categories');
      let categories = [];
      if (categoryResponse.ok) {
        categories = await categoryResponse.json();
      }
      
      let categoryId = categories.find((c: any) => c.type === type)?.id;
      
      if (!categoryId) {
        // Create category if it doesn't exist
        const createCatResponse = await fetch('/api/inventory/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: type === 'SHOP' ? 'Shop Stock' : 'Repair Parts',
            type,
          }),
        });
        if (createCatResponse.ok) {
          const newCat = await createCatResponse.json();
          categoryId = newCat.id;
        }
      }

      const itemData = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode || null,
        unitCost: parseFloat(formData.unitCost),
        sellingPrice: parseFloat(formData.sellingPrice),
        quantity: parseInt(formData.quantity),
        reorderLevel: parseInt(formData.reorderLevel),
        reorderQuantity: parseInt(formData.reorderQuantity),
        location: formData.location || null,
        categoryId,
        lowStockAlert: parseInt(formData.quantity) <= parseInt(formData.reorderLevel),
        active: true,
      };

      const url = item ? `/api/inventory/${item.id}` : '/api/inventory';
      const method = item ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) throw new Error('Failed to save item');

      toast({
        title: item ? 'Item updated' : 'Item added',
        description: `${formData.name} has been ${item ? 'updated' : 'added'} successfully.`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode (Optional)</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitCost">Unit Cost (RWF) *</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price (RWF) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Current Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level *</Label>
              <Input
                id="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder Quantity *</Label>
              <Input
                id="reorderQuantity"
                type="number"
                value={formData.reorderQuantity}
                onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Shelf A1, Storage Room"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
