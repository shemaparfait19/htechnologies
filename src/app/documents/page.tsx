'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Truck, ClipboardCheck, PackageCheck } from 'lucide-react';
import { DeliveryNoteDialog } from './components/delivery-note-dialog';
import { DocInvoiceDialog } from './components/doc-invoice-dialog';
import { InstallationReportDialog } from './components/installation-report-dialog';
import { GoodsAcceptanceDialog } from './components/goods-acceptance-dialog';

export default function DocumentsPage() {
  const [showDeliveryNote, setShowDeliveryNote] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showInstallation, setShowInstallation] = useState(false);
  const [showGoodsAcceptance, setShowGoodsAcceptance] = useState(false);

  const docs = [
    {
      title: 'Delivery Note',
      description: 'Document confirming delivery of goods to a client.',
      icon: Truck,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950',
      action: () => setShowDeliveryNote(true),
    },
    {
      title: 'Invoice',
      description: 'Billing document with item list, prices and totals.',
      icon: FileText,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
      action: () => setShowInvoice(true),
    },
    {
      title: 'Installation Report',
      description: 'Report documenting work done and system testing results.',
      icon: ClipboardCheck,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950',
      action: () => setShowInstallation(true),
    },
    {
      title: 'Goods Acceptance Form',
      description: 'Form confirming receipt of items in good condition.',
      icon: PackageCheck,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950',
      action: () => setShowGoodsAcceptance(true),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-muted-foreground mt-1">
          Generate and print professional business documents.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {docs.map((doc) => {
          const Icon = doc.icon;
          return (
            <Card
              key={doc.title}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={doc.action}
            >
              <CardHeader className="pb-2">
                <div className={`${doc.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`${doc.color} w-6 h-6`} />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {doc.title}
                </CardTitle>
                <CardDescription className="text-sm">{doc.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Create Document
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DeliveryNoteDialog open={showDeliveryNote} onOpenChange={setShowDeliveryNote} />
      <DocInvoiceDialog open={showInvoice} onOpenChange={setShowInvoice} />
      <InstallationReportDialog open={showInstallation} onOpenChange={setShowInstallation} />
      <GoodsAcceptanceDialog open={showGoodsAcceptance} onOpenChange={setShowGoodsAcceptance} />
    </div>
  );
}
