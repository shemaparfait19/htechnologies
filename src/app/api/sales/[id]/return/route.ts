import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';

// POST /api/sales/[id]/return
// Body: { items: [{ salesItemId, returnQty, reason }] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, reason } = body; // items: [{ itemId, returnQty }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items specified for return' }, { status: 400 });
    }

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const returnItem of items) {
        const { itemId, returnQty } = returnItem;

        if (!itemId || !returnQty || returnQty <= 0) continue;

        // Find the matching sales item to validate qty
        const salesItem = invoice.items.find((si) => si.itemId === itemId);
        if (!salesItem) throw new Error(`Item ${itemId} not found in this invoice`);
        if (returnQty > salesItem.quantity) {
          throw new Error(`Cannot return ${returnQty} — only ${salesItem.quantity} were sold`);
        }

        // Add stock back
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { quantity: { increment: returnQty } },
        });

        // Record return transaction
        await tx.inventoryTransaction.create({
          data: {
            itemId,
            type: 'IN',
            quantity: returnQty,
            reason: 'return',
            referenceId: invoice.id,
            userId: session.user!.id,
            notes: reason || `Customer return — invoice ${invoice.invoiceNumber}`,
            branchId: invoice.branchId || undefined,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: `Return processed for invoice ${invoice.invoiceNumber}. Stock updated.`,
    });
  } catch (e: any) {
    console.error('Error processing return:', e);
    return NextResponse.json({ error: e.message || 'Failed to process return' }, { status: 500 });
  }
}
