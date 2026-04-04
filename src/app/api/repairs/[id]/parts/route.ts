// API route for managing parts used in repairs
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateRepairFinancials } from '@/lib/repair-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { itemId, quantity, name, unitCost } = body;

    // Validation
    if (!quantity) {
       return NextResponse.json(
        { error: 'Quantity is required' },
        { status: 400 }
      );
    }

    if (!itemId && !name) {
      return NextResponse.json(
        { error: 'Either select a part or provide a name' },
        { status: 400 }
      );
    }

    let finalUnitCost = unitCost;
    let finalItemId = itemId;

    // Logic for Stock Item
    if (itemId) {
        // Get item details
        const item = await prisma.inventoryItem.findUnique({
          where: { id: itemId },
        });

        if (!item) {
          return NextResponse.json(
              { error: 'Item not found' },
              { status: 404 }
          );
        }

        // Check stock availability
        if (item.quantity < quantity) {
          return NextResponse.json(
              { error: `Insufficient stock. Only ${item.quantity} available` },
              { status: 400 }
          );
        }

        finalUnitCost = item.sellingPrice;
        
        // Deduct from inventory
        await prisma.inventoryItem.update({
          where: { id: itemId },
          data: {
              quantity: {
              decrement: quantity,
              },
          },
        });

        // Get User ID (Session or Fallback)
        let transactionUserId = 'system';
        const defaultUser = await prisma.user.findFirst();
        if (defaultUser) {
            transactionUserId = defaultUser.id;
        }

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
              itemId,
              quantity: -quantity,
              type: 'OUT',
              reason: 'repair_use',
              notes: `Used in repair job ${params.id}`,
              userId: transactionUserId,
          },
        });
    } else {
        // Logic for Custom/External Item
        finalItemId = null;
        if(!finalUnitCost) {
             return NextResponse.json(
                { error: 'Unit cost is required for custom parts' },
                { status: 400 }
            );           
        }
    }

    // Create parts used record
    const partUsed = await prisma.repairPartUsed.create({
      data: {
        repairJob: {
            connect: { id: params.id }
        },
        ...(finalItemId ? { item: { connect: { id: finalItemId } } } : {}),
        
        customName: name, 
        quantity,
        unitCost: Number(finalUnitCost),
        totalCost: Number(finalUnitCost) * Number(quantity),
      },
      include: {
        item: true,
      },
    });

    // Recalculate Totals
    await updateRepairFinancials(params.id);

    return NextResponse.json(partUsed);
  } catch (error: any) {
    console.error('Error adding part:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add part' },
      { status: 500 }
    );
  }
}
