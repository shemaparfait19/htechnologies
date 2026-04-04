'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Edit, Package, Trash2 } from 'lucide-react';
import { formatCurrency, getStockLevel } from '@/lib/utils';
import type { InventoryType } from '@/lib/types';
import { ItemDialog } from './item-dialog';
import { StockAdjustmentDialog } from './stock-adjustment-dialog';
import { useAuth } from '@/app/components/auth-provider';
import { canDeleteInventory, canEditInventory, hasPermission } from '@/lib/permissions';
import { useTranslations } from 'next-intl';

interface InventoryTableProps {
  type: InventoryType;
}

export function InventoryTable({ type }: InventoryTableProps) {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editItem, setEditItem] = useState<any | null>(null);
  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const showCostPrice = hasPermission(user?.role, 'view_cost_price');
  const canDelete = canDeleteInventory(user?.role);
  const canEdit = canEditInventory(user?.role);
  const canAdjust = hasPermission(user?.role, 'adjust_stock');

  useEffect(() => {
    fetchItems();
    // Refresh every 30 seconds
    const interval = setInterval(fetchItems, 30000);
    return () => clearInterval(interval);
  }, [type]);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      // Filter by category type
      const filtered = data.filter((item: any) => 
        item.active && item.category?.type === type
      );
      setItems(filtered);
      setFilteredItems(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.barcode && item.barcode.toLowerCase().includes(query))
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">{tCommon('loading')}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Inventory Value Summary */}
          {items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-muted/40 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{items.reduce((s, i) => s + i.quantity, 0)}</p>
                <p className="text-xs text-muted-foreground">{items.length} SKUs</p>
              </div>
              {showCostPrice && (
                <div className="bg-muted/40 rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground">Stock Value (Cost)</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}</p>
                </div>
              )}
              <div className="bg-muted/40 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">Retail Value</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(items.reduce((s, i) => s + i.quantity * i.sellingPrice, 0))}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">Low Stock</p>
                <p className="text-xl font-bold text-red-600">{items.filter(i => i.quantity <= i.reorderLevel).length}</p>
                <p className="text-xs text-muted-foreground">need restocking</p>
              </div>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? t('noItemsFound') : t('noItems')}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto max-w-[calc(100vw-3rem)] md:max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead> {/* TODO: Add 'name' to translations if missing, or use common term */}
                    <TableHead>{t('sku')}</TableHead>
                    <TableHead>{t('stockLevel')}</TableHead>
                    {showCostPrice && <TableHead>{t('unitCost')}</TableHead>}
                    <TableHead>{t('sellingPrice')}</TableHead>
                    <TableHead>{t('reorderLevel')}</TableHead>
                    <TableHead>{t('location')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const stockLevel = getStockLevel(item.quantity, item.reorderLevel);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.quantity}</span>
                            <Badge
                              variant="outline"
                              className={`${stockLevel.color} ${stockLevel.bgColor} border-0`}
                            >
                              {stockLevel.status}
                            </Badge>
                          </div>
                        </TableCell>
                        {showCostPrice && <TableCell>{formatCurrency(item.unitCost)}</TableCell>}
                        <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                        <TableCell>{item.reorderLevel}</TableCell>
                        <TableCell>{item.location || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canAdjust && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAdjustItem(item)}
                              >
                                <Package className="h-4 w-4 mr-1" />
                                {t('adjust')}
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditItem(item)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {tCommon('edit')}
                              </Button>
                            )}
                            {canDelete && (
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                    if(confirm(tCommon('confirm') + '?')) {
                                        try {
                                            const res = await fetch(`/api/inventory/${item.id}`, { method: 'DELETE', credentials: 'include' });
                                            if(res.ok) {
                                                fetchItems();
                                            } else {
                                                const err = await res.json();
                                                alert(err.error || 'Failed to delete');
                                            }
                                        } catch(err: any) {
                                            alert('Error deleting item');
                                        }
                                    }
                                }}
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editItem && (
        <ItemDialog
          open={!!editItem}
          onOpenChange={(open) => {
            if (!open) setEditItem(null);
          }}
          onSuccess={() => {
            setEditItem(null);
            fetchItems();
          }}
          type={type}
          item={editItem}
        />
      )}

      {adjustItem && (
        <StockAdjustmentDialog
          open={!!adjustItem}
          onOpenChange={(open) => {
            if (!open) setAdjustItem(null);
          }}
          onSuccess={() => {
            setAdjustItem(null);
            fetchItems();
          }}
          item={adjustItem}
        />
      )}
    </>
  );
}
