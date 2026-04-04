import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';
import { canDeleteSales } from '@/lib/permissions';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    
    if (!session || !session.user) {
       console.warn(`Unauthorized sales delete attempt - No session`);
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    console.log(`DELETE /api/sales/${params.id} by user:`, session.user.email, 'Role:', userRole);

    const isAuthorized = canDeleteSales(userRole);

    if (!isAuthorized) {
       console.warn(`Unauthorized sales delete attempt by role: ${userRole}`);
       return NextResponse.json({ 
          error: `Unauthorized: Role '${userRole}' cannot delete sales` 
       }, { status: 403 });
    }
    
    // Use transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
        // 1. Delete associated sales items first (FK constraint fix)
        await tx.salesItem.deleteMany({
            where: { invoiceId: params.id }
        });

        // 2. Delete the invoice
        await tx.salesInvoice.delete({
            where: { id: params.id }
        });
    });
    
    return NextResponse.json({ success: true });
  } catch(e: any) { 
      console.error("Error deleting sale:", e);
      return NextResponse.json({error: e.message || "Error"}, {status: 500})
  }
}
