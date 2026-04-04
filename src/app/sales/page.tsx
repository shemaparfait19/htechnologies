'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Search, Trash2, ShoppingCart, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/components/auth-provider';
import { useRouter } from 'next/navigation';
import { CustomerSearch } from './components/customer-search';
import { InvoiceDialog } from './components/invoice-dialog';
import { canManageSales } from '@/lib/permissions';
import { useTranslations } from 'next-intl';

export default function SalesPage() {
  const t = useTranslations('sales');
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  
  if (user && !canManageSales(user.role)) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <h2 className="text-2xl font-bold text-red-600">Unauthorized</h2>
              <p className="text-muted-foreground">You do not have permission to access the Point of Sale.</p>
          </div>
      )
  }

  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.includes(searchQuery))
  );

  const addToCart = (item: any) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(
        cart.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map((c) => (c.id === itemId ? { ...c, quantity } : c)));
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
  const tax = 0; // Add tax calculation if needed
  const total = subtotal + tax;

  const handleCheckout = async () => {
    // if (!user) return; // Allow API fallback to handle auth/default user
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to cart before checkout',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            itemId: item.id,
            quantity: item.quantity,
            unitPrice: item.sellingPrice,
            discount: 0,
          })),
          paymentMethod,
          subtotal,
          tax,
          total,
          paidAmount: total,
          userId: user?.id || null, // Allow API to handle null/fallback
          customerId: selectedCustomer?.id || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to process sale');

      const sale = await response.json();

      toast({
        title: 'Sale completed',
        description: `Invoice ${sale.invoiceNumber} created successfully`,
      });

      // Show invoice
      setCreatedInvoice(sale);
      setShowInvoice(true);

      // Reset form
      setCart([]);
      setSearchQuery('');
      setSelectedCustomer(null);
      fetchItems(); // Refresh inventory
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">
            Manage sales and invoices
          </p>
        </div>
        {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'sales') && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/sales/history')}>
              <History className="mr-2 h-4 w-4" />
              {t('history')}
            </Button>
            <Button onClick={() => setShowInvoice(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('newSale')}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('products')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
              {filteredItems.slice(0, 20).map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-primary">
                        {formatCurrency(item.sellingPrice)}
                      </p>
                      <p className="text-xs">{t('stock')}: {item.quantity}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('cart')} ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Search */}
            <CustomerSearch
              onSelectCustomer={setSelectedCustomer}
              selectedCustomer={selectedCustomer}
            />

            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('cartEmpty')}
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.sellingPrice)} × {item.quantity} = {formatCurrency(item.sellingPrice * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="flex flex-col items-end gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 text-center h-8"
                            placeholder="Qty"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={item.sellingPrice}
                            onChange={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                setCart(cart.map(c => c.id === item.id ? { ...c, sellingPrice: isNaN(newPrice) ? 0 : newPrice } : c));
                            }}
                            className="w-20 text-center h-8"
                            placeholder="Price"
                          />
                       </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>{t('subtotal')}:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('tax')}:</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{t('total')}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">{t('paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('paymentMethods.cash')}</SelectItem>
                  <SelectItem value="momo_mtn">MTN MoMo</SelectItem>
                  <SelectItem value="momo_airtel">Airtel Money</SelectItem>
                  <SelectItem value="bank">{t('paymentMethods.bank')}</SelectItem>
                  <SelectItem value="credit">{t('paymentMethods.credit')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : `${t('completeSale')} - ${formatCurrency(total)}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={showInvoice}
        onOpenChange={setShowInvoice}
        invoice={createdInvoice}
      />
    </div>
  );
}
