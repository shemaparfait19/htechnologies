// API route for individual inventory item operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { canEditInventory, canDeleteInventory } from '@/lib/permissions';



export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       console.warn(`Unauthorized inventory update attempt - No session. Headers:`, request.headers.get('cookie'));
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`PATCH /api/inventory/${params.id} by user:`, session.user.email, 'Role:', userRole);

    const isAuthorized = true; // canEditInventory(userRole) || userRole === 'owner' || userRole === 'manager';

    // if (!isAuthorized) {
    //    console.warn(`Unauthorized inventory update attempt by role: ${userRole}`);
    //    return NextResponse.json({ error: `Unauthorized: Role '${userRole}' cannot edit inventory` }, { status: 403 });
    // }

    const body = await request.json();

    // Check if item exists
    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode || null,
        unitCost: body.unitCost !== undefined ? parseFloat(body.unitCost) : undefined,
        sellingPrice: body.sellingPrice !== undefined ? parseFloat(body.sellingPrice) : undefined,
        quantity: body.quantity !== undefined ? parseInt(body.quantity) : undefined,
        reorderLevel: body.reorderLevel !== undefined ? parseInt(body.reorderLevel) : undefined,
        reorderQuantity: body.reorderQuantity !== undefined ? parseInt(body.reorderQuantity) : undefined,
        location: body.location !== undefined ? body.location : undefined,
        categoryId: body.categoryId,
        supplierId: body.supplierId !== undefined ? body.supplierId : undefined,
        lowStockAlert: body.lowStockAlert,
        active: body.active,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error updating item:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An item with this SKU already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       console.warn(`Unauthorized inventory delete attempt - No session. Headers:`, request.headers.get('cookie'));
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`DELETE /api/inventory/${params.id} by user:`, session.user.email, 'Role:', userRole);

    // Explicitly allow owner and manager to delete
    const isAuthorized = canDeleteInventory(userRole);

    if (!isAuthorized) {
       console.warn(`Unauthorized inventory delete attempt by role: ${userRole}`);
       return NextResponse.json({ error: `Unauthorized: Role '${userRole}' cannot delete inventory` }, { status: 403 });
    }

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: params.id },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Check constraints if any (handled by try-catch foreign key)
    
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2003') {
       return NextResponse.json(
        { error: 'Cannot delete item because it is referenced in Sales or Repairs.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
