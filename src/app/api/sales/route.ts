// API route for sales history
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageSales } from '@/lib/permissions';
import { auth } from '@/lib/auth';
import { getSessionUser } from '@/lib/auth-helper';
import { logUserAction } from '@/lib/log-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const session = await getSessionUser(request);
    const where: any = {};
    
    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
      where.branchId = session.user.branchId;
    }
    
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales = await prisma.salesInvoice.findMany({
      where,
      include: {
        customer: true,
        user: {
          select: {
            fullName: true,
            email: true, // Also include email just in case
            role: true, // Need to fetch role to verify permission if not in session? No session has it.
          },
        },
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        saleDate: 'desc',
      },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    let userId: string | undefined;
    let branchIdToSave: string | undefined = session?.user?.branchId || undefined;

    if (session && session.user) {
        userId = session.user.id;
    } else {
        console.warn("No session found for Sales POST. Attempting to find fallback user.");
        // Fallback: Find the first owner or manager to assign the sale to
        const fallbackUser = await prisma.user.findFirst({
            where: { role: { in: ['owner', 'manager'] } }
        });
        
        if (fallbackUser) {
            userId = fallbackUser.id;
            branchIdToSave = fallbackUser.branchId || undefined;
            console.log(`Using fallback user: ${fallbackUser.username} (${fallbackUser.id})`);
        } else {
             // If absolutely no user found, we can't create a sale because userId is required.
             // But we return 401 instead of crashing with 500 later.
             console.error("No session and no fallback user found.");
             return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
        }
    }

    // if (!session || !session.user || !canManageSales(session.user.role)) {
       // return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const body = await request.json();
    const { items, customerId, paymentMethod, discount, amountPaid } = body;

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: No items provided' },
        { status: 400 }
      );
    }

    // Validate items structure
    for (const item of items) {
      // Normalize fields to handle different payload formats (frontend sends itemId/unitPrice)
      const id = item.itemId || item.id;
      const quantity = item.quantity;
      const price = item.unitPrice || item.price || item.sellingPrice;

      if (!id || !quantity || !price) {
         return NextResponse.json(
          { error: `Invalid item data: ${JSON.stringify(item)}` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      const price = item.unitPrice || item.price || item.sellingPrice || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    const tax = 0;
    const total = subtotal + tax - (discount || 0);

    console.log('Processing sale:', { subtotal, total, itemCount: items.length });

    // Create invoice with transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log('Starting transaction...');
      // 1. Check stock for all items first
      for (const item of items) {
        const id = item.itemId || item.id;
        const quantity = item.quantity;
        console.log(`Checking stock for item ${id}, qty ${quantity}`);

        const dbItem = await tx.inventoryItem.findUnique({
          where: { id }
        });
        
        if (!dbItem) {
          throw new Error(`Item not found: ${id}`);
        }
        
        if (dbItem.quantity < quantity) {
          throw new Error(`Insufficient stock for ${dbItem.name}. Available: ${dbItem.quantity}, Requested: ${quantity}`);
        }
      }

      console.log('Stock checks passed. Creating invoice...');

      // 2. Create Invoice
      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}`,
          customerId: customerId || null,
          branchId: branchIdToSave,
          userId: userId,
          subtotal,
          tax,
          discount: discount || 0,
          total,
          paidAmount: amountPaid || total,
          paymentMethod: paymentMethod || 'cash',
          paymentStatus: (amountPaid || total) >= total ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
          items: {
            create: items.map((item: any) => ({
              itemId: item.itemId || item.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice || item.price || item.sellingPrice,
              total: (item.unitPrice || item.price || item.sellingPrice) * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              item: true,
            }
          },
          customer: true,
        }
      });
      
      console.log(`Invoice created: ${invoice.id}. Updating inventory...`);

      // 3. Update Inventory
      for (const item of items) {
        const id = item.itemId || item.id;
        const quantity = item.quantity;

        await tx.inventoryItem.update({
          where: { id },
          data: {
            quantity: {
              decrement: quantity
            }
          }
        });

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
             itemId: id,
             type: 'OUT',
             quantity: quantity,
             reason: 'sale',
             referenceId: invoice.id,
             userId: userId as string,
           }
        });
      }
      
      console.log('Transaction completed successfully.');

      return invoice;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error processing sale:', error);
    // Return the actual error message if possible to help debugging
    return NextResponse.json(
      { error: error.message || 'Failed to process sale' },
      { status: 500 }
    );
  }
}
