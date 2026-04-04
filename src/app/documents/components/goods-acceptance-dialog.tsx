'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Printer, Download, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface GoodsAcceptanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Item {
  description: string;
  qty: string;
}

export function GoodsAcceptanceDialog({ open, onOpenChange }: GoodsAcceptanceDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    receivedBy: '',
    position: '',
    date: today,
    notes: '',
  });

  const [items, setItems] = useState<Item[]>([{ description: '', qty: '' }]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setItem = (index: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const addItem = () => setItems((prev) => [...prev, { description: '', qty: '' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const generatePDF = async () => {
    const doc = new jsPDF();

    try {
      const res = await fetch('/logo.png');
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', 92.5, 8, 25, 25);
    } catch {}

    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('H TECHNOLOGIES LTD', 105, 38, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('TIN: 123071609 | Momo pay.: 1700122 | Nyamata/Bugesera', 105, 44, { align: 'center' });
    doc.text('Tel: 0780562454 / 0789379218 / 0796660661', 105, 49, { align: 'center' });
    doc.text('Email: htechnologiesltd1@gmail.com', 105, 54, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('GOODS ACCEPTANCE FORM', 105, 62, { align: 'center' });
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, 65, 196, 65);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 76;

    doc.text('We hereby confirm that the following items have been received in good condition:', 14, y);
    y += 12;

    items.forEach((it, i) => {
      doc.setFont('helvetica', 'bold');
      if (items.length > 1) doc.text(`Item ${i + 1}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Description:`, 14, y + (items.length > 1 ? 8 : 0));
      doc.text(it.description || '—', 55, y + (items.length > 1 ? 8 : 0));
      const offsetY = items.length > 1 ? 16 : 8;
      doc.text(`Quantity:`, 14, y + offsetY);
      doc.text(it.qty || '—', 55, y + offsetY);
      y += items.length > 1 ? 28 : 18;
    });

    y += 4;
    doc.text(`Received by:`, 14, y);
    doc.text(form.receivedBy || '—', 55, y);
    y += 8;
    doc.text(`Position:`, 14, y);
    doc.text(form.position || '—', 55, y);
    y += 8;
    doc.text(`Date:`, 14, y);
    doc.text(form.date, 55, y);

    if (form.notes) {
      y += 10;
      doc.text(`Notes: ${form.notes}`, 14, y);
    }

    y += 20;
    doc.text('Signature & Stamp:', 14, y);
    y += 20;
    doc.line(14, y, 100, y);

    doc.save(`GoodsAcceptance-${form.receivedBy || 'DRAFT'}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Goods Acceptance Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We hereby confirm that the following items have been received in good condition.
          </p>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items Received</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center border rounded-md p-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input className="h-8" value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Item description" />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input className="h-8" value={item.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="Qty" />
                  </div>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive mt-5" onClick={() => removeItem(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Received by</Label>
            <Input value={form.receivedBy} onChange={(e) => set('receivedBy', e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1">
            <Label>Position / Title</Label>
            <Input value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Store Manager" />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any additional notes..." rows={2} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button onClick={generatePDF}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
