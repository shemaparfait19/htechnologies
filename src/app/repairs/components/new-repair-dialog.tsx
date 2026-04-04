'use client';

import { useState, useEffect } from 'react';
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
import { Search, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface NewRepairDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewRepairDialog({ open, onOpenChange, onSuccess }: NewRepairDialogProps) {
  const t = useTranslations('repairs.form');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    deviceType: '',
    brand: '',
    model: '',
    serialNumber: '',
    imei: '',
    problemDescription: '',
    promisedDate: '',
    priority: 'normal',
    estimatedCost: '',
    depositPaid: '',
    assignedTo: '',
  });

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchTechnicians();
      // Set default promised date to 3 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setFormData(prev => ({
        ...prev,
        promisedDate: defaultDate.toISOString().split('T')[0],
      }));
    }
  }, [open]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/users?role=technician');
      if (response.ok) {
        const data = await response.json();
        setTechnicians(data);
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let customerId = formData.customerId;

      // Create new customer if needed
      if (showNewCustomer && formData.customerName && formData.customerPhone) {
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.customerName,
            phone: formData.customerPhone,
            customerType: 'walk_in',
          }),
        });

        if (!customerResponse.ok) throw new Error('Failed to create customer');
        const newCustomer = await customerResponse.json();
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error('Please select or create a customer');
      }

      // Create repair job
      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          deviceType: formData.deviceType,
          brand: formData.brand,
          model: formData.model,
          serialNumber: formData.serialNumber || null,
          imei: formData.imei || null,
          problemDescription: formData.problemDescription,
          promisedDate: formData.promisedDate,
          priority: formData.priority,
          estimatedCost: parseFloat(formData.estimatedCost) || 0,
          depositPaid: parseFloat(formData.depositPaid) || 0,
          assignedTo: formData.assignedTo || null,
          createdBy: user.id,
          photoUrls: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to create repair job');

      const repair = await response.json();

      toast({
        title: 'Repair job created',
        description: `Job ${repair.jobNumber} has been created successfully.`,
      });

      onSuccess();
      resetForm();
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

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      deviceType: '',
      brand: '',
      model: '',
      serialNumber: '',
      imei: '',
      problemDescription: '',
      promisedDate: '',
      priority: 'normal',
      estimatedCost: '',
      depositPaid: '',
      assignedTo: '',
    });
    setShowNewCustomer(false);
    setCustomerSearch('');
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>{t('customer')} *</Label>
            {!showNewCustomer ? (
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchCustomer_placeholder')}
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCustomer(true)}
                  className="w-full md:w-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {tCommon('new')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <Label>{t('newCustomer')}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewCustomer(false)}
                  >
                    {tCommon('cancel')}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder={t('customerName')}
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                  <Input
                    placeholder={t('phoneNumber')}
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {!showNewCustomer && customerSearch && filteredCustomers.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredCustomers.slice(0, 5).map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
                    onClick={() => {
                      setFormData({ ...formData, customerId: customer.id });
                      setCustomerSearch(customer.name);
                    }}
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Device Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceType">{t('deviceType')} *</Label>
              <Input
                id="deviceType"
                placeholder="e.g., Laptop, Phone, Tablet"
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{t('brand')} *</Label>
              <Input
                id="brand"
                placeholder="e.g., HP, Samsung, Apple"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">{t('model')} *</Label>
              <Input
                id="model"
                placeholder="e.g., Galaxy S21, MacBook Pro"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">{t('serialNumber')}</Label>
              <Input
                id="serialNumber"
                placeholder="Optional"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei">{t('imei')}</Label>
            <Input
              id="imei"
              placeholder="Optional"
              value={formData.imei}
              onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
              disabled={loading}
            />
          </div>

          {/* Problem Description */}
          <div className="space-y-2">
            <Label htmlFor="problemDescription">{t('problemDescription')} *</Label>
            <Textarea
              id="problemDescription"
              placeholder={t('problemDescription_placeholder')}
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promisedDate">{t('promisedDate')} *</Label>
              <Input
                id="promisedDate"
                type="date"
                value={formData.promisedDate}
                onChange={(e) => setFormData({ ...formData, promisedDate: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            
             <div className="space-y-2">
              <Label htmlFor="estimatedCost">Agreed Price (RWF)</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t('priority')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('priorities.normal')}</SelectItem>
                  <SelectItem value="urgent">{t('priorities.urgent')}</SelectItem>
                  <SelectItem value="express">{t('priorities.express')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositPaid">{t('deposit')} (RWF)</Label>
              <Input
                id="depositPaid"
                type="number"
                step="0.01"
                placeholder="0"
                value={formData.depositPaid}
                onChange={(e) => setFormData({ ...formData, depositPaid: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">{t('assignTo')}</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectTechnician')} />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? tCommon('loading') + '...' : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
