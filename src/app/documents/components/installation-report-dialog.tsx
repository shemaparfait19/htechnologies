'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InstallationReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_WORKS = [
  'Replaced compressor (1/3HP)',
  'Installed new filter drier',
  'Vacuum performed',
  'Gas refilled',
  'System tested',
];

export function InstallationReportDialog({ open, onOpenChange }: InstallationReportDialogProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    client: '',
    location: '',
    date: today,
    equipment: '',
    temperature: '',
    systemStatus: 'Working Properly ✔',
    technicianName: '',
    clientRep: '',
  });

  const [works, setWorks] = useState<{ label: string; checked: boolean }[]>(
    DEFAULT_WORKS.map((w) => ({ label: w, checked: false }))
  );
  const [customWork, setCustomWork] = useState('');

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleWork = (i: number) =>
    setWorks((prev) => prev.map((w, idx) => (idx === i ? { ...w, checked: !w.checked } : w)));

  const addCustomWork = () => {
    if (!customWork.trim()) return;
    setWorks((prev) => [...prev, { label: customWork.trim(), checked: true }]);
    setCustomWork('');
  };

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
    doc.text('INSTALLATION REPORT', 105, 62, { align: 'center' });
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(14, 65, 196, 65);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 74;
    const line = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '—', 55, y);
      y += 8;
    };
    line('Client', form.client);
    line('Location', form.location);
    line('Date', form.date);
    line('Equipment', form.equipment);

    // Work done table
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Work Done:', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    works.forEach((w) => {
      doc.text(`${w.checked ? '☑' : '☐'}  ${w.label}`, 18, y);
      y += 7;
    });

    y += 4;
    doc.text(`Temperature after testing: ${form.temperature || '______'} °C`, 14, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`System Status: ${form.systemStatus}`, 14, y);
    y += 16;

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.text('Technician Name:', 14, y);
    doc.text('Client Representative:', 110, y);
    y += 14;
    doc.line(14, y, 90, y);
    doc.line(110, y, 196, y);
    y += 6;
    doc.text(form.technicianName || '______________________________', 14, y);
    doc.text(form.clientRep || '______________________________', 110, y);
    y += 12;
    doc.text('Signature:', 14, y);
    doc.text('Signature & Stamp:', 110, y);
    y += 14;
    doc.line(14, y, 90, y);
    doc.line(110, y, 196, y);

    doc.save(`InstallationReport-${form.client || 'DRAFT'}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Installation Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Client</Label>
              <Input value={form.client} onChange={(e) => set('client', e.target.value)} placeholder="Client name or company" />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Installation location" />
          </div>
          <div className="space-y-1">
            <Label>Equipment</Label>
            <Input value={form.equipment} onChange={(e) => set('equipment', e.target.value)} placeholder="e.g. OT Fridge, AC Unit" />
          </div>

          {/* Work done */}
          <div className="space-y-2">
            <Label>Work Done</Label>
            <div className="border rounded-md p-3 space-y-2">
              {works.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox checked={w.checked} onCheckedChange={() => toggleWork(i)} />
                  <span className="text-sm">{w.label}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Input
                  className="h-8 text-sm"
                  value={customWork}
                  onChange={(e) => setCustomWork(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomWork()}
                  placeholder="Add custom work item..."
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomWork}>Add</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Temperature after testing (°C)</Label>
              <Input value={form.temperature} onChange={(e) => set('temperature', e.target.value)} placeholder="e.g. -18" />
            </div>
            <div className="space-y-1">
              <Label>System Status</Label>
              <Input value={form.systemStatus} onChange={(e) => set('systemStatus', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Technician Name</Label>
              <Input value={form.technicianName} onChange={(e) => set('technicianName', e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1">
              <Label>Client Representative</Label>
              <Input value={form.clientRep} onChange={(e) => set('clientRep', e.target.value)} placeholder="Name" />
            </div>
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
