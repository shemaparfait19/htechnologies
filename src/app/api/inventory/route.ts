import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { canCreateInventory } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  // Inventory list can be public or protected. Assuming protected for consistency, but keeping it open if it was intended.
  // Actually, let's protect it to be safe, or just check session if logic requires it.
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const session = await getSessionUser(request);
    
    let whereClause: any = { active: true };
    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
       whereClause.branchId = session.user.branchId;
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) { // || !canCreateInventory(session.user.role)) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // console.log("Allowing unauthenticated inventory creation for debugging");

    body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.sku || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, sku, and categoryId are required' },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await prisma.inventoryCategory.findUnique({
      where: { id: body.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: `Category with ID ${body.categoryId} not found` },
        { status: 400 }
      );
    }

    // Create the item
    const item = await prisma.inventoryItem.create({
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode || null,
        unitCost: parseFloat(body.unitCost) || 0,
        sellingPrice: parseFloat(body.sellingPrice) || 0,
        quantity: parseInt(body.quantity) || 0,
        reorderLevel: parseInt(body.reorderLevel) || 10,
        reorderQuantity: parseInt(body.reorderQuantity) || 50,
        location: body.location || null,
        categoryId: body.categoryId,
        supplierId: body.supplierId || null,
        lowStockAlert: body.lowStockAlert || false,
        active: body.active !== undefined ? body.active : true,
        branchId: session.user.branchId || undefined,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error('Error creating item:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: `An item with SKU "${body?.sku}" already exists` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create item' },
      { status: 500 }
    );
  }
}
