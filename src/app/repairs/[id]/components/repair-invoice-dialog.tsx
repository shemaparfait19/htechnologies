'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, X, Smartphone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';

interface RepairInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair: any;
}

export function RepairInvoiceDialog({ open, onOpenChange, repair }: RepairInvoiceDialogProps) {
  if (!repair) return null;

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Add Logo
    try {
        // Load logo from public folder
        const logoUrl = '/logo.png';
        const response = await fetch(logoUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        
        // Add logo centered at top (Width 25, Height 25 approx)
        doc.addImage(base64, 'PNG', 92.5, 10, 25, 25);
    } catch (e) {
        console.error("Failed to add logo to PDF:", e);
    }

    // Header
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text('H TECHNOLOGIES LTD', 105, 38, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('TIN: 123071609 | Momo pay.: 1700122 | Nyamata/Bugesera', 105, 44, { align: 'center' });
    doc.text('Tel: 0780562454 / 0789379218 / 0796660661', 105, 49, { align: 'center' });
    doc.text('Email: htechnologiesltd1@gmail.com', 105, 54, { align: 'center' });

    // Invoice Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`REPAIR INVOICE #${repair.jobNumber}`, 14, 70);
    doc.setFontSize(10);
    doc.text(`Date: ${formatDateTime(new Date())}`, 14, 76);
    
    // Customer Info
    doc.text(`Customer: ${repair.customer.name}`, 14, 85);
    if (repair.customer.phone) doc.text(`Phone: ${repair.customer.phone}`, 14, 90);

    // Device Info
    doc.text(`Device: ${repair.deviceType} - ${repair.brand} ${repair.model}`, 14, 100);
    if (repair.serialNumber) doc.text(`SN: ${repair.serialNumber}`, 14, 105);

    // Table
    const tableColumn = ["Description", "Qty", "Cost"];
    const tableRows: any[] = [];

    // Parts
    // Assuming repair.parts is array of { inventoryItem: { name }, quantity, unitPrice/cost }
    // Or repair.partsUsed... reusing structure from InvoiceDialog logic but adapted
    if (repair.partsUsed && repair.partsUsed.length > 0) {
      repair.partsUsed.forEach((part: any) => {
        tableRows.push([
           part.inventoryItem?.name || part.customName || 'Part',
           part.quantity,
           formatCurrency(part.unitCost || part.price || 0)
        ]);
      });
    }

    // Labor / Service
    if (repair.laborCost > 0) {
      tableRows.push(['Service / Labor', '1', formatCurrency(repair.laborCost)]);
    }

    // If no distinct items, show estimated/actual cost summary line
    if (tableRows.length === 0) {
       tableRows.push(['Repair Service (Total)', '1', formatCurrency(repair.actualCost || repair.estimatedCost)]);
    }

    autoTable(doc, {
        startY: 110,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 110;
    
    // Calculate total from parts
    const partsTotal = repair.partsUsed?.reduce((sum: number, part: any) => {
        return sum + (part.totalCost || (part.unitCost * part.quantity) || 0);
    }, 0) || 0;

    const total = partsTotal > 0 ? partsTotal + (repair.laborCost || 0) : (repair.actualCost || repair.estimatedCost);
    const paid = repair.depositPaid || 0;
    const balance = total - paid;

    doc.text(`Total Cost: ${formatCurrency(total)}`, 140, finalY + 10);
    doc.text(`Deposit Paid: ${formatCurrency(paid)}`, 140, finalY + 16);
    
    if (balance > 0) {
       doc.setTextColor(220, 38, 38);
       doc.text(`Balance Due: ${formatCurrency(balance)}`, 140, finalY + 22);
    } else {
       doc.setTextColor(22, 163, 74);
       doc.text(`Balance Due: ${formatCurrency(0)}`, 140, finalY + 22);
    }

    return doc;
  };

  const handleShare = async () => {
    const doc = await generatePDF();
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `Repair_${repair.jobNumber}.pdf`, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: `Repair Invoice ${repair.jobNumber}`,
                text: `Hello, here is your repair invoice from H TECHNOLOGIES LTD.`
            });
        } catch (error) {
            console.log('Error sharing:', error);
        }
    } else {
        doc.save(`Repair_${repair.jobNumber}.pdf`);
        let phone = repair.customer?.phone ? repair.customer.phone.replace(/\D/g, '') : '';
        // Ensure +250
        if (phone.startsWith('07')) {
            phone = '250' + phone.substring(1);
        } else if (phone.startsWith('7')) {
             phone = '250' + phone;
        }
        
        if (phone) {
             const waLink = `https://wa.me/${phone}?text=Hello, your repair for ${repair.deviceType} (${repair.brand} ${repair.model}) is ready. Please find the invoice attached (I just downloaded it for you).`;
             window.open(waLink, '_blank');
        } else {
             alert('Invoice downloaded.');
        }
    }
  };

  // Calculate total from parts to ensure accuracy even if DB is stale
  const partsTotal = repair.partsUsed?.reduce((sum: number, part: any) => {
    return sum + (part.totalCost || (part.unitCost * part.quantity) || 0);
  }, 0) || 0;

  // Use parts total if we have parts, otherwise fallback to existing fields
  const total = partsTotal > 0 ? partsTotal + (repair.laborCost || 0) : (repair.actualCost || repair.estimatedCost);
  const paid = repair.depositPaid || 0;
  const balance = total - paid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Repair Invoice #{repair.jobNumber}</span>
            <div className="flex gap-2 print:hidden">
              <Button onClick={handleShare} size="sm" className="bg-green-600 hover:bg-green-700">
                <Smartphone className="h-4 w-4 mr-2" />
                WhatsApp / Share
              </Button>
              <Button onClick={() => window.print()} size="sm" variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => onOpenChange(false)} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 print:p-8">
          <div className="text-center border-b pb-4 flex flex-col items-center">
            {/* Logo in HTML View */}
            <div className="h-24 w-24 relative mb-2">
                 <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>

            <h1 className="text-3xl font-bold text-blue-600">H TECHNOLOGIES LTD</h1>
            <p className="text-gray-600">TIN: 123071609 | Momo pay.: 1700122</p>
            <p className="text-sm text-gray-500">Tel: 0780562454 / 0789379218 / 0796660661 | Addr: Nyamata/Bugesera</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <h3 className="font-semibold text-lg mb-2">Repair Details</h3>
               <p><span className="font-medium">Job #:</span> {repair.jobNumber}</p>
               <p><span className="font-medium">Device:</span> {repair.deviceType} - {repair.brand} {repair.model}</p>
               <p><span className="font-medium">Status:</span> {repair.status.replace('_', ' ').toUpperCase()}</p>
             </div>
             <div>
               <h3 className="font-semibold text-lg mb-2">Customer</h3>
               <p><span className="font-medium">Name:</span> {repair.customer.name}</p>
               <p><span className="font-medium">Phone:</span> {repair.customer.phone}</p>
             </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {repair.partsUsed && repair.partsUsed.map((part: any, i: number) => (
                 <tr key={i} className="border-b">
                   <td className="p-3">
                       {part.inventoryItem ? part.inventoryItem.name : (part.customName || 'Part')}
                       {!part.inventoryItem && <span className="text-xs text-muted-foreground ml-2">(External)</span>}
                   </td>
                   <td className="text-right p-3">{part.quantity}</td>
                   <td className="text-right p-3">{formatCurrency(part.unitCost || part.price || 0)}</td>
                 </tr>
              ))}
              {repair.laborCost > 0 && (
                <tr className="border-b">
                   <td className="p-3">Service / Labor</td>
                   <td className="text-right p-3">1</td>
                   <td className="text-right p-3">{formatCurrency(repair.laborCost)}</td>
                </tr>
              )}
               {(!repair.partsUsed?.length && !repair.laborCost) && (
                <tr className="border-b">
                   <td className="p-3">Repair Service (Estimate/Fixed)</td>
                   <td className="text-right p-3">1</td>
                   <td className="text-right p-3">{formatCurrency(total)}</td>
                </tr>
               )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
             <div className="w-64 space-y-2">
                <div className="flex justify-between font-bold text-lg">
                   <span>Total:</span>
                   <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                   <span>Paid:</span>
                   <span>{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                   <span>Balance Due:</span>
                   <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                     {formatCurrency(balance > 0 ? balance : 0)}
                   </span>
                </div>
             </div>
          </div>
          
           <div className="text-center border-t pt-4 text-gray-600 text-sm">
            <p>Thank you for choosing H TECHNOLOGIES LTD!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
