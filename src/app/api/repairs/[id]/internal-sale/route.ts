import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['owner', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the repair with parts and customer
    const repair = await prisma.repairJob.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        partsUsed: {
          include: {
            item: { include: { category: true } },
          },
        },
      },
    });

    if (!repair) {
      return NextResponse.json({ error: 'Repair not found' }, { status: 404 });
    }

    // Filter to only parts that are linked to inventory items
    const inventoryParts = repair.partsUsed.filter((p) => p.itemId);

    if (inventoryParts.length === 0) {
      return NextResponse.json({ error: 'No inventory parts found in this repair' }, { status: 400 });
    }

    // Generate invoice number
    const count = await prisma.salesInvoice.count();
    const invoiceNumber = `INT-${String(count + 1).padStart(4, '0')}-${repair.jobNumber}`;

    const subtotal = inventoryParts.reduce((sum, p) => sum + p.totalCost, 0);

    // Create a SalesInvoice for the internal parts usage
    const invoice = await prisma.salesInvoice.create({
      data: {
        invoiceNumber,
        customerId: repair.customerId || null,
        saleDate: new Date(),
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        paidAmount: subtotal, // Internal = fully paid (it's an accounting entry)
        paymentMethod: 'credit',
        paymentStatus: 'paid',
        userId: session.user.id,
        items: {
          create: inventoryParts.map((p) => ({
            itemId: p.itemId!,
            quantity: p.quantity,
            unitPrice: p.unitCost,
            discount: 0,
            total: p.totalCost,
          })),
        },
      },
    });

    return NextResponse.json({ invoiceNumber: invoice.invoiceNumber, id: invoice.id });
  } catch (error: any) {
    console.error('Error creating internal sale:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
