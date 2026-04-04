'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DocInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Item {
  description: string;
  qty: string;
  unitPrice: string;
}

export function DocInvoiceDialog({ open, onOpenChange }: DocInvoiceDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    invNumber: '',
    date: today,
    billTo: '',
    lpoNumber: '',
    tax: '',
    bankDetails: '',
    preparedBy: '',
  });

  const [items, setItems] = useState<Item[]>([
    { description: '', qty: '', unitPrice: '' },
  ]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setItem = (index: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const addItem = () => setItems((prev) => [...prev, { description: '', qty: '', unitPrice: '' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const calcTotal = (it: Item) => {
    const qty = parseFloat(it.qty) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return qty * price;
  };

  const subtotal = items.reduce((sum, it) => sum + calcTotal(it), 0);
  const tax = parseFloat(form.tax) || 0;
  const grandTotal = subtotal + tax;

  const fmtNum = (n: number) => n.toLocaleString();

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
    doc.text('INVOICE', 105, 62, { align: 'center' });
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, 65, 196, 65);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No:  INV${form.invNumber}`, 14, 74);
    doc.text(`Date:  ${form.date}`, 140, 74);
    doc.text(`Bill To:  ${form.billTo}`, 14, 82);
    doc.text(`LPO No:  ${form.lpoNumber}`, 14, 90);

    autoTable(doc, {
      startY: 96,
      head: [['No', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: items.map((it, i) => [
        i + 1,
        it.description,
        it.qty,
        `${fmtNum(parseFloat(it.unitPrice) || 0)}`,
        `${fmtNum(calcTotal(it))}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 16 }, 3: { cellWidth: 32 }, 4: { cellWidth: 32 } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`${fmtNum(subtotal)} RWF`, 196, finalY, { align: 'right' });
    doc.text(`Tax:`, 140, finalY + 8);
    doc.text(`${fmtNum(tax)} RWF`, 196, finalY + 8, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Total:`, 140, finalY + 16);
    doc.text(`${fmtNum(grandTotal)} RWF`, 196, finalY + 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    if (form.bankDetails) {
      doc.text(`Bank Details: ${form.bankDetails}`, 14, finalY + 30);
    }

    const sigY = finalY + 44;
    doc.text('Prepared by:', 14, sigY);
    doc.line(14, sigY + 14, 90, sigY + 14);
    doc.text(form.preparedBy || '______________________________', 14, sigY + 20);
    doc.text('Signature & Stamp', 14, sigY + 28);
    doc.line(14, sigY + 42, 90, sigY + 42);

    doc.save(`Invoice-INV${form.invNumber || 'DRAFT'}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Invoice Number</Label>
              <div className="flex">
                <span className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">INV</span>
                <Input className="rounded-l-none" value={form.invNumber} onChange={(e) => set('invNumber', e.target.value)} placeholder="______" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Bill To</Label>
            <Input value={form.billTo} onChange={(e) => set('billTo', e.target.value)} placeholder="Client name or company" />
          </div>
          <div className="space-y-1">
            <Label>LPO No</Label>
            <Input value={form.lpoNumber} onChange={(e) => set('lpoNumber', e.target.value)} placeholder="LPO number (optional)" />
          </div>

          {/* Items table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left w-8">#</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left w-16">Qty</th>
                    <th className="p-2 text-left w-28">Unit Price</th>
                    <th className="p-2 text-right w-24">Total</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Description" />
                      </td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" type="number" value={item.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="0" />
                      </td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" type="number" value={item.unitPrice} onChange={(e) => setItem(i, 'unitPrice', e.target.value)} placeholder="0" />
                      </td>
                      <td className="p-2 text-right font-medium">{fmtNum(calcTotal(item))}</td>
                      <td className="p-1">
                        {items.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 border-t">
                  <tr>
                    <td colSpan={4} className="p-2 text-right font-semibold">Subtotal:</td>
                    <td className="p-2 text-right font-semibold">{fmtNum(subtotal)} RWF</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tax (RWF)</Label>
              <Input type="number" value={form.tax} onChange={(e) => set('tax', e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Grand Total</Label>
              <Input disabled value={`${fmtNum(grandTotal)} RWF`} className="font-bold" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Bank Details</Label>
            <Input value={form.bankDetails} onChange={(e) => set('bankDetails', e.target.value)} placeholder="Bank name, account number, etc." />
          </div>
          <div className="space-y-1">
            <Label>Prepared by</Label>
            <Input value={form.preparedBy} onChange={(e) => set('preparedBy', e.target.value)} placeholder="Name" />
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
