import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { canDeleteSales } from '@/lib/permissions';

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!canDeleteSales(userRole)) {
      return NextResponse.json({ error: `Role '${userRole}' cannot delete sales` }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.salesItem.deleteMany({ where: { invoiceId: params.id } });
      await tx.salesInvoice.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Error deleting sale:', e);
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}

// ─── PUT (Edit Sale) ───────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, customerId, paymentMethod, discount, amountPaid } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the original invoice + its items to reverse inventory
      const originalInvoice = await tx.salesInvoice.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!originalInvoice) throw new Error('Invoice not found');

      // 2. Reverse old inventory deductions (add stock back)
      for (const oldItem of originalInvoice.items) {
        await tx.inventoryItem.update({
          where: { id: oldItem.itemId },
          data: { quantity: { increment: oldItem.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            itemId: oldItem.itemId,
            type: 'IN',
            quantity: oldItem.quantity,
            reason: 'adjustment',
            referenceId: params.id,
            userId: session.user!.id,
            notes: `Sale edit reversal for invoice ${originalInvoice.invoiceNumber}`,
          },
        });
      }

      // 3. Check new stock availability
      for (const newItem of items) {
        const dbItem = await tx.inventoryItem.findUnique({ where: { id: newItem.itemId } });
        if (!dbItem) throw new Error(`Item not found: ${newItem.itemId}`);
        if (dbItem.quantity < newItem.quantity) {
          throw new Error(`Insufficient stock for "${dbItem.name}". Available: ${dbItem.quantity}, Requested: ${newItem.quantity}`);
        }
      }

      // 4. Delete old sales items
      await tx.salesItem.deleteMany({ where: { invoiceId: params.id } });

      // 5. Recalculate totals
      const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
      const tax = 0;
      const total = subtotal + tax - (discount || 0);
      const paid = amountPaid ?? total;

      // 6. Update invoice
      const updatedInvoice = await tx.salesInvoice.update({
        where: { id: params.id },
        data: {
          customerId: customerId || null,
          paymentMethod: paymentMethod || originalInvoice.paymentMethod,
          discount: discount || 0,
          subtotal,
          tax,
          total,
          paidAmount: paid,
          paymentStatus: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
          items: {
            create: items.map((item: any) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              total: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: { include: { item: true } }, customer: true },
      });

      // 7. Deduct new inventory
      for (const newItem of items) {
        await tx.inventoryItem.update({
          where: { id: newItem.itemId },
          data: { quantity: { decrement: newItem.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            itemId: newItem.itemId,
            type: 'OUT',
            quantity: newItem.quantity,
            reason: 'sale',
            referenceId: params.id,
            userId: session.user!.id,
            notes: `Edited sale — invoice ${updatedInvoice.invoiceNumber}`,
          },
        });
      }

      return updatedInvoice;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Error editing sale:', e);
    return NextResponse.json({ error: e.message || 'Error editing sale' }, { status: 500 });
  }
}

// ─── GET single invoice ────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { item: true } },
        customer: true,
        user: { select: { fullName: true } },
      },
    });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
