'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DeliveryNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Item {
  description: string;
  qty: string;
  unit: string;
}

export function DeliveryNoteDialog({ open, onOpenChange }: DeliveryNoteDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    dnNumber: '',
    date: today,
    deliveredTo: '',
    lpoNumber: '',
    remarks: 'Goods delivered in good condition.',
    deliveredBy: '',
    receivedBy: '',
  });

  const [items, setItems] = useState<Item[]>([
    { description: '', qty: '', unit: 'Pcs' },
  ]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setItem = (index: number, field: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));

  const addItem = () => setItems((prev) => [...prev, { description: '', qty: '', unit: 'Pcs' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handlePrint = () => window.print();

  const generatePDF = async () => {
    const doc = new jsPDF();

    // Logo
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

    // Header
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('H TECHNOLOGIES LTD', 105, 38, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('TIN: 123071609 | Momo pay.: 1700122 | Nyamata/Bugesera', 105, 44, { align: 'center' });
    doc.text('Tel: 0780562454 / 0789379218 / 0796660661', 105, 49, { align: 'center' });
    doc.text('Email: htechnologiesltd1@gmail.com', 105, 54, { align: 'center' });

    // Title
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY NOTE', 105, 62, { align: 'center' });
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, 65, 196, 65);

    // Meta info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Delivery Note No:  DN${form.dnNumber}`, 14, 74);
    doc.text(`Date:  ${form.date}`, 140, 74);
    doc.text(`Delivered To:  ${form.deliveredTo}`, 14, 82);
    doc.text(`LPO / Buying Order No:  ${form.lpoNumber}`, 14, 90);

    // Items table
    autoTable(doc, {
      startY: 96,
      head: [['No', 'Description', 'Qty', 'Unit']],
      body: items.map((it, i) => [i + 1, it.description, it.qty, it.unit]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 20 }, 3: { cellWidth: 20 } },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Remarks
    doc.setFontSize(10);
    doc.text(`Remarks: ${form.remarks}`, 14, finalY);

    // Signatures
    const sigY = finalY + 20;
    doc.text('Delivered by:', 14, sigY);
    doc.text('Received by:', 110, sigY);
    doc.line(14, sigY + 14, 90, sigY + 14);
    doc.line(110, sigY + 14, 196, sigY + 14);
    doc.text(form.deliveredBy || '_________________________', 14, sigY + 20);
    doc.text(form.receivedBy || '_________________________', 110, sigY + 20);
    doc.text('Signature:', 14, sigY + 30);
    doc.text('Signature & Stamp:', 110, sigY + 30);
    doc.line(14, sigY + 44, 90, sigY + 44);
    doc.line(110, sigY + 44, 196, sigY + 44);
    doc.text('Date:', 14, sigY + 54);
    doc.line(14, sigY + 66, 90, sigY + 66);

    doc.save(`DeliveryNote-DN${form.dnNumber || 'DRAFT'}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>DN Number</Label>
              <div className="flex">
                <span className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">DN</span>
                <Input className="rounded-l-none" value={form.dnNumber} onChange={(e) => set('dnNumber', e.target.value)} placeholder="______" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Delivered To</Label>
            <Input value={form.deliveredTo} onChange={(e) => set('deliveredTo', e.target.value)} placeholder="Client name or company" />
          </div>
          <div className="space-y-1">
            <Label>LPO / Buying Order No</Label>
            <Input value={form.lpoNumber} onChange={(e) => set('lpoNumber', e.target.value)} placeholder="LPO number" />
          </div>

          {/* Items */}
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
                    <th className="p-2 text-left w-20">Qty</th>
                    <th className="p-2 text-left w-24">Unit</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Item description" />
                      </td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" value={item.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} placeholder="0" />
                      </td>
                      <td className="p-1">
                        <Input className="border-0 h-8 focus-visible:ring-0" value={item.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} placeholder="Pcs" />
                      </td>
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
              </table>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="space-y-1">
            <Label>Remarks</Label>
            <Input value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Delivered by</Label>
              <Input value={form.deliveredBy} onChange={(e) => set('deliveredBy', e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label>Received by</Label>
              <Input value={form.receivedBy} onChange={(e) => set('receivedBy', e.target.value)} placeholder="Name" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Print</Button>
          <Button onClick={generatePDF}><Download className="w-4 h-4 mr-2" />Download PDF</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
