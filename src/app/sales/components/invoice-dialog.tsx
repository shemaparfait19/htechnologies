'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, Download, X, Share2, Smartphone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
}

export function InvoiceDialog({ open, onOpenChange, invoice }: InvoiceDialogProps) {
    if (!invoice) return null;

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
            // Page width is ~210mm. Center is 105.
            doc.addImage(base64, 'PNG', 92.5, 10, 25, 25);
        } catch (e) {
            console.error("Failed to add logo to PDF:", e);
        }

        // Header Text (Moved down to accommodate logo)
        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246); // Blue
        doc.text('H TECHNOLOGIES LTD', 105, 38, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('TIN: 123071609 | Momo pay.: 1700122 | Nyamata/Bugesera', 105, 44, { align: 'center' });
        doc.text('Tel: 0780562454 / 0789379218 / 0796660661', 105, 49, { align: 'center' });
        doc.text('Email: htechnologiesltd1@gmail.com', 105, 54, { align: 'center' });

        // Invoice Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`INVOICE #${invoice.invoiceNumber}`, 14, 70);
        doc.setFontSize(10);
        doc.text(`Date: ${formatDateTime(invoice.saleDate)}`, 14, 76);
        
        if (invoice.customer) {
            doc.text(`Customer: ${invoice.customer.name}`, 14, 82);
            if (invoice.customer.phone) doc.text(`Phone: ${invoice.customer.phone}`, 14, 87);
        }

        // Table
        const tableColumn = ["Item", "Qty", "Price", "Total"];
        const tableRows = invoice.items.map((item: any) => [
            item.item?.name || 'Item',
            item.quantity,
            formatCurrency(item.unitPrice),
            formatCurrency(item.total)
        ]);

        autoTable(doc, {
            startY: 95,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
        });

        // Totals
        const finalY = (doc as any).lastAutoTable.finalY || 95;
        doc.text(`Subtotal: ${formatCurrency(invoice.subtotal)}`, 140, finalY + 10);
        doc.text(`Tax: ${formatCurrency(invoice.tax)}`, 140, finalY + 15);
        doc.setFontSize(12);
        doc.text(`Total: ${formatCurrency(invoice.total)}`, 140, finalY + 22);
        doc.setFontSize(10);
        doc.text(`Paid: ${formatCurrency(invoice.paidAmount)}`, 140, finalY + 28);
        if (invoice.paidAmount < invoice.total) {
             doc.setTextColor(220, 38, 38); // Red
             doc.text(`Balance due: ${formatCurrency(invoice.total - invoice.paidAmount)}`, 140, finalY + 34);
        }

        return doc;
    };

    const handleDownload = async () => {
        const doc = await generatePDF();
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    };

    const handleShare = async () => {
        const doc = await generatePDF();
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], `Invoice_${invoice.invoiceNumber}.pdf`, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: `Invoice ${invoice.invoiceNumber}`,
                    text: `Hello, here is your invoice from H TECHNOLOGIES LTD.`
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback for desktop: Download and open WhatsApp Web
            const phone = invoice.customer?.phone ? invoice.customer.phone.replace(/\D/g, '') : '';
            // We can't auto-attach to WA web, but we can download it.
            doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
            if (phone) {
                 const waLink = `https://wa.me/${phone}?text=Hello, please find your invoice attached (I just downloaded it for you).`;
                 window.open(waLink, '_blank');
            } else {
                 alert('Invoice downloaded.');
            }
        }
    };

    const handlePrint = () => {
         window.print();
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>Invoice #{invoice.invoiceNumber}</span>
            <div className="flex flex-wrap justify-center gap-2 print:hidden w-full sm:w-auto">
              <Button onClick={handleShare} size="sm" className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none">
                <Smartphone className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button onClick={() => window.print()} size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={() => onOpenChange(false)} size="sm" variant="ghost" className="flex-none">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        {/* Invoice Content */}
        <div className="space-y-6 print:p-8">
          <div className="text-center border-b pb-4 flex flex-col items-center">
            {/* Logo in HTML View */}
            <div className="h-24 w-24 relative mb-2">
                 <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600">H TECHNOLOGIES LTD</h1>
            <p className="text-gray-600 text-sm md:text-base">TIN: 123071609 | Momo pay.: 1700122</p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Tel: 0780562454 / 0789379218 / 0796660661 | Addr: Nyamata/Bugesera</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Invoice Details</h3>
              <div className="space-y-1 text-sm md:text-base">
                <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
                <p><span className="font-medium">Date:</span> {formatDateTime(invoice.saleDate)}</p>
                <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
            {invoice.customer && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Customer Details</h3>
                <div className="space-y-1 text-sm md:text-base">
                  <p><span className="font-medium">Name:</span> {invoice.customer.name}</p>
                  {invoice.customer.phone && <p><span className="font-medium">Phone:</span> {invoice.customer.phone}</p>}
                  {invoice.customer.email && <p><span className="font-medium">Email:</span> {invoice.customer.email}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="min-w-[500px] px-6 md:px-0">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Item</th>
                    <th className="text-center p-3 text-sm font-semibold">Quantity</th>
                    <th className="text-right p-3 text-sm font-semibold">Unit Price</th>
                    <th className="text-right p-3 text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b text-sm">
                      <td className="p-3">{item.item?.name || 'Item'}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right p-3 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-64 space-y-2 text-sm md:text-base">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid:</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              {invoice.paidAmount < invoice.total && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(invoice.total - invoice.paidAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t pt-4 text-gray-600 text-xs md:text-sm">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
