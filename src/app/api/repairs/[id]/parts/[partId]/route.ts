// API route for managing individual repair parts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { updateRepairFinancials } from '@/lib/repair-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get part details before deleting
    const part = await prisma.repairPartUsed.findUnique({
      where: { id: params.partId },
    });

    if (!part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    // Delete the part
    await prisma.repairPartUsed.delete({
      where: { id: params.partId },
    });

    // Only return to inventory if it was a stock item
    if (part.itemId) {
        await prisma.inventoryItem.update({
        where: { id: part.itemId },
        data: {
            quantity: {
            increment: part.quantity,
            },
        },
        });

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
        data: {
            itemId: part.itemId,
            quantity: part.quantity,
            type: 'IN',
            reason: 'return',
            notes: `Returned from repair job ${params.id}`,
            userId: session.user.id,
        },
        });
    }

    // Recalculate Repair Totals
    await updateRepairFinancials(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing part:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove part' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; partId: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quantity, customName, unitCost } = body;

    // Get current part state
    const currentPart = await prisma.repairPartUsed.findUnique({
        where: { id: params.partId }
    });

    if (!currentPart) {
        return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    // Handle Inventory Sync if quantity changed and it's a stock item
    if (currentPart.itemId && quantity !== undefined && quantity !== currentPart.quantity) {
        const diff = quantity - currentPart.quantity;
        // diff > 0 means we used MORE => Decrement Stock
        // diff < 0 means we used LESS => Increment Stock (Return)

        // Check if we have enough stock for the increase
        if (diff > 0) {
             const inventoryItem = await prisma.inventoryItem.findUnique({
                where: { id: currentPart.itemId }
             });
             if (!inventoryItem || inventoryItem.quantity < diff) {
                return NextResponse.json({ 
                    error: `Insufficient stock. Available: ${inventoryItem?.quantity || 0}, Need: ${diff}` 
                }, { status: 400 });
             }
        }

        await prisma.inventoryItem.update({
            where: { id: currentPart.itemId },
            data: {
                quantity: {
                    decrement: diff // Works for both positive (dec) and negative (inc)
                }
            }
        });

        // Log transaction
        await prisma.inventoryTransaction.create({
            data: {
                itemId: currentPart.itemId,
                quantity: Math.abs(diff),
                type: diff > 0 ? 'OUT' : 'IN',
                reason: diff > 0 ? 'repair_use' : 'return',
                notes: `Adjustment on repair job ${params.id}`,
                userId: session.user.id,
            }
        });
    }

    // Update the record
    const updatedPart = await prisma.repairPartUsed.update({
        where: { id: params.partId },
        data: {
            quantity: quantity !== undefined ? Number(quantity) : undefined,
            customName: customName, 
            unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
            // Recalculate totalCost for the line item
            ...(quantity !== undefined || unitCost !== undefined ? {
                 totalCost: (Number(unitCost !== undefined ? unitCost : currentPart.unitCost) * 
                             Number(quantity !== undefined ? quantity : currentPart.quantity))
            } : {})
        }
    });

    // Recalculate Repair Totals
    await updateRepairFinancials(params.id);

    return NextResponse.json(updatedPart);

  } catch (error: any) {
    console.error('Error updating part:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update part' },
      { status: 500 }
    );
  }
}
