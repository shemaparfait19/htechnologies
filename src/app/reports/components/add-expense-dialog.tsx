'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Internet',
  'Equipment',
  'Supplies',
  'Salaries',
  'Transport',
  'Marketing',
  'Maintenance',
  'Tools',
  'Food & Drinks',
  'Other',
];

export function AddExpenseDialog({ open, onOpenChange, onSuccess }: AddExpenseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: today,
    notes: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.description || !form.amount) {
      toast({ title: 'Missing fields', description: 'Category, description, and amount are required.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          amount: parseFloat(form.amount),
          expenseDate: form.expenseDate,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record expense');
      }

      toast({ title: 'Expense recorded', description: `${form.category} - ${form.description} saved successfully.` });
      setForm({ category: '', description: '', amount: '', expenseDate: today, notes: '' });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-red-500" />
            Record Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Description *</Label>
            <Input
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What was this expense for?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount (RWF) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.expenseDate}
                onChange={(e) => set('expenseDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional details..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? 'Saving...' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
