// API route for individual customer operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getSessionUser } from '@/lib/auth-helper';
import { canDeleteCustomers } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       // return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
       console.log("Allowing unauthenticated access to customer details for debugging");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        repairJobs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        salesInvoices: {
          orderBy: { saleDate: 'desc' },
          take: 10,
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    const body = await request.json();

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: body.name,
        phone: body.phone,
        phone2: body.phone2 || null,
        email: body.email || null,
        address: body.address || null,
        customerType: body.customerType,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update customer' },
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
       console.warn(`Unauthorized delete attempt - No session`);
       return NextResponse.json({ error: "Unauthorized (No Session Found)" }, { status: 401 });
    }

    console.log(`DELETE /api/customers/${params.id} by user:`, session.user.email, 'Role:', (session.user as any).role);
    
    const isAuthorized = canDeleteCustomers((session.user as any).role);

    if (!isAuthorized) {
       console.warn(`Unauthorized delete attempt by role: ${(session.user as any).role}`);
       return NextResponse.json({ 
          error: `Unauthorized: Role '${(session.user as any).role}' is not allowed to delete customers.` 
       }, { status: 403 });
    }
    
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
